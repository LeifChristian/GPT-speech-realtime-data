import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

const BAR_COUNT = 32;

function drawFlatLine(ctx, width, height) {
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
}

function drawBars(ctx, width, height, levels) {
  const barWidth = width / BAR_COUNT;
  const gap = Math.max(1, barWidth * 0.15);

  for (let i = 0; i < BAR_COUNT; i += 1) {
    const value = levels[i] ?? 0;
    const barHeight = Math.max(4, value * height * 0.9);
    const x = i * barWidth + gap / 2;
    const y = (height - barHeight) / 2;

    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.95)');
    gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.85)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0.7)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth - gap, barHeight, 3);
    ctx.fill();
  }
}

function levelsFromFrequencyData(frequencyData) {
  const step = Math.max(1, Math.floor(frequencyData.length / BAR_COUNT));
  const levels = new Array(BAR_COUNT);
  for (let i = 0; i < BAR_COUNT; i += 1) {
    levels[i] = frequencyData[i * step] / 255;
  }
  return levels;
}

function decorativeLevels(frame) {
  const levels = new Array(BAR_COUNT);
  const t = frame * 0.05;
  for (let i = 0; i < BAR_COUNT; i += 1) {
    const wave =
      Math.sin(t + i * 0.45) * 0.22 +
      Math.sin(t * 1.7 + i * 0.18) * 0.12 +
      0.28;
    levels[i] = Math.max(0.08, Math.min(0.95, wave));
  }
  return levels;
}

const VoiceVisualizer = ({
  frequencyData,
  isActive,
  status = 'listening',
  interimTranscript = '',
  decorativeVisualizer = false,
}) => {
  const canvasRef = useRef(null);
  const transcriptRef = useRef(null);
  const frameRef = useRef(0);

  const showTranscript =
    Boolean(interimTranscript?.trim()) &&
    (status === 'listening' || status === 'processing');

  useEffect(() => {
    if (showTranscript && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [interimTranscript, showTranscript]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let rafId = 0;

    const paint = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (!isActive || status !== 'listening') {
        drawFlatLine(ctx, width, height);
        return;
      }

      if (decorativeVisualizer) {
        frameRef.current += 1;
        drawBars(ctx, width, height, decorativeLevels(frameRef.current));
        return;
      }

      if (!frequencyData) {
        drawFlatLine(ctx, width, height);
        return;
      }

      drawBars(ctx, width, height, levelsFromFrequencyData(frequencyData));
    };

    if (decorativeVisualizer && isActive && status === 'listening') {
      const loop = () => {
        paint();
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
      return () => window.cancelAnimationFrame(rafId);
    }

    paint();
    return undefined;
  }, [frequencyData, isActive, status, decorativeVisualizer]);

  const statusLabel =
    status === 'listening' ? 'Listening…' :
    status === 'processing' ? 'Thinking…' :
    status === 'speaking' ? 'Speaking…' :
    'Voice mode';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-dark rounded-xl px-4 py-3 border border-white/10">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs uppercase tracking-wider text-blue-300/90 font-medium">
            {statusLabel}
          </span>
          {status === 'listening' && (
            <span className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-[10px] text-white/50">REC</span>
            </span>
          )}
        </div>

        <canvas
          ref={canvasRef}
          className="w-full h-14 rounded-lg bg-black/30"
          aria-hidden="true"
        />

        <AnimatePresence initial={false}>
          {showTranscript && (
            <motion.div
              layout
              key="voice-transcript"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div
                ref={transcriptRef}
                className="mt-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 min-h-[2.75rem] max-h-48 overflow-y-auto"
              >
                <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                  {interimTranscript}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

VoiceVisualizer.propTypes = {
  frequencyData: PropTypes.object,
  isActive: PropTypes.bool,
  status: PropTypes.oneOf(['listening', 'processing', 'speaking', 'idle']),
  interimTranscript: PropTypes.string,
  decorativeVisualizer: PropTypes.bool,
};

export default VoiceVisualizer;
