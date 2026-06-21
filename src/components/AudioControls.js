import React from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';
import VoiceVisualizer from './VoiceVisualizer';
import { canUseVoice } from '../utils/voiceDevice';

const AudioControls = ({
  windowWidth,
  isPlaying,
  isMuted,
  showPlayPause,
  voiceModeActive,
  voiceStatus,
  isProcessing,
  frequencyData,
  interimTranscript,
  startRecording,
  stopVoiceMode,
  skipSpeechAndListen,
  sendStop,
  stopSpeakText,
  toggleMute,
  pause,
  setRez,
  setEnteredText,
  setShowPlayPause,
  setIsPlaying,
}) => {
  const showVoiceButton = canUseVoice(windowWidth);
  const compactLabels = windowWidth < 640;

  const handleStop = () => {
    stopVoiceMode?.();
    sendStop();
    stopSpeakText();
    setIsPlaying(false);
    setShowPlayPause(false);
    setRez('');
    setEnteredText('');
  };

  const visualizerStatus = voiceStatus === 'idle' && voiceModeActive ? 'listening' : voiceStatus;

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto px-2 sm:px-0">
      <div className="buttons-container audio-controls-buttons">
        {showVoiceButton && (
          <button
            className={`button ${voiceModeActive ? 'ring-2 ring-blue-400/60' : ''}`}
            onClick={() => startRecording()}
            type="button"
            aria-pressed={voiceModeActive}
          >
            {voiceModeActive
              ? compactLabels
                ? 'On'
                : 'Voice On'
              : compactLabels
                ? 'Voice'
                : 'Start Voice'}
          </button>
        )}

        <button
          className="button"
          onClick={handleStop}
          type="button"
        >
          Stop
        </button>

        {showPlayPause && (isPlaying || voiceStatus === 'speaking') && (
          <button
            className="button"
            onClick={() => skipSpeechAndListen?.()}
            type="button"
            title={voiceModeActive ? 'Skip speech and start listening' : 'Skip speech'}
          >
            FFwd
          </button>
        )}

        {(isPlaying || isMuted) && (
          <button
            className={`button ${isMuted ? 'ring-2 ring-amber-400/60' : ''}`}
            onClick={() => toggleMute()}
            type="button"
            aria-pressed={isMuted}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        )}

        {showPlayPause && (
          <button
            className="button"
            onClick={() => pause()}
            type="button"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {voiceModeActive && (
          <VoiceVisualizer
            frequencyData={frequencyData}
            isActive={voiceModeActive}
            status={visualizerStatus}
            interimTranscript={interimTranscript}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

AudioControls.propTypes = {
  windowWidth: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isMuted: PropTypes.bool,
  showPlayPause: PropTypes.bool.isRequired,
  voiceModeActive: PropTypes.bool,
  voiceStatus: PropTypes.string,
  isProcessing: PropTypes.bool,
  frequencyData: PropTypes.object,
  interimTranscript: PropTypes.string,
  startRecording: PropTypes.func.isRequired,
  stopVoiceMode: PropTypes.func,
  skipSpeechAndListen: PropTypes.func,
  sendStop: PropTypes.func.isRequired,
  stopSpeakText: PropTypes.func.isRequired,
  toggleMute: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired,
  setRez: PropTypes.func.isRequired,
  setEnteredText: PropTypes.func.isRequired,
  setShowPlayPause: PropTypes.func.isRequired,
  setIsPlaying: PropTypes.func.isRequired,
};

export default AudioControls;
