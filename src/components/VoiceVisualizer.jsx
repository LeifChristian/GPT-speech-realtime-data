import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const VoiceVisualizer = ({ frequencyData, isActive, status = 'listening', interimTranscript = '' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!isActive || !frequencyData || status !== 'listening') {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const barCount = 32;
    const step = Math.max(1, Math.floor(frequencyData.length / barCount));
    const barWidth = width / barCount;
    const gap = Math.max(1, barWidth * 0.15);

    for (let i = 0; i < barCount; i += 1) {
      const value = frequencyData[i * step] / 255;
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
  }, [frequencyData, isActive, status]);

  const statusLabel =
    status === 'listening' ? 'Listening…' :
    status === 'processing' ? 'Thinking…' :
    status === 'speaking' ? 'Speaking…' :
    'Voice mode';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-dark rounded-xl px-4 py-3 border border-white/10">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs uppercase tracking-wider text-blue-300/90 font-medium">
            {statusLabel}
          </span>
          {status === 'listening' && (
            <span className="flex items-center gap-1.5">
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
        {interimTranscript && status === 'listening' && (
          <p className="mt-2 text-sm text-white/70 italic truncate">
            &ldquo;{interimTranscript}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  );
};

VoiceVisualizer.propTypes = {
  frequencyData: PropTypes.object,
  isActive: PropTypes.bool,
  status: PropTypes.oneOf(['listening', 'processing', 'speaking', 'idle']),
  interimTranscript: PropTypes.string,
};

export default VoiceVisualizer;
