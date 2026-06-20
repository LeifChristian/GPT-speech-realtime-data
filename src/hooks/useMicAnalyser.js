import { useRef, useState, useCallback } from 'react';

export function useMicAnalyser() {
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const [frequencyData, setFrequencyData] = useState(null);
  const [isMicActive, setIsMicActive] = useState(false);

  const stopMic = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setFrequencyData(null);
    setIsMicActive(false);
  }, []);

  const startMic = useCallback(async () => {
    if (streamRef.current) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setIsMicActive(true);

      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);
        setFrequencyData(new Uint8Array(buffer));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      return true;
    } catch (err) {
      console.error('Microphone access failed:', err);
      stopMic();
      return false;
    }
  }, [stopMic]);

  return { frequencyData, isMicActive, startMic, stopMic };
}
