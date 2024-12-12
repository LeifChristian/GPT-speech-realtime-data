import React from 'react';
import PropTypes from 'prop-types';

const AudioControls = ({
  windowWidth,
  isPlaying,
  showPlayPause,
  startRecording,
  sendStop,
  stopSpeakText,
  toggleMute,
  pause,
  setRez,
  setEnteredText,
  setShowPlayPause,
  setIsPlaying
}) => {
  const handleStop = () => {
    sendStop();
    stopSpeakText();
    setIsPlaying(false);
    setShowPlayPause(false);
    setRez("");
    setEnteredText("");
  };

  return (
    <div className="buttons-container">
      {windowWidth >= 468 && (
        <button 
          className="button"
          onClick={() => startRecording()} 
          type="button"
        >
          Start
        </button>
      )}

      <button
        className="button"
        onClick={handleStop}
        type="button"
      >
        Stop
      </button>

      {isPlaying && (
        <button 
          className="button"
          onClick={() => toggleMute()} 
          type="button"
        >
          Mute
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
  );
};

AudioControls.propTypes = {
  windowWidth: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  showPlayPause: PropTypes.bool.isRequired,
  startRecording: PropTypes.func.isRequired,
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