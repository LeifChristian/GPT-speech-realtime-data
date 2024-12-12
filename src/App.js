import React, { useState, useEffect } from "react";
import "./App.css";
import SidePanel from "./components/SidePanel";
import ImageUpload from "./components/ImageUpload";
import ConversationOverlay from "./components/ConversationOverlay";
import ConversationInput from "./components/ConversationInput";
import AudioControls from "./components/AudioControls";
import { useConversations } from "./hooks/useConversations";
import { useSpeech } from "./hooks/useSpeech";
import { usePasswordProtection } from "./hooks/usePasswordProtection";

const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [enteredText, setEnteredText] = useState("");
  const [rez, setRez] = useState("");
  const [isTextCleared, setIsTextCleared] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const {
    isRecording,
    startRecording,
    stopRecording,
    isPlaying,
    showPlayPause,
    speakText,
    stopSpeakText,
    toggleMute,
    pause,
    setShowPlayPause,
    setIsPlaying
  } = useSpeech(setRez, setEnteredText);

  const handleResponse = (response1, bool) => {
    if (bool) {
      // For temporary messages like "Analyzing your image..."
      setRez(response1);
      speakText(response1);
      return;
    }

    setRez(response1);  

    const selectedConversation = conversations.find(
      (conversation) => conversation.id === selectedConversationId
    );

    if (!selectedConversation) return;

    const newHistory = `${selectedConversation.history} Response: ${response1}`;
    const updatedConversations = conversations.map((conversation) =>
      conversation.id === selectedConversationId
        ? { ...conversation, history: newHistory }
        : conversation
    );

    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    speakText(response1);
  };

  const {
    conversations,
    thisConversation,
    handleAddConversation,
    handleRenameConversation,
    handleDeleteConversation,
    clearConversationHistory,
    handleGreeting,
    createAndSelectConversation,
    downloadConvo,
    setThisConversation
  } = useConversations(API_KEY, setRez, handleResponse);

  // New method for handling conversation selection
  const handleSelectConversation = (conversationId, conversation) => {
    setSelectedConversationId(conversationId);
    setThisConversation(conversation);
    setIsOverlayVisible(true);
  };

  usePasswordProtection();

  useEffect(() => {
    const handleWindowResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  const sendStop = () => {
    setIsTextCleared(prev => !prev);
    setRez('');
    stopSpeakText();
  };

  const handleOverlayClose = () => {
    setIsOverlayVisible(false);
  };

  return (
    <div className="App">
      <SidePanel
        onSelectConversation={handleSelectConversation}
        onAddConversation={handleAddConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        setThisConversation={setThisConversation}
        selectedConversationId={selectedConversationId}
        conversations={conversations}
      />
  
      {isOverlayVisible && (
        <ConversationOverlay
          conversation={conversations.find(c => c.id === selectedConversationId)}
          onClose={handleOverlayClose}
        />
      )}
  
      <header className="App-header">
        <h1 style={{ color: 'lightgrey', marginTop: '2vh' }}>ΩmnÎbot-βeta</h1>
  
        <AudioControls
          windowWidth={windowWidth}
          isPlaying={isPlaying}
          showPlayPause={showPlayPause}
          startRecording={startRecording}
          sendStop={sendStop}
          stopSpeakText={stopSpeakText}
          toggleMute={toggleMute}
          pause={pause}
          setRez={setRez}
          setEnteredText={setEnteredText}
          setShowPlayPause={setShowPlayPause}
          setIsPlaying={setIsPlaying}
        />
  
        <ImageUpload
          sendStop={sendStop}
          isTextCleared={isTextCleared}
          setRez={setRez}
          rez={rez}
          handleResponse={handleResponse}
        />
  
        <ConversationInput
          enteredText={enteredText}
          setEnteredText={setEnteredText}
          handleGreeting={handleGreeting}
          sendStop={sendStop}
          clearConversationHistory={clearConversationHistory}
          downloadConvo={downloadConvo}
          rez={rez}
        />
  
        {rez && (
          <div style={{
            color: "lightgrey",
            fontSize: '1.2rem',
            maxHeight: "50vh",
            overflow: "auto",
            width: "100%",
            margin: 'auto',
            marginTop: '1%',
            fontWeight: 'bold',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            zIndex: 3000,
          }}>
            {rez}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;