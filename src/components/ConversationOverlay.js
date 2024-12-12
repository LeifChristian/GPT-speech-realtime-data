import React from 'react';

const ConversationOverlay = ({ conversation, onClose }) => {
  if (!conversation) {
    return null;
  }

  const history = conversation.history.split(/Question:|Response:/);


  const renderTextWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+?)(?=\))|https?:\/\/[^\s]+/g;
    
    return text.split(/(https?:\/\/[^\s]+?)(?=\))|https?:\/\/[^\s]+/).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'lightblue' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="conversation-overlay">
      <div className="conversation-overlay-content">
        <h2>{conversation.name}</h2>
        <div className="conversation-history" >
          
          {history.map((item, index) => (
            <div
              key={index}
              className={`conversation-item ${index % 2 === 0 ? 'question' : 'response'}`}
         
            >
              {/* {renderTextWithLinks(item.trim())} */}
              {item.length ? index % 2 === 0 && item.length ? 'A:' : 'Q:' : ''}  {item.trim()}
            </div>
          ))}
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ConversationOverlay;
