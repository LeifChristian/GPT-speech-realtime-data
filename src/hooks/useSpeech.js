import { useState, useEffect, useRef, useCallback } from 'react';
import { useMicAnalyser } from './useMicAnalyser';

const RELISTEN_DELAY_MS = 750;
const SKIP_TO_LISTEN_DELAY_MS = 200;
const VOICE_INACTIVITY_MS = 3 * 60 * 1000;

export const useSpeech = (setRez, handleGreeting, setEnteredText) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [toggle, setToggle] = useState(false);
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

  const { frequencyData, isMicActive, startMic, stopMic } = useMicAnalyser();

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

  const startListeningInternal = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !voiceModeRef.current) return;
    if (isProcessingRef.current || awaitingTtsRef.current) return;
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) return;

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
  }, []);

  const stopListeningInternal = useCallback(() => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  /** Invalidate queued TTS segments and stop current utterance */
  const cancelActiveSpeech = useCallback(() => {
    speechSessionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }, []);

  const scheduleRelisten = useCallback((delayMs = RELISTEN_DELAY_MS) => {
    clearRelistenTimer();
    if (!voiceModeRef.current) return;

    relistenTimerRef.current = setTimeout(() => {
      relistenTimerRef.current = null;
      if (!voiceModeRef.current || isProcessingRef.current || awaitingTtsRef.current) return;
      if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) return;
      startListeningInternal();
    }, delayMs);
  }, [clearRelistenTimer, startListeningInternal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
  }, [scheduleRelisten, stopMic, clearRelistenTimer]);

  const stopVoiceMode = useCallback(() => {
    voiceModeRef.current = false;
    setVoiceModeActive(false);
    setVoiceStatus('idle');
    awaitingTtsRef.current = false;
    isProcessingRef.current = false;
    setIsProcessing(false);
    clearRelistenTimer();
    clearInactivityTimer();
    stopListeningInternal();
    stopMic();
    cancelActiveSpeech();
    setIsPlaying(false);
    setShowPlayPause(false);
    setInterimTranscript('');
  }, [clearRelistenTimer, clearInactivityTimer, stopListeningInternal, stopMic, cancelActiveSpeech]);

  useEffect(() => {
    stopVoiceModeRef.current = stopVoiceMode;
  }, [stopVoiceMode]);

  const startVoiceMode = useCallback(async () => {
    if (!recognitionRef.current) {
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
    startListeningInternal();
  }, [startMic, startListeningInternal, cancelActiveSpeech, resetInactivityTimer]);

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

    if (voiceModeRef.current) {
      awaitingTtsRef.current = true;
      setVoiceStatus('speaking');
      stopListeningInternal();
    }

    setShowPlayPause(true);

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onSpeechComplete(options);
      return;
    }

    if (toggle) {
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
  }, [onSpeechComplete, stopListeningInternal, toggle, cancelActiveSpeech]);

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

  /** End TTS immediately and resume listening — stays in voice mode */
  const skipSpeechAndListen = useCallback(() => {
    if (!voiceModeRef.current || isProcessingRef.current) return;
    clearRelistenTimer();
    cancelActiveSpeech();
    resetInactivityTimer();
    awaitingTtsRef.current = false;
    setIsPlaying(false);
    setShowPlayPause(false);
    setVoiceStatus('listening');
    scheduleRelisten(SKIP_TO_LISTEN_DELAY_MS);
  }, [clearRelistenTimer, scheduleRelisten, cancelActiveSpeech, resetInactivityTimer]);

  const toggleMute = useCallback(() => {
    setToggle((prev) => !prev);
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      cancelActiveSpeech();
      awaitingTtsRef.current = false;
      if (voiceModeRef.current) {
        setVoiceStatus('listening');
        scheduleRelisten();
      }
    }
  }, [scheduleRelisten, cancelActiveSpeech]);

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
  }, [clearRelistenTimer, clearInactivityTimer]);

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
