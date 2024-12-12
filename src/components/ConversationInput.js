import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const ConversationInput = ({
  enteredText,
  setEnteredText,
  handleGreeting,
  sendStop,
  clearConversationHistory,
  downloadConvo,
  rez
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const inputElement = inputRef.current;
    inputElement.style.height = 'auto';
    if (inputElement.scrollHeight > inputElement.clientHeight) {
      inputElement.style.height = `${inputElement.scrollHeight}px`;
    }
  }, [enteredText]);

  const handleClear = () => {
    const confirmClear = window.confirm("Clear the conversation history?");
    if (confirmClear) {
      clearConversationHistory();
    }
  };

  return (
    <div>
      <br />
      <textarea
        ref={inputRef}
        className="placeholder-style"
        style={{
          background: "black",
          color: "lightgrey",
          borderRadius: ".6em",
          fontWeight: 'bold',
          width: "60vw",
          marginTop: '90px',
          minHeight: "1.2rem",
          textAlign: "center",
          fontSize: '1.2rem',
          overflow: 'auto',
          resize: 'none',
          boxSizing: 'border-box',
          zIndex: 3000
        }}
        value={enteredText}
        onChange={(event) => setEnteredText(event.target.value)}
        placeholder="Enter your question"
      />
  
      <div style={{ position: 'relative', zIndex: 3000 }}>
        <button
          className="button"
          type="button"
          onClick={() => {
            sendStop();
            handleGreeting(enteredText);
          }}
        >
          Send
        </button>
        <button
          className="button"
          onClick={handleClear}
        >
          Reset
        </button>
        <button
          className="button"
          onClick={downloadConvo}
        >
          Save
        </button>
      </div>
    </div>
  );
};

ConversationInput.propTypes = {
  enteredText: PropTypes.string.isRequired,
  setEnteredText: PropTypes.func.isRequired,
  handleGreeting: PropTypes.func.isRequired,
  sendStop: PropTypes.func.isRequired,
  clearConversationHistory: PropTypes.func.isRequired,
  downloadConvo: PropTypes.func.isRequired,
  rez: PropTypes.string.isRequired,
};

export default ConversationInput;