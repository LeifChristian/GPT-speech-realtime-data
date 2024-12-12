import { useState, useEffect } from 'react';

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

export const useSpeech = (setRez, handleGreeting, setEnteredText) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");

  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        setFinalTranscript(result[0].transcript);
        setEnteredText(result[0].transcript);
        stopRecording();
        handleGreeting(result[0].transcript);
      } else {
        interimTranscript += result[0].transcript;
        setInterimTranscript(interimTranscript);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Error with speech recognition API:", event.error);
    stopRecording();
  };

  const startRecording = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (isRecording) {
      stopSpeakText();
      return;
    }
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition.stop();
  };

  const speakText = (text) => {
    function removeUrls(text) {
      const urlPattern = /https?:\/\/[^\s]+/g;
      return text.replace(urlPattern, '');
    }

    text = removeUrls(text);
    setShowPlayPause(true);

    if ("speechSynthesis" in window) {
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

        // Use the fifth voice in the list (adjust index as needed)
        utterance.voice = speechSynthesis.getVoices()[5];
        utterance.onend = synthesizeSegments;
        speechSynthesis.speak(utterance);
        setIsPlaying(true);
      };

      // Ensure voices are loaded before starting synthesis
      if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.onvoiceschanged = () => synthesizeSegments();
      } else {
        synthesizeSegments();
      }
    } else {
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
      if (isRecording) {
        recognition.stop();
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