import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import ModernSidePanel from "./components/ModernSidePanel";
import ModernConversationOverlay from "./components/ModernConversationOverlay";
import AudioControls from "./components/AudioControls";
import ModernUnifiedInput from "./components/ModernUnifiedInput";
import ModernImageSidebar from "./components/ModernImageSidebar";
import { useConversations } from "./hooks/useConversations";
import { useSpeech } from "./hooks/useSpeech";
import { usePasswordProtection } from "./hooks/usePasswordProtection";

const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [enteredText, setEnteredText] = useState("");
  const [rez, setRez] = useState("");
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [sessionImages, setSessionImages] = useState([]);

  // Speech controls are initialized after we get handleGreeting from conversations

  const handleResponse = (response1, bool, imageData = null) => {
    if (bool) {
      // For temporary messages like "Analyzing your image..."
      setRez(response1);
      speakText(response1);
      return;
    }

    // Handle image responses
    if (imageData && imageData.type === 'image') {
      setGeneratedImage(imageData.content);
      // Add to session images
      const newImage = {
        id: Date.now(),
        url: imageData.content,
        prompt: enteredText,
        timestamp: new Date().toISOString()
      };
      setSessionImages(prev => [...prev, newImage]);
      setRez(`Generated image: ${enteredText}`);
      speakText(`I've created an image based on your prompt: ${enteredText}`);
    } else {
      // Handle text responses
      setRez(response1);
      speakText(response1);
    }

    const selectedConversation = conversations.find(
      (conversation) => conversation.id === selectedConversationId
    );

    if (!selectedConversation) return;

    const responseText = imageData ? `Generated image: ${enteredText}` : response1;
    const newHistory = `${selectedConversation.history} Response: ${responseText}`;
    const updatedConversations = conversations.map((conversation) =>
      conversation.id === selectedConversationId
        ? { ...conversation, history: newHistory }
        : conversation
    );

    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const {
    conversations,
    handleAddConversation,
    handleRenameConversation,
    handleDeleteConversation,
    clearConversationHistory,
    handleGreeting,
    downloadConvo,
    setThisConversation
  } = useConversations(API_KEY, setRez, handleResponse);

  // Now that handleGreeting is defined, wire up speech controls with correct args
  const {
    startRecording,
    isPlaying,
    showPlayPause,
    speakText,
    stopSpeakText,
    toggleMute,
    pause,
    setShowPlayPause,
    setIsPlaying
  } = useSpeech(setRez, handleGreeting, setEnteredText);

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

  // Create test conversations if none exist
  useEffect(() => {
    // Clear old conversations first for testing
    const existingConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    console.log('Existing conversations on load:', existingConversations);

    if (existingConversations.length === 0) {
      console.log('Creating test conversations...');
      const testConversations = [
        {
          id: "test_welcome_" + Date.now(),
          name: "Welcome Chat",
          history: "Question: Hello there! Response: Hi! Welcome to ΩmnÎbot! I can help with conversations and create images. How can I assist you today? Question: That's great! Response: I'm glad you're excited! Feel free to ask me anything or request an image to be generated."
        },
        {
          id: "test_image_" + Date.now() + 1,
          name: "Image Generation Demo",
          history: "Question: Can you draw a cyberpunk city? Response: Generated image: A stunning cyberpunk cityscape with neon lights and futuristic architecture. Question: That looks amazing! Response: I'm glad you like it! The cyberpunk aesthetic with neon lights and towering buildings creates such a cool atmosphere."
        },
        {
          id: "test_ai_" + Date.now() + 2,
          name: "AI Discussion",
          history: "Question: What is artificial intelligence? Response: Artificial intelligence (AI) is a branch of computer science that aims to create systems capable of performing tasks that typically require human intelligence, such as learning, reasoning, problem-solving, and perception. Question: Can you give examples? Response: Sure! Examples include virtual assistants like Siri and Alexa, recommendation systems, autonomous vehicles, medical diagnosis systems, and language models like myself."
        }
      ];

      localStorage.setItem('conversations', JSON.stringify(testConversations));
      console.log('✅ Created test conversations:', testConversations);

      // Force page reload to ensure conversations are loaded
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      console.log('Using existing conversations:', existingConversations);
    }
  }, []);

  const sendStop = () => {
    setRez('');
    setGeneratedImage(null);
    stopSpeakText();
  };

  const handleOverlayClose = () => {
    setIsOverlayVisible(false);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Effects - semi-transparent gradient over Matrix image */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-gray-800/40 to-black/60 pointer-events-none" />

      <ModernSidePanel
        onSelectConversation={handleSelectConversation}
        onAddConversation={handleAddConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        setThisConversation={setThisConversation}
        selectedConversationId={selectedConversationId}
        conversations={conversations}
      />

      <AnimatePresence>
        {isOverlayVisible && (
          <ModernConversationOverlay
            conversation={conversations.find(c => c.id === selectedConversationId)}
            onClose={handleOverlayClose}
          />
        )}
      </AnimatePresence>

      {/* Modern Image Sidebar */}
      <ModernImageSidebar
        sessionImages={sessionImages}
        onImageSelect={setGeneratedImage}
        generatedImage={generatedImage}
      />

      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-4">
            ΩmnÎbot
          </h1>
          <p className="text-gray-400 text-lg">
            Intelligent conversations with image generation
          </p>
        </motion.div>

        {/* Audio Controls */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
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
        </motion.div>

        {/* Modern Unified Input */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-4xl mb-8"
        >
          <ModernUnifiedInput
            enteredText={enteredText}
            setEnteredText={setEnteredText}
            handleResponse={handleResponse}
            sendStop={sendStop}
            clearConversationHistory={clearConversationHistory}
            downloadConvo={downloadConvo}
            rez={rez}
            handleGreeting={handleGreeting}
          />
        </motion.div>

        {/* Response Display */}
        <AnimatePresence>
          {rez && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-4xl"
            >
              <div className="glass-dark p-6 rounded-xl text-gray-100 text-lg leading-relaxed max-h-96 overflow-y-auto">
                <div className="whitespace-pre-wrap font-medium">
                  {rez}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Image Display */}
        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mt-8 cursor-pointer"
              onClick={() => setGeneratedImage(null)}
            >
              <div className="glass-dark p-4 rounded-2xl">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-96 rounded-xl shadow-2xl object-contain"
                />
                <p className="text-center text-gray-400 text-sm mt-3">
                  Click to close • Generated with AI
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;