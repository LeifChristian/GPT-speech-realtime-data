import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import SidePanel from "./SidePanel";
import ImageUpload from "./ImageUpload";
import ConversationOverlay from "./ConversationOverlay";

const theCode = process.env.REACT_APP_API_KEY;
const PWD = 8675309;
const recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();

function App() {
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
  const [thisConversation, setThisConversation] = useState(null)

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

  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        setFinalTranscript(result[0].transcript);
        setEnteredText(result[0].transcript);
        stopRecording();
        handleGreeting(result[0].transcript);
      } else {
        interimTranscript += result[0].transcript;
        setInterimTranscript(interimTranscript);
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("Error with the speech recognition API:", event.error);
  };

  const sendStop = () => {
    setIsTextCleared(prev => !prev);
    setRez('');
    stopSpeakText();
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
        return {
          ...conversation,
          history: newHistory,
        };
      }
      return conversation;
    });

    console.log(thisConversation, '<-- this conversation')
  
    setConversations(updatedConversations);
    localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    speakText(response1);
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

  const convertToTimezoneOffset = (isoDateString) => {
    const date = new Date(isoDateString);
    const timezoneOffset = date.getTimezoneOffset() * -1;
    const localDate = new Date(date.getTime() + timezoneOffset * 60000);
    return localDate.toISOString();
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
      headers: {
        "Content-Type": "application/json",
      },
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
  }
};


useEffect(() => {
  console.log('Conversations updated:', conversations);
  console.log('Selected conversation ID:', selectedConversationId);
  console.log('Current conversation:', thisConversation);
}, [conversations, selectedConversationId, thisConversation]);

  const handleSelectConversation = (conversationId, conversationObject) => {
    setSelectedConversationId(conversationId);
    setIsOverlayVisible(true);
    console.log('Selected Conversation ID:', conversationId);

    setThisConversation(conversationObject)
    console.log(thisConversation, 'current conversation')
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
        const utterance = new SpeechSynthesisUtterance(segment.replaceAll('Response:', '').replaceAll('.', '').replaceAll('!', '').replaceAll('?', '').replaceAll(":", ""));
        utterance.voice = speechSynthesis.getVoices()[5];
        utterance.onend = synthesizeSegments;
        speechSynthesis.speak(utterance);
      };

      synthesizeSegments();
    } else {
      console.error("Speech synthesis is not supported or not ready");
    }
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

  const handleCloseConversation = () => {
    setIsOverlayVisible(false);
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
      {/* <div style={{position: 'absolute', top: '70px', left: '10px', color: 'lightgrey', fontSize: '2rem'}}>{thisConversation?.name}</div> */}
      <header className="App-header">
        <h1 style={{ color: 'lightgrey', marginTop: '2vh' }}>ΩmnÎbot-βeta</h1>
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
            placeholder="Enter your question"
          />
          <br />
          <button
            className="button"
            type="button"
            onClick={() => {
              sendStop();
              handleGreeting(enteredText);
              console.log(enteredText);
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
            {/* {rez} */}
            {renderTextWithLinks(rez)}
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;
