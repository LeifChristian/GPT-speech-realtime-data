import { useState, useEffect, useRef } from 'react';

export const useSpeech = (setRez, handleGreeting, setEnteredText) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  // Initialize SpeechRecognition only where supported (avoids mobile Safari crashes)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      recognitionRef.current = null;
      return;
    }
    if (!recognitionRef.current) {
      const rec = new SR();
      rec.interimResults = true;
      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            setFinalTranscript(result[0].transcript);
            setEnteredText(result[0].transcript);
            setIsRecording(false);
            rec.stop();
            handleGreeting(result[0].transcript);
          } else {
            interim += result[0].transcript;
            setInterimTranscript(interim);
          }
        }
      };
      rec.onerror = (event) => {
        console.error("Error with speech recognition API:", event.error);
        setIsRecording(false);
        rec.stop();
      };
      recognitionRef.current = rec;
    }
  }, [handleGreeting, setEnteredText]);

  const startRecording = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (isRecording) {
      stopSpeakText();
      return;
    }
    if (!recognitionRef.current) {
      alert('Voice input is not supported on this device/browser.');
      return;
    }
    setIsRecording(true);
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text) => {
    function removeUrls(text) {
      const urlPattern = /https?:\/\/[^\s]+/g;
      return text.replace(urlPattern, '');
    }

    text = removeUrls(text || "");
    if (!text.trim()) {
      setShowPlayPause(false);
      setIsPlaying(false);
      return;
    }
    setShowPlayPause(true);

    if (typeof window !== 'undefined' && "speechSynthesis" in window) {
      if (toggle) {
        setShowPlayPause(true);
        return;
      }

      const splitTextIntoSegments = (text) => {
        const maxWordsPerSegment = 32;
        const sentences = text.split(/([.!?:])/);
        const segments = [];
        let currentSegment = "";

        sentences.forEach((sentence) => {
          if (sentence.match(/[.!?:]/)) {
            if (currentSegment) {
              segments.push(currentSegment);
              currentSegment = "";
            }
            segments.push(sentence.trim());
          } else {
            const words = sentence.split(/\s+/);

            words.forEach((word) => {
              if (currentSegment.split(/\s+/).length < maxWordsPerSegment) {
                if (currentSegment.endsWith(".") && word === "com") {
                  currentSegment = currentSegment.slice(0, -1) + word;
                } else {
                  currentSegment += (currentSegment ? " " : "") + word;
                }
              } else {
                segments.push(currentSegment);
                currentSegment = word;
              }
            });
          }
        });

        if (currentSegment) {
          segments.push(currentSegment);
        }

        return segments;
      };

      const segments = splitTextIntoSegments(text);

      const synthesizeSegments = () => {
        if (segments.length === 0) {
          setShowPlayPause(false);
          setIsPlaying(false);
          return;
        }

        const segment = segments.shift();
        const utterance = new SpeechSynthesisUtterance(
          segment
            .replaceAll('Response:', '')
            .replaceAll('.', '')
            .replaceAll('!', '')
            .replaceAll('?', '')
            .replaceAll(":", "")
        );
        const voices = speechSynthesis.getVoices();
        const preferred = voices.find(v => /en/i.test(v.lang) && /(Google US|Samantha|Microsoft|Female|Natural)/i.test(v.name))
          || voices.find(v => /en/i.test(v.lang))
          || voices[0];
        if (preferred) utterance.voice = preferred;
        utterance.rate = 1.0;
        utterance.onend = synthesizeSegments;
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
      };

      // Ensure voices are loaded before starting synthesis
      if (speechSynthesis.getVoices().length === 0) {
        const handler = () => {
          synthesizeSegments();
          speechSynthesis.onvoiceschanged = null;
        };
        speechSynthesis.onvoiceschanged = handler;
      } else {
        synthesizeSegments();
      }
    } else {
      // On unsupported browsers, ensure we don't get stuck in playing state
      setShowPlayPause(false);
      setIsPlaying(false);
      console.error("Speech synthesis is not supported in this browser");
    }
  };

  const stopSpeakText = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setShowPlayPause(false);
    }
  };

  const toggleMute = () => {
    setToggle(prevToggle => !prevToggle);
    if (window.speechSynthesis.speaking) {
      stopSpeakText();
    }
  };

  const pause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (isRecording && recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    isPlaying,
    showPlayPause,
    speakText,
    stopSpeakText,
    toggleMute,
    pause,
    finalTranscript,
    interimTranscript,
    setShowPlayPause,
    setIsPlaying
  };
};