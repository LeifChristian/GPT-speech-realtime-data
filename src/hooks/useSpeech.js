import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMicAnalyser } from './useMicAnalyser';
import { usesMobileVoicePath } from '../utils/voiceDevice';
import { getRecorderMimeType, transcribeAudio } from '../utils/transcribeAudio';

const RELISTEN_DELAY_MS = 750;
const SKIP_TO_LISTEN_DELAY_MS = 200;
const VOICE_INACTIVITY_MS = 3 * 60 * 1000;
const MOBILE_SILENCE_THRESHOLD = 12;
const MOBILE_SILENCE_MS = 1600;
const MOBILE_MAX_RECORDING_MS = 30000;
const MOBILE_MAX_WAIT_FOR_SPEECH_MS = 8000;
const MOBILE_MIN_RECORDING_MS = 600;

export const useSpeech = (setRez, handleGreeting, setEnteredText, windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isMutedRef = useRef(false);
  const speechSynthClearRef = useRef(0);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');

  const recognitionRef = useRef(null);
  const voiceModeRef = useRef(false);
  const isProcessingRef = useRef(false);
  const awaitingTtsRef = useRef(false);
  const relistenTimerRef = useRef(null);
  const handleGreetingRef = useRef(handleGreeting);
  const speechSessionRef = useRef(0);
  const inactivityTimerRef = useRef(null);
  const stopVoiceModeRef = useRef(() => {});
  const resetInactivityTimerRef = useRef(() => {});

  const mobileVoicePath = useMemo(() => usesMobileVoicePath(windowWidth), [windowWidth]);
  const mediaRecorderRef = useRef(null);
  const mobileVadRafRef = useRef(null);
  const mobileHadSpeechRef = useRef(false);
  const mobileStoppingRef = useRef(false);

  const { frequencyData, isMicActive, startMic, stopMic, getStream, getAnalyser } = useMicAnalyser();

  useEffect(() => {
    handleGreetingRef.current = handleGreeting;
  }, [handleGreeting]);

  const clearRelistenTimer = useCallback(() => {
    if (relistenTimerRef.current) {
      clearTimeout(relistenTimerRef.current);
      relistenTimerRef.current = null;
    }
  }, []);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  /** Ends voice mode after 3 minutes with no user speech or skip action */
  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    if (!voiceModeRef.current) return;
    inactivityTimerRef.current = setTimeout(() => {
      inactivityTimerRef.current = null;
      if (voiceModeRef.current) {
        stopVoiceModeRef.current();
      }
    }, VOICE_INACTIVITY_MS);
  }, [clearInactivityTimer]);

  useEffect(() => {
    resetInactivityTimerRef.current = resetInactivityTimer;
  }, [resetInactivityTimer]);

  const isSynthBlockingListen = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    if (!speechSynthesis.speaking && !speechSynthesis.pending) return false;
    // Browsers (especially mobile Safari) can report speaking/pending briefly after cancel()
    if (Date.now() - speechSynthClearRef.current < 300) return false;
    return true;
  }, []);

  /** Invalidate queued TTS segments and stop current utterance */
  const cancelActiveSpeech = useCallback(() => {
    speechSessionRef.current += 1;
    speechSynthClearRef.current = Date.now();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  const flushSpeechSynthesis = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    speechSynthClearRef.current = Date.now();
    speechSynthesis.cancel();
    try {
      speechSynthesis.pause();
      speechSynthesis.resume();
    } catch {
      // ignore — not supported everywhere
    }
  }, []);

  const getVolumeLevel = useCallback(() => {
    const analyser = getAnalyser();
    if (!analyser) return 0;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);
    return buffer.reduce((sum, value) => sum + value, 0) / buffer.length;
  }, [getAnalyser]);

  const cancelMobileVad = useCallback(() => {
    if (mobileVadRafRef.current) {
      cancelAnimationFrame(mobileVadRafRef.current);
      mobileVadRafRef.current = null;
    }
  }, []);

  const stopMobileRecorder = useCallback(() => {
    cancelMobileVad();
    mobileStoppingRef.current = true;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    } else {
      mobileStoppingRef.current = false;
    }
  }, [cancelMobileVad]);

  const startListeningInternal = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !voiceModeRef.current) return;
    if (isProcessingRef.current || awaitingTtsRef.current) return;
    if (isSynthBlockingListen()) return;

    setVoiceStatus('listening');
    setIsRecording(true);
    setInterimTranscript('');
    setFinalTranscript('');

    try {
      rec.start();
    } catch (err) {
      if (err?.name !== 'InvalidStateError') {
        console.error('Speech recognition start failed:', err);
      }
    }
  }, [isSynthBlockingListen]);

  const listenInternalRef = useRef(() => {});
  const scheduleRelistenRef = useRef(() => {});

  const startMobileListeningInternal = useCallback(() => {
    if (!mobileVoicePath || !voiceModeRef.current) return;
    if (isProcessingRef.current || awaitingTtsRef.current) return;
    if (isSynthBlockingListen()) return;

    const stream = getStream();
    if (!stream || typeof MediaRecorder === 'undefined') return;

    cancelMobileVad();
    mobileHadSpeechRef.current = false;
    mobileStoppingRef.current = false;

    const mimeType = getRecorderMimeType();
    const chunks = [];
    let recorder;

    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (err) {
      console.error('MediaRecorder init failed:', err);
      return;
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    recorder.onstop = async () => {
      cancelMobileVad();
      mediaRecorderRef.current = null;
      setIsRecording(false);

      const hadSpeech = mobileHadSpeechRef.current;
      mobileHadSpeechRef.current = false;
      const wasStopping = mobileStoppingRef.current;
      mobileStoppingRef.current = false;

      if (!voiceModeRef.current || !wasStopping) return;

      if (!hadSpeech) {
        setInterimTranscript('');
        if (voiceModeRef.current && !isProcessingRef.current && !awaitingTtsRef.current) {
          scheduleRelistenRef.current();
        }
        return;
      }

      const blobType = mimeType || recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: blobType });
      if (blob.size < 800) {
        setInterimTranscript('');
        if (voiceModeRef.current && !isProcessingRef.current && !awaitingTtsRef.current) {
          scheduleRelistenRef.current();
        }
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);
      setVoiceStatus('processing');

      try {
        const transcript = await transcribeAudio(blob, blobType);
        if (!transcript) {
          setInterimTranscript('');
          if (voiceModeRef.current && !awaitingTtsRef.current) {
            scheduleRelistenRef.current();
          }
          return;
        }

        resetInactivityTimerRef.current();
        setFinalTranscript(transcript);
        setEnteredText(transcript);
        setInterimTranscript(transcript);

        await Promise.resolve(handleGreetingRef.current(transcript));
      } catch (err) {
        console.error('Mobile transcription failed:', err);
        setInterimTranscript('');
        if (voiceModeRef.current && !awaitingTtsRef.current) {
          scheduleRelistenRef.current();
        }
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
        if (voiceModeRef.current && !awaitingTtsRef.current) {
          setVoiceStatus('listening');
          scheduleRelistenRef.current();
        }
      }
    };

    setVoiceStatus('listening');
    setIsRecording(true);
    setInterimTranscript('');

    try {
      recorder.start(250);
    } catch (err) {
      console.error('MediaRecorder start failed:', err);
      mediaRecorderRef.current = null;
      setIsRecording(false);
      return;
    }

    const startedAt = Date.now();
    let lastLoudAt = startedAt;

    const vadTick = () => {
      if (!voiceModeRef.current || mediaRecorderRef.current !== recorder) return;
      if (isProcessingRef.current || awaitingTtsRef.current) {
        mobileVadRafRef.current = requestAnimationFrame(vadTick);
        return;
      }

      const now = Date.now();
      const elapsed = now - startedAt;
      const level = getVolumeLevel();

      if (level > MOBILE_SILENCE_THRESHOLD) {
        mobileHadSpeechRef.current = true;
        lastLoudAt = now;
        resetInactivityTimerRef.current();
      }

      const silenceFor = now - lastLoudAt;
      const shouldStop =
        elapsed >= MOBILE_MAX_RECORDING_MS ||
        (mobileHadSpeechRef.current &&
          silenceFor >= MOBILE_SILENCE_MS &&
          elapsed >= MOBILE_MIN_RECORDING_MS);

      if (shouldStop) {
        stopMobileRecorder();
        return;
      }

      if (!mobileHadSpeechRef.current && elapsed >= MOBILE_MAX_WAIT_FOR_SPEECH_MS) {
        stopMobileRecorder();
        return;
      }

      mobileVadRafRef.current = requestAnimationFrame(vadTick);
    };

    mobileVadRafRef.current = requestAnimationFrame(vadTick);
  }, [
    mobileVoicePath,
    getStream,
    getVolumeLevel,
    cancelMobileVad,
    stopMobileRecorder,
  ]);

  useEffect(() => {
    listenInternalRef.current = mobileVoicePath
      ? startMobileListeningInternal
      : startListeningInternal;
  }, [mobileVoicePath, startMobileListeningInternal, startListeningInternal]);

  const stopListeningInternal = useCallback(() => {
    setIsRecording(false);

    if (mobileVoicePath) {
      mobileStoppingRef.current = false;
      cancelMobileVad();
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null;
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, [mobileVoicePath, cancelMobileVad]);

  const scheduleRelisten = useCallback((delayMs = RELISTEN_DELAY_MS) => {
    clearRelistenTimer();
    if (!voiceModeRef.current) return;

    relistenTimerRef.current = setTimeout(() => {
      relistenTimerRef.current = null;
      if (!voiceModeRef.current || isProcessingRef.current || awaitingTtsRef.current) return;
      if (isSynthBlockingListen()) return;
      listenInternalRef.current();
    }, delayMs);
  }, [clearRelistenTimer, isSynthBlockingListen]);

  useEffect(() => {
    scheduleRelistenRef.current = scheduleRelisten;
  }, [scheduleRelisten]);

  useEffect(() => {
    if (typeof window === 'undefined' || mobileVoicePath) {
      recognitionRef.current = null;
      return undefined;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      recognitionRef.current = null;
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          if (!transcript) continue;

          resetInactivityTimerRef.current();

          setFinalTranscript(transcript);
          setEnteredText(transcript);
          setInterimTranscript('');
          setIsRecording(false);
          isProcessingRef.current = true;
          setIsProcessing(true);
          setVoiceStatus('processing');

          try {
            rec.stop();
          } catch {
            // ignore
          }

          Promise.resolve(handleGreetingRef.current(transcript))
            .catch((err) => console.error('handleGreeting failed:', err))
            .finally(() => {
              isProcessingRef.current = false;
              setIsProcessing(false);
              if (voiceModeRef.current && !awaitingTtsRef.current) {
                setVoiceStatus('listening');
                scheduleRelisten();
              }
            });
        } else {
          interim += result[0].transcript;
          setInterimTranscript(interim);
          if (interim.trim()) {
            resetInactivityTimerRef.current();
          }
        }
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);

      if (event.error === 'no-speech' && voiceModeRef.current && !isProcessingRef.current && !awaitingTtsRef.current) {
        scheduleRelisten();
        return;
      }

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        voiceModeRef.current = false;
        setVoiceModeActive(false);
        setVoiceStatus('idle');
        stopMic();
      }
    };

    rec.onend = () => {
      setIsRecording(false);
      if (
        voiceModeRef.current &&
        !isProcessingRef.current &&
        !awaitingTtsRef.current &&
        !(typeof window !== 'undefined' && window.speechSynthesis?.speaking)
      ) {
        scheduleRelisten();
      }
    };

    recognitionRef.current = rec;

    return () => {
      clearRelistenTimer();
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [scheduleRelisten, stopMic, clearRelistenTimer, mobileVoicePath]);

  const stopVoiceMode = useCallback(() => {
    voiceModeRef.current = false;
    setVoiceModeActive(false);
    setVoiceStatus('idle');
    awaitingTtsRef.current = false;
    isProcessingRef.current = false;
    setIsProcessing(false);
    clearRelistenTimer();
    clearInactivityTimer();
    mobileStoppingRef.current = false;
    cancelMobileVad();
    stopListeningInternal();
    stopMic();
    cancelActiveSpeech();
    setIsPlaying(false);
    setShowPlayPause(false);
    setInterimTranscript('');
  }, [clearRelistenTimer, clearInactivityTimer, stopListeningInternal, stopMic, cancelActiveSpeech, cancelMobileVad]);

  useEffect(() => {
    stopVoiceModeRef.current = stopVoiceMode;
  }, [stopVoiceMode]);

  const startVoiceMode = useCallback(async () => {
    if (mobileVoicePath) {
      if (typeof MediaRecorder === 'undefined') {
        alert('Voice recording is not supported on this device/browser.');
        return;
      }
    } else if (!recognitionRef.current) {
      alert('Voice input is not supported on this device/browser.');
      return;
    }

    cancelActiveSpeech();

    const micOk = await startMic();
    if (!micOk) {
      alert('Microphone access is required for voice mode.');
      return;
    }

    voiceModeRef.current = true;
    setVoiceModeActive(true);
    resetInactivityTimer();
    listenInternalRef.current();
  }, [mobileVoicePath, startMic, cancelActiveSpeech, resetInactivityTimer]);

  const toggleVoiceMode = useCallback(() => {
    if (voiceModeRef.current) {
      stopVoiceMode();
    } else {
      startVoiceMode();
    }
  }, [startVoiceMode, stopVoiceMode]);

  // Legacy alias — Start now enters continuous voice mode
  const startRecording = toggleVoiceMode;

  const stopRecording = useCallback(() => {
    stopListeningInternal();
  }, [stopListeningInternal]);

  const onSpeechComplete = useCallback((options = {}) => {
    if (options.skipRelisten) {
      awaitingTtsRef.current = false;
      if (voiceModeRef.current && !isProcessingRef.current) {
        setVoiceStatus('listening');
        scheduleRelisten();
      }
      return;
    }

    awaitingTtsRef.current = false;
    setIsPlaying(false);
    setShowPlayPause(false);

    if (voiceModeRef.current) {
      setVoiceStatus('listening');
      scheduleRelisten();
    } else {
      setVoiceStatus('idle');
    }
  }, [scheduleRelisten]);

  const speakText = useCallback((text, options = {}) => {
    function removeUrls(input) {
      return String(input || '').replace(/https?:\/\/[^\s]+/g, '');
    }

    const cleaned = removeUrls(text).trim();
    if (!cleaned) {
      onSpeechComplete(options);
      return;
    }

    if (isMutedRef.current) {
      onSpeechComplete(options);
      return;
    }

    if (voiceModeRef.current) {
      awaitingTtsRef.current = true;
      setVoiceStatus('speaking');
      stopListeningInternal();
      if (mobileVoicePath) {
        setInterimTranscript('');
      }
    }

    setShowPlayPause(true);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onSpeechComplete(options);
      return;
    }

    cancelActiveSpeech();
    const sessionId = speechSessionRef.current;

    const splitTextIntoSegments = (input) => {
      const maxWordsPerSegment = 32;
      const sentences = input.split(/([.!?:])/);
      const segments = [];
      let currentSegment = '';

      sentences.forEach((sentence) => {
        if (sentence.match(/[.!?:]/)) {
          if (currentSegment) {
            segments.push(currentSegment);
            currentSegment = '';
          }
          segments.push(sentence.trim());
        } else {
          const words = sentence.split(/\s+/);
          words.forEach((word) => {
            if (currentSegment.split(/\s+/).length < maxWordsPerSegment) {
              currentSegment += (currentSegment ? ' ' : '') + word;
            } else {
              segments.push(currentSegment);
              currentSegment = word;
            }
          });
        }
      });

      if (currentSegment) segments.push(currentSegment);
      return segments.filter(Boolean);
    };

    const segments = splitTextIntoSegments(cleaned);

    const isSessionActive = () => sessionId === speechSessionRef.current;

    const synthesizeSegments = () => {
      if (!isSessionActive()) return;

      if (segments.length === 0) {
        onSpeechComplete(options);
        return;
      }

      const segment = segments.shift();
      const utterance = new SpeechSynthesisUtterance(
        segment
          .replaceAll('Response:', '')
          .replaceAll('.', '')
          .replaceAll('!', '')
          .replaceAll('?', '')
          .replaceAll(':', '')
      );

      const voices = speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /en/i.test(v.lang) && /(Google US|Samantha|Microsoft|Female|Natural)/i.test(v.name)) ||
        voices.find((v) => /en/i.test(v.lang)) ||
        voices[0];
      if (preferred) utterance.voice = preferred;
      utterance.rate = 1.0;

      utterance.onend = () => {
        if (!isSessionActive()) return;
        synthesizeSegments();
      };
      utterance.onerror = (event) => {
        if (!isSessionActive()) return;
        // cancel()/interrupt should not advance to the next queued segment
        if (event?.error === 'interrupted' || event?.error === 'canceled') return;
        synthesizeSegments();
      };

      speechSynthesis.speak(utterance);
      setIsPlaying(true);
    };

    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        if (!isSessionActive()) return;
        synthesizeSegments();
        speechSynthesis.onvoiceschanged = null;
      };
    } else {
      synthesizeSegments();
    }
  }, [onSpeechComplete, stopListeningInternal, cancelActiveSpeech, mobileVoicePath]);

  const stopSpeakText = useCallback(() => {
    cancelActiveSpeech();
    awaitingTtsRef.current = false;
    setIsPlaying(false);
    setShowPlayPause(false);
    if (voiceModeRef.current) {
      setVoiceStatus('listening');
      scheduleRelisten();
    }
  }, [scheduleRelisten, cancelActiveSpeech]);

  /** End TTS immediately; in voice mode resume listening */
  const skipSpeechAndListen = useCallback(() => {
    if (isProcessingRef.current) return;
    clearRelistenTimer();
    cancelActiveSpeech();
    awaitingTtsRef.current = false;
    setIsPlaying(false);
    setShowPlayPause(false);

    if (voiceModeRef.current) {
      resetInactivityTimer();
      setVoiceStatus('listening');
      scheduleRelisten(SKIP_TO_LISTEN_DELAY_MS);
    } else {
      setVoiceStatus('idle');
    }
  }, [clearRelistenTimer, scheduleRelisten, cancelActiveSpeech, resetInactivityTimer]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMutedRef.current;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    cancelActiveSpeech();
    flushSpeechSynthesis();
    awaitingTtsRef.current = false;
    setIsPlaying(false);

    if (voiceModeRef.current) {
      setVoiceStatus('listening');
      scheduleRelisten(nextMuted ? RELISTEN_DELAY_MS : SKIP_TO_LISTEN_DELAY_MS);
    } else {
      setShowPlayPause(false);
    }
  }, [scheduleRelisten, cancelActiveSpeech, flushSpeechSynthesis]);

  const pause = useCallback(() => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearRelistenTimer();
      clearInactivityTimer();
      cancelMobileVad();
      voiceModeRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [clearRelistenTimer, clearInactivityTimer, cancelMobileVad]);

  return {
    isRecording,
    voiceModeActive,
    voiceStatus,
    isProcessing,
    frequencyData,
    isMicActive,
    startRecording,
    startVoiceMode,
    stopVoiceMode,
    toggleVoiceMode,
    stopRecording,
    isPlaying,
    isMuted,
    showPlayPause,
    speakText,
    stopSpeakText,
    skipSpeechAndListen,
    toggleMute,
    pause,
    finalTranscript,
    interimTranscript,
    setShowPlayPause,
    setIsPlaying,
  };
};
