import { useState, useEffect } from 'react';
import { apiUrl } from '../utils/api';

export const useConversations = (apiKey, setRez, handleResponse) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [thisConversation, setThisConversation] = useState(null);

  useEffect(() => {
    const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(storedConversations);
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

    return newConversation;
  };

  // hooks/useConversations.js
  // ... other code remains the same ...

  const handleGreeting = async (theStuff) => {
    try {
      let currentConversation;

      if (!selectedConversationId) {
        // Auto-create with timestamp name (same as manual creation)
        const now = new Date();
        const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const autoName = `Convo ${date} ${time}`;
        currentConversation = handleAddConversation(autoName);
      } else {
        currentConversation = conversations.find(
          conv => conv.id === selectedConversationId
        );

        if (!currentConversation) {
          const now = new Date();
          const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
          const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          const autoName = `Convo ${date} ${time}`;
          currentConversation = handleAddConversation(autoName);
        }
      }

      if (!currentConversation) {
        console.error("Failed to create or find conversation");
        return;
      }

      const existingHistory = currentConversation.history || '';
      const newMessage = existingHistory
        ? `${existingHistory} Question: ${theStuff}`
        : `Question: ${theStuff}`;

      // Persist the question into history before sending
      const updatedWithQuestion = {
        ...currentConversation,
        history: newMessage,
      };
      const conversationsWithQuestion = conversations.map((conv) =>
        conv.id === updatedWithQuestion.id ? updatedWithQuestion : conv
      );
      localStorage.setItem('conversations', JSON.stringify(conversationsWithQuestion));
      setConversations(conversationsWithQuestion);
      setThisConversation(updatedWithQuestion);
      setSelectedConversationId(updatedWithQuestion.id);

      const payload = {
        text: `${newMessage} <-- Text before this sentence is conversation history so far between you and me. Do NOT include timestamps in responses, timestamps provide context for when this conversation is taking place. responses will be spoken back to user using TTS. Using this information and context, answer the following question, calling functions if asked current information -->  "${theStuff}"`,
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

        // Update the UI text
        setRez(reply);

        // Speak the response
        handleResponse(reply);
      }
    } catch (error) {
      console.error("Error -->", error);
    }
  };

  const handleSelectConversation = (conversationId, conversationObject) => {
    setSelectedConversationId(conversationId);
    setThisConversation(conversationObject);
  };

  const appendResponseToHistory = async (responseText) => {
    let workingConversationId = selectedConversationId;
    let selectedConversation = conversations.find(
      (conversation) => conversation.id === workingConversationId
    );
    if (!selectedConversation) {
      const created = await createAndSelectConversation();
      workingConversationId = created.id;
      selectedConversation = created;
    }
    const newHistory = `${selectedConversation.history} Response: ${responseText}`;
    const updatedConversation = {
      ...selectedConversation,
      history: newHistory,
    };
    const updatedConversations = conversations.map((conversation) =>
      conversation.id === workingConversationId ? updatedConversation : conversation
    );
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setThisConversation(updatedConversation);
    setSelectedConversationId(workingConversationId);
  };

  const appendQuestionToHistory = async (questionText) => {
    let workingConversationId = selectedConversationId;
    let selectedConversation = conversations.find(
      (conversation) => conversation.id === workingConversationId
    );
    if (!selectedConversation) {
      const created = await createAndSelectConversation();
      workingConversationId = created.id;
      selectedConversation = created;
    }
    const newHistory = selectedConversation.history
      ? `${selectedConversation.history} Question: ${questionText}`
      : `Question: ${questionText}`;
    const updatedConversation = {
      ...selectedConversation,
      history: newHistory,
    };
    const updatedConversations = conversations.map((conversation) =>
      conversation.id === workingConversationId ? updatedConversation : conversation
    );
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setThisConversation(updatedConversation);
    setSelectedConversationId(workingConversationId);
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
    setSelectedConversationId(null);
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
    appendQuestionToHistory
  };
};