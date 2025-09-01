import React, { useState } from 'react';

const SidePanel = ({
  onSelectConversation,
  onAddConversation,
  onRenameConversation,
  onDeleteConversation,
  selectedConversationId,
  setThisConversation,
  conversations = []
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelectConversation = (conversationId, conversation) => {
    onSelectConversation(conversationId, conversation);
    setThisConversation(conversation);
  };

  const handleAddConversation = (e) => {
    e.stopPropagation();
    const conversationName = prompt('Enter a name for the new conversation');
    if (conversationName) {
      onAddConversation(conversationName);
    }
  };

  const handleRenameConversation = (e, conversationId) => {
    e.stopPropagation();
    // Defer prompting to the hook to avoid duplicate dialogs
    onRenameConversation(conversationId);
  };

  const handleDeleteConversation = (e, conversationId) => {
    e.stopPropagation();
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
    if (confirmDelete) {
      onDeleteConversation(conversationId);
    }
  };

  return (
    <div className="hamburger-menu" style={{ position: 'absolute', top: '0px', left: '0px' }}>
      <div
        style={{ fontSize: '2.5rem', marginLeft: '14px', marginTop: '7px', zIndex: '1001', cursor: 'pointer' }}
        onClick={togglePanel}
      >
        ☰
      </div>
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div
          style={{ fontSize: '2.5rem', zIndex: '1001', position: 'absolute', top: '7px', marginLeft: '14px', cursor: 'pointer' }}
          onClick={togglePanel}
        >
          ☰
        </div>

        <div style={{ marginTop: "20px" }}>cHatZ</div>
        {isOpen && (
          <div className="panel-content">
            <button className="add-conversation" onClick={handleAddConversation}>
              +
            </button>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`conversation-item ${conversation.id === selectedConversationId ? 'selected-conversation' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectConversation(conversation.id, conversation);
                }}
              >
                <span>{conversation.name}</span>
                <button onClick={(e) => handleRenameConversation(e, conversation.id)}>📋</button>
                <button onClick={(e) => handleDeleteConversation(e, conversation.id)}>☠️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;