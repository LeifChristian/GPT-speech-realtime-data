import { useState, useEffect } from 'react';

export const useConversations = (apiKey, setRez, handleResponse) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [thisConversation, setThisConversation] = useState(null);

  useEffect(() => {
    const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(storedConversations);
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
    const formattedDate = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).replace(',', '');
    
    const newConversation = {
      id: Date.now().toString(),
      name: `Conv_${formattedDate}`,
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
        currentConversation = await createAndSelectConversation();
        const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        if (!storedConversations.some(conv => conv.id === currentConversation.id)) {
          storedConversations.push(currentConversation);
          localStorage.setItem('conversations', JSON.stringify(storedConversations));
        }
      } else {
        currentConversation = conversations.find(
          conv => conv.id === selectedConversationId
        );
        
        if (!currentConversation) {
          currentConversation = await createAndSelectConversation();
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

      const payload = {
        text: `${newMessage} <-- Text before this sentence is conversation history so far between you and me. Do NOT include timestamps in responses, timestamps provide context for when this conversation is taking place. responses will be spoken back to user using TTS. Using this information and context, answer the following question, calling functions if asked current information -->  "${theStuff}"`,
        code: apiKey,
      };

      const response = await fetch("http://localhost:3001/greeting", {
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

        const newUpdatedHistory = `${newMessage} Response: ${reply}`;
        const updatedConversation = {
          ...currentConversation,
          history: newUpdatedHistory
        };

        const latestStoredConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
        const finalUpdatedConversations = latestStoredConversations.map(conv => 
          conv.id === updatedConversation.id ? updatedConversation : conv
        );

        localStorage.setItem('conversations', JSON.stringify(finalUpdatedConversations));
        setConversations(finalUpdatedConversations);
        setThisConversation(updatedConversation);
        setSelectedConversationId(updatedConversation.id);
      }
    } catch (error) {
      console.error("Error -->", error);
    }
  };

  const handleSelectConversation = (conversationId, conversationObject) => {
    setSelectedConversationId(conversationId);
    setThisConversation(conversationObject);
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
    const conversationBlob = new Blob(
      [conversationHistory],
      { type: 'text/plain;charset=utf-8' }
    );
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
    setThisConversation
  };
};