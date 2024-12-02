import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import SidePanel from "./SidePanel";
import ImageUpload from "./ImageUpload";
import ConversationOverlay from "./ConversationOverlay";

const theCode = process.env.REACT_APP_API_KEY;
const PWD = 8675309;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

function App() {
  // [Previous state declarations]
  const inputRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [enteredText, setEnteredText] = useState("");
  const [theResponse, setResponse] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [conversationHistory, setConversationHistory] = useState("");
  const [isTextCleared, setIsTextCleared] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [rez, setRez] = useState("");
  const [isPasswordValidated, setPasswordValidated] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [thisConversation, setThisConversation] = useState(null);
  const [contentResults, setContentResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const inputElement = inputRef.current;
    inputElement.style.height = 'auto';
    if (inputElement.scrollHeight > inputElement.clientHeight) {
      inputElement.style.height = `${inputElement.scrollHeight}px`;
    }
  }, [enteredText]);

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  useEffect(() => {
    const existingHistory = localStorage.getItem("conversationHistory");
    if (existingHistory) {
      const historyArray = existingHistory.split("|");
      console.log(historyArray);
    }
  }, []);

  useEffect(() => {
    if (!isPasswordValidated) {
      const savedPassword = localStorage.getItem("appPassword");
      if (savedPassword && parseInt(savedPassword) === parseInt(PWD)) {
        setPasswordValidated(true);
      } else {
        const pwdPrompt = () => {
          var password = prompt("Enter the password");
          if (password === null) {
            pwdPrompt();
          } else if (parseInt(password) === parseInt(PWD)) {
            localStorage.setItem("appPassword", password);
            setPasswordValidated(true);
          } else {
            alert("Incorrect password. Try again.");
            pwdPrompt();
          }
        };
        pwdPrompt();
      }
    }
  }, [isPasswordValidated]);

  useEffect(() => {
    const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
    setConversations(storedConversations);
  }, []);

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

  const handleSelectConversation = (conversationId, conversationObject) => {
    setSelectedConversationId(conversationId);
    setIsOverlayVisible(true);
    setThisConversation(conversationObject);
  };

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

  const handleRenameConversation = (conversationId) => {
    const selectedConversation = conversations.find(
      (conversation) => conversation.id === conversationId
    );
    if (selectedConversation) {
      const newConversationName = prompt('Enter a new name for the conversation', selectedConversation.name);
      if (newConversationName) {
        const updatedConversations = conversations.map((conversation) => {
          if (conversation.id === conversationId) {
            return { ...conversation, name: newConversationName };
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

  const handleCloseConversation = () => {
    setIsOverlayVisible(false);
  };

  const sendStop = () => {
    setIsTextCleared(prev => !prev);
    setRez('');
    stopSpeakText();
  };

  const startRecording = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (isRecording) {
      stopSpeakText();
      return;
    }
    setIsRecording(true);
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition.stop();
  };

  const stopSpeakText = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
  };

  const toggleMute = () => {
    setToggle(prevToggle => !prevToggle);
    if (window.speechSynthesis.speaking) {
      stopSpeakText();
    }
  };

  const pause = () => {
    if (isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      resume();
      setIsPlaying(true);
    }
  };

  const resume = () => {
    speechSynthesis.resume();
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
      [conversationHistory, rez ? `Response: ${rez}` : ''],
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

  const clearConversationHistory = () => {
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id === selectedConversationId) {
        return { ...conversation, history: '' };
      }
      return conversation;
    });
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    setEnteredText('');
    setRez('');
    setResponse('');
    setShowPlayPause(false);
  };

  const speakText = (text) => {
    function removeUrls(text) {
      const urlPattern = /https?:\/\/[^\s]+/g;
      return text.replace(urlPattern, '');
    }

    text = removeUrls(text);
    setShowPlayPause(true);

    if ("speechSynthesis" in window) {
      if (toggle) {
        setShowPlayPause(true);
        return;
      }

      const splitTextIntoSegments = (text) => {
        const maxWordsPerSegment = 32;
        const sentences = text.split(/([.!?:])/);
        const segments = [];
        let currentSegment = "";

        sentences.forEach((sentence) => {
          if (sentence.match(/[.!?:]/)) {
            if (currentSegment) {
              segments.push(currentSegment);
              currentSegment = "";
            }
            segments.push(sentence.trim());
          } else {
            const words = sentence.split(/\s+/);
            words.forEach((word) => {
              if (currentSegment.split(/\s+/).length < maxWordsPerSegment) {
                if (currentSegment.endsWith(".") && word === "com") {
                  currentSegment = currentSegment.slice(0, -1) + word;
                } else {
                  currentSegment += (currentSegment ? " " : "") + word;
                }
              } else {
                segments.push(currentSegment);
                currentSegment = word;
              }
            });
          }
        });

        if (currentSegment) {
          segments.push(currentSegment);
        }
        return segments;
      };

      const segments = splitTextIntoSegments(text, 32);

      const synthesizeSegments = () => {
        if (segments.length === 0) {
          setShowPlayPause(false);
          setIsPlaying(false);
          return;
        }
        const segment = segments.shift();
        const utterance = new SpeechSynthesisUtterance(
          segment.replaceAll('Response:', '')
            .replaceAll('.', '')
            .replaceAll('!', '')
            .replaceAll('?', '')
            .replaceAll(":", "")
        );
        utterance.voice = speechSynthesis.getVoices()[5];
        utterance.onend = synthesizeSegments;
        speechSynthesis.speak(utterance);
      };

      synthesizeSegments();
    } else {
      console.error("Speech synthesis is not supported or not ready");
    }
  };

  const handleResponse = (response1, bool) => {
    setRez("");
    if (bool) {
      speakText(response1);
      return;
    }
  
    const selectedConversation = conversations.find(
      (conversation) => conversation.id === selectedConversationId
    );
  
    const newHistory = `${selectedConversation.history} Response: ${response1}`;
    const updatedConversations = conversations.map((conversation) => {
      if (conversation.id === selectedConversationId) {
        return { ...conversation, history: newHistory };
      }
      return conversation;
    });

    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    speakText(response1);
  };

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

  // [Previous handleGreeting implementation with content generation]

  const handleGreeting = async (theStuff) => {
    try {
      setIsLoading(true);
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

      // Add content generation API call
      const contentResponse = await fetch("http://localhost:3001/generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: theStuff, code: theCode }),
      });

      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        setContentResults(contentData.results);
      }

      const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
      const latestConversation = storedConversations.find(conv => conv.id === currentConversation.id) || currentConversation;
      
      const existingHistory = latestConversation.history || '';
      const newMessage = existingHistory 
        ? `${existingHistory} Question: ${theStuff}`
        : `Question: ${theStuff}`;

      const payload = {
        text: `${newMessage} <-- Text before this sentence is conversation history so far between you and me. Do NOT include timestamps in responses, timestamps provide context for when this conversation is taking place. responses will be spoken back to user using TTS. Using this information and context, answer the following question, calling functions if asked current information -->  "${theStuff}"`,
        code: theCode,
      };

      const response = await fetch("http://localhost:3001/greeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const responseData = await response.json();
        const reply = responseData.reply;
        
        setResponse(reply);
        setRez(reply);
        speakText(reply);
        pause();

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
    } finally {
      setIsLoading(false);
    }
  };

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );

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
          conversation={selectedConversation}
          onClose={handleCloseConversation}
        />
      )}
      
      <header className="App-header">
        <h1 style={{ color: 'lightgrey', marginTop: '2vh' }}>7Minds Beta</h1>
        <div id="dick"></div>
        <div className="buttons-container">
          {windowWidth >= 468 ? (
            <button className="button" onClick={() => startRecording()} type="button">
              Start
            </button>
          ) : null}
          <button
            className="button"
            onClick={() => {
              sendStop();
              stopSpeakText();
              setIsPlaying(false);
              setShowPlayPause(false);
              setRez("");
              setEnteredText("");
            }}
            type="button"
          >
            Stop
          </button>
          {isPlaying ? (
            <button className="button" onClick={() => toggleMute()} type="button">
              Mute
            </button>
          ) : ''}
          <br /><br />
          <ImageUpload
            sendStop={sendStop}
            isTextCleared={isTextCleared}
            setRez={setRez}
            rez={rez}
            handleResponse={handleResponse}
            style={{ zIndex: 2000, marginBottom: "100px" }}
          />
          {showPlayPause ? (
            <button className="button" onClick={() => pause()} type="button">
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          ) : ''}
        </div>

        {contentResults.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1rem', 
            padding: '1rem',
            width: '90vw',
            margin: 'auto'
          }}>
            {contentResults.map((result, index) => (
              <div key={index} style={{
                background: '#1a1a1a',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #333',
                marginBottom: '1rem'
              }}>
                <h3 style={{ marginBottom: '0.5rem', textTransform: 'capitalize', color: 'lightgrey' }}>
                  {result.type} Content
                </h3>
                <div style={{ 
                  whiteSpace: 'pre-wrap',
                  color: 'lightgrey',
                  fontSize: '1rem',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  {result.content}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "10vh" }}></div>
        <div className="transcript-container"></div>
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
              height: "auto",
              minHeight: "1.2rem",
              textAlign: "center",
              fontSize: '1.2rem',
              overflow: 'auto',
              resize: 'none',
              boxSizing: 'border-box',
            }}
            value={enteredText}
            onChange={(event) => {
              setEnteredText(event.target.value);
              setInterimTranscript("");
              setFinalTranscript("");
            }}
            placeholder="Enter your brand description..."
          />
          <br />
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
            onClick={() => {
              const confirmClear = window.confirm("Clear the conversation history?");
              if (confirmClear) {
                clearConversationHistory();
              }
            }}
          >
            Reset
          </button>
          <button
            className="button"
            onClick={() => {
              downloadConvo();
            }}
          >
            Save
          </button>
        </div>
        <div
          style={{
            color: "black",
            fontSize: "1.2rem",
            textShadow: "2px 3px 1px purple",
            textStroke: "black",
            WebkitTextStroke: "1px black",
            textStrokeWidth: "4px",
          }}
        >
          <p
            style={{
              maxHeight: "50vh",
              fontSize: '1.3rem',
              overflow: "auto",
              width: "90vw",
              margin: 'auto',
              marginTop: '1%',
              fontWeight: 'bold',
              color: 'lightgrey',
              textAlign: 'center',
              whiteSpace: 'pre-wrap',
            }}
          >
            {renderTextWithLinks(rez)}
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;