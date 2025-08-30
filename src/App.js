import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import "./App.css";
import ModernSidePanel from "./components/ModernSidePanel";
import ModernConversationOverlay from "./components/ModernConversationOverlay";
import AudioControls from "./components/AudioControls";
import ModernUnifiedInput from "./components/ModernUnifiedInput";
import ModernImageSidebar from "./components/ModernImageSidebar";
import { useConversations } from "./hooks/useConversations";
import { useSpeech } from "./hooks/useSpeech";
import { usePasswordProtection } from "./hooks/usePasswordProtection";
import { Button } from "./components/ui/Button";
import { apiUrl } from "./utils/api";

const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [enteredText, setEnteredText] = useState("");
  const [rez, setRez] = useState("");
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [sessionImages, setSessionImages] = useState([]);
  const [conversationThumbnails, setConversationThumbnails] = useState({});
  const [currentConversationName, setCurrentConversationName] = useState('');
  const responseRef = useRef(null);

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
      setIsImageModalOpen(false);
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
    const responseText = imageData ? `Generated image: ${enteredText}` : response1;
    // Persist response to the selected conversation
    appendResponseToHistory(responseText);
    // Auto-scroll to response on mobile
    setTimeout(() => {
      try {
        if (responseRef.current) {
          responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.scrollBy({ top: -80, behavior: 'smooth' });
        }
      } catch { }
    }, 50);
  };

  const addConversationThumbnail = (conversationId, url, prompt) => {
    if (!conversationId || !url) return;
    setConversationThumbnails(prev => {
      const list = prev[conversationId] || [];
      const newThumb = { id: Date.now(), url, prompt: prompt || '', ts: Date.now() };
      return { ...prev, [conversationId]: [...list, newThumb] };
    });
  };

  const downloadCurrentImage = async (url) => {
    try {
      const response = await fetch(apiUrl(`image/download?url=${encodeURIComponent(url)}`));
      if (!response.ok) throw new Error('Proxy download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const {
    conversations,
    selectedConversationId: hookSelectedConversationId,
    thisConversation,
    handleAddConversation,
    handleRenameConversation,
    handleDeleteConversation,
    clearConversationHistory,
    handleGreeting,
    downloadConvo,
    setThisConversation,
    handleSelectConversation: selectConversation,
    appendResponseToHistory,
    appendQuestionToHistory
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

  // New method for handling conversation selection (sync with hook state)
  const onSelectConversation = (conversationId, conversation) => {
    // Update local UI state
    setSelectedConversationId(conversationId);
    setThisConversation(conversation);
    setCurrentConversationName(conversation?.name || '');
    setIsOverlayVisible(true);
    // Sync with hook's internal selection so features like Save work
    if (typeof selectConversation === 'function') {
      selectConversation(conversationId, conversation);
    }
  };

  // Keep header name in sync with selection and rename updates
  useEffect(() => {
    const selected = conversations.find(c => c.id === selectedConversationId);
    setCurrentConversationName(selected?.name || '');
  }, [conversations, selectedConversationId]);

  // Auto-sync when the hook creates/selects a conversation (e.g., first prompt)
  useEffect(() => {
    if (hookSelectedConversationId) {
      setSelectedConversationId(hookSelectedConversationId);
      // Force refresh conversations from localStorage to catch new ones
      const stored = JSON.parse(localStorage.getItem('conversations') || '[]');
      const found = stored.find(c => c.id === hookSelectedConversationId);
      if (found) {
        setThisConversation(found);
        setCurrentConversationName(found.name || 'Untitled');
      } else if (thisConversation) {
        setThisConversation(thisConversation);
        setCurrentConversationName(thisConversation.name || 'Untitled');
      }
    }
  }, [hookSelectedConversationId, thisConversation, setThisConversation]);

  usePasswordProtection();

  useEffect(() => {
    const handleWindowResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  // Remove old sample auto-seed logic

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

      {/* Toggle Conversation History Button (top-right, offset when image sidebar present) */}
      <motion.div className={`fixed top-4 ${sessionImages.length ? 'right-24' : 'right-4'} z-[60]`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="glass"
          size="icon"
          onClick={() => setIsOverlayVisible((v) => !v)}
          disabled={!selectedConversationId}
          className="text-white border-white/20"
          aria-label="Toggle conversation history"
          title={selectedConversationId ? "Show/Hide Conversation History" : "Select a conversation to view history"}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </motion.div>

      <ModernSidePanel
        onSelectConversation={onSelectConversation}
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
            handleGreeting={handleGreeting}
            handleResponse={handleResponse}
            appendQuestionToHistory={appendQuestionToHistory}
            thumbnails={conversationThumbnails[selectedConversationId] || []}
            addThumbnail={(url, prompt) => addConversationThumbnail(selectedConversationId, url, prompt)}
            speakText={speakText}
          />
        )}
      </AnimatePresence>

      {/* Modern Image Sidebar */}
      <ModernImageSidebar
        sessionImages={sessionImages}
        onImageSelect={(url) => {
          setGeneratedImage(url);
          setIsImageModalOpen(true);
        }}
        generatedImage={generatedImage}
      />

      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        {/* Current conversation name */}
        {currentConversationName && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-white font-bold text-lg text-center max-w-xs break-words">
            {currentConversationName}
          </div>
        )}
        {/* Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center mb-4"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-2">
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
          className="mb-4"
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
          className="w-full max-w-4xl mb-4"
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
            appendQuestionToHistory={appendQuestionToHistory}
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
              ref={responseRef}
            >
              <div className="glass-dark p-6 rounded-xl text-gray-100 text-lg leading-relaxed max-h-96 overflow-y-auto">
                <div className="whitespace-pre-wrap font-medium">
                  {rez}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Image Display (inline card with controls) */}
        <AnimatePresence>
          {generatedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mt-8 cursor-pointer"
              onClick={() => setIsImageModalOpen(true)}
            >
              <div className="glass-dark p-4 rounded-2xl">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="max-w-full max-h-96 rounded-xl shadow-2xl object-contain"
                />
                <div className="flex justify-center gap-4 mt-3 text-gray-300 text-sm">
                  <button
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsImageModalOpen(true);
                    }}
                  >
                    Expand
                  </button>
                  <button
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGeneratedImage(null);
                    }}
                  >
                    X
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await downloadCurrentImage(generatedImage);
                    }}
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                  >
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen modal for generated image */}
        <AnimatePresence>
          {isImageModalOpen && generatedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setIsImageModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="relative max-w-5xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img src={generatedImage} alt="Generated" className="w-full h-full object-contain rounded-lg shadow-2xl" />
                <button
                  className="absolute top-4 right-4 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  Close
                </button>
                <button
                  onClick={async () => { await downloadCurrentImage(generatedImage); }}
                  className="absolute top-4 right-20 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white"
                >
                  Download
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;