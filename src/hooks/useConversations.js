import { useState, useEffect } from 'react';
import { apiUrl } from '../utils/api';

export const useConversations = (apiKey, setRez, handleResponse) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [thisConversation, setThisConversation] = useState(null);
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (msg) => {
    const entry = `${new Date().toLocaleTimeString()}: ${msg}`;
    setDebugLog(prev => [...prev.slice(-19), entry]);
    console.log('🔥', entry);
  };

  useEffect(() => {
    const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(storedConversations);
    const storedId = localStorage.getItem('selectedConversationId');
    if (storedId) {
      const conv = storedConversations.find(c => c.id === storedId);
      if (conv) {
        setSelectedConversationId(storedId);
        setThisConversation(conv);
        addDebugLog(`Loaded selected conversation from storage: ${storedId}`);
      } else {
        localStorage.removeItem('selectedConversationId');
      }
    }
  }, []);

  // Listen for storage events to refresh conversations
  useEffect(() => {
    const handleStorageChange = () => {
      const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      setConversations(storedConversations);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    console.log('Conversations updated:', conversations);
    console.log('Selected conversation ID:', selectedConversationId);
    console.log('Current conversation:', thisConversation);
  }, [conversations, selectedConversationId, thisConversation]);

  const handleAddConversation = (name) => {
    const newConversation = {
      id: Date.now().toString(),
      name: name,
      history: '',
    };

    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setSelectedConversationId(newConversation.id);
    setThisConversation(newConversation);

    addDebugLog(`Added to conversations list: ${name}, total: ${updatedConversations.length}`);
    return newConversation;
  };

  const createAndSelectConversation = async () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }) + ' ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newConversation = {
      id: Date.now().toString(),
      name: `Convo ${formattedDate}`,
      history: ''
    };

    const updatedConversations = [...conversations, newConversation];
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));

    setConversations(updatedConversations);
    setSelectedConversationId(newConversation.id);
    setThisConversation(newConversation);
    localStorage.setItem('selectedConversationId', newConversation.id);

    return newConversation;
  };

  // hooks/useConversations.js
  // ... other code remains the same ...

  const handleGreeting = async (theStuff) => {
    addDebugLog(`handleGreeting called with: ${theStuff}, selectedId: ${selectedConversationId}`);
    try {
      let currentConversation = conversations.find(conv => conv.id === selectedConversationId);

      if (!currentConversation) {
        // Auto-create if none selected
        const now = new Date();
        const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const autoName = `Convo ${date} ${time}`;
        addDebugLog(`Auto-creating conversation: ${autoName}`);
        currentConversation = {
          id: Date.now().toString(),
          name: autoName,
          history: ''
        };
        let updatedConversations = [...conversations, currentConversation];
        setConversations(updatedConversations);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        localStorage.setItem('selectedConversationId', currentConversation.id);
        setSelectedConversationId(currentConversation.id);
        setThisConversation(currentConversation);
        addDebugLog(`Created and selected conversation: ${currentConversation.id}`);
      }

      // Append question locally
      let updatedHistory = currentConversation.history ? `${currentConversation.history} Question: ${theStuff}` : `Question: ${theStuff}`;
      let updatedConversation = { ...currentConversation, history: updatedHistory };

      // Send request
      const payload = {
        text: `${updatedHistory} <-- Text before this sentence is conversation history so far between you and me. Do NOT include timestamps in responses, timestamps provide context for when this conversation is taking place. responses will be spoken back to user using TTS. Using this information and context, answer the following question, calling functions if asked current information -->  "${theStuff}"`,
        code: apiKey,
      };

      const response = await fetch(apiUrl('chat/greeting'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const reply = responseData.reply;

        // Append response locally
        updatedHistory = `${updatedHistory} Response: ${reply}`;
        updatedConversation = { ...updatedConversation, history: updatedHistory };

        // Update state and storage once with both question and response
        let updatedConversations = conversations.map(c => c.id === updatedConversation.id ? updatedConversation : c);
        if (!conversations.some(c => c.id === updatedConversation.id)) {
          updatedConversations = [...conversations, updatedConversation];
        }
        setConversations(updatedConversations);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
        setThisConversation(updatedConversation);

        // Update UI
        setRez(reply);
        handleResponse(reply);
      }
    } catch (error) {
      addDebugLog(`Error in handleGreeting: ${error.message}`);
      console.error("Error -->", error);
    }
  };

  const handleSelectConversation = (conversationId, conversationObject) => {
    setSelectedConversationId(conversationId);
    setThisConversation(conversationObject);
    localStorage.setItem('selectedConversationId', conversationId);
    addDebugLog(`Selected conversation: ${conversationId}`);
  };

  // Remove the fallback creation from appendResponseToHistory and appendQuestionToHistory, assume conversation exists
  const appendResponseToHistory = (responseText) => {
    if (!selectedConversationId) {
      addDebugLog('No conversation selected for append response');
      return;
    }
    const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
    if (!selectedConversation) {
      addDebugLog('Selected conversation not found for append response');
      return;
    }
    const newHistory = `${selectedConversation.history} Response: ${responseText}`;
    const updatedConversation = { ...selectedConversation, history: newHistory };
    const updatedConversations = conversations.map(conv => conv.id === selectedConversationId ? updatedConversation : conv);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setThisConversation(updatedConversation);
  };

  const appendQuestionToHistory = (questionText) => {
    if (!selectedConversationId) {
      addDebugLog('No conversation selected for append question');
      return;
    }
    const selectedConversation = conversations.find(conv => conv.id === selectedConversationId);
    if (!selectedConversation) {
      addDebugLog('Selected conversation not found for append question');
      return;
    }
    const newHistory = selectedConversation.history ? `${selectedConversation.history} Question: ${questionText}` : `Question: ${questionText}`;
    const updatedConversation = { ...selectedConversation, history: newHistory };
    const updatedConversations = conversations.map(conv => conv.id === selectedConversationId ? updatedConversation : conv);
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setThisConversation(updatedConversation);
  };

  const handleRenameConversation = (conversationId) => {
    const selectedConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );

    if (selectedConversation) {
      const newConversationName = prompt('Enter a new name for the conversation', selectedConversation.name);
      if (newConversationName) {
        const updatedConversations = conversations.map((conversation) => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              name: newConversationName,
            };
          }
          return conversation;
        });
        setConversations(updatedConversations);
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
      }
    }
  };

  const handleDeleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(
      (conversation) => conversation.id !== conversationId
    );
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
      setThisConversation(null);
      localStorage.removeItem('selectedConversationId');
    }
  };

  const clearConversationHistory = () => {
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id === selectedConversationId) {
        return {
          ...conversation,
          history: '',
        };
      }
      return conversation;
    });
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
  };

  const downloadConvo = () => {
    const selectedConversation = conversations.find(
      (conversation) => conversation.id === selectedConversationId
    );
    if (!selectedConversation) {
      console.log('No conversation selected.');
      return;
    }
    const conversationHistory = selectedConversation.history;
    const conversationName = selectedConversation.name;
    if (!conversationHistory) {
      console.log('Nothing to export.');
      return;
    }
    const conversationBlob = new Blob([
      // Ensure Questions and Responses are on new lines for readability
      String(conversationHistory)
        .replace(/\s*Question:\s*/g, '\nQuestion: ')
        .replace(/\s*Response:\s*/g, '\nResponse: ')
        .trim()
    ], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(conversationBlob);
    const tempLink = document.createElement('a');
    tempLink.href = blobUrl;
    const fileName = prompt('Enter filename', conversationName);
    tempLink.download = fileName ? `${fileName}.txt` : `${conversationName}.txt`;
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(blobUrl);
  };

  return {
    conversations,
    selectedConversationId,
    thisConversation,
    handleAddConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    clearConversationHistory,
    handleGreeting,
    createAndSelectConversation,
    downloadConvo,
    setThisConversation,
    appendResponseToHistory,
    appendQuestionToHistory,
    debugLog
  };
};