import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const UnifiedInput = ({
    enteredText,
    setEnteredText,
    handleResponse,
    sendStop,
    clearConversationHistory,
    downloadConvo,
    rez,
    handleGreeting
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState(null);
    const [fileURL, setFileURL] = useState(null);
    const [showImageThumb, setShowImageThumb] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const inputElement = inputRef.current;
        inputElement.style.height = 'auto';
        if (inputElement.scrollHeight > inputElement.clientHeight) {
            inputElement.style.height = `${inputElement.scrollHeight}px`;
        }
    }, [enteredText]);

    // Handle file input change for image analysis
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setFileURL(URL.createObjectURL(selectedFile));
        setShowImageThumb(true);
    };

    // Classify prompt using our new endpoint
    const classifyPrompt = async (prompt) => {
        try {
            const response = await fetch('http://localhost:3001/chat/classify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error('Classification failed');
            }

            const data = await response.json();
            return data.type; // 'image_generation' or 'text'
        } catch (error) {
            console.error('Classification error:', error);
            return 'text'; // Default to text on error
        }
    };

    // Handle image generation
    const handleImageGeneration = async (prompt) => {
        try {
            const response = await fetch('http://localhost:3001/image/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error('Image generation failed');
            }

            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error('Image generation error:', error);
            throw error;
        }
    };

    // Handle image analysis (when file is uploaded)
    const handleImageAnalysis = async (prompt) => {
        if (!file) {
            alert('Please select a file to upload');
            return;
        }

        handleResponse('Analyzing your image...', true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('stuff', prompt || 'What is in this image?');

        try {
            const response = await fetch('http://localhost:3001/image/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Image analysis failed');
            }

            const responseData = await response.json();
            handleResponse(responseData.content);
            return responseData;
        } catch (error) {
            console.error('Image analysis error:', error);
            alert('Error analyzing image.');
        }
    };

    // Main submit handler
    const handleSubmit = async () => {
        if (!enteredText.trim() && !file) {
            alert('Please enter a prompt or select an image to analyze');
            return;
        }

        setIsProcessing(true);
        sendStop();

        try {
            // If there's a file, always do image analysis
            if (file) {
                await handleImageAnalysis(enteredText);
                setFile(null);
                setFileURL(null);
                setShowImageThumb(false);
            } else {
                // Classify the prompt
                const classificationType = await classifyPrompt(enteredText);

                if (classificationType === 'image_generation') {
                    handleResponse('Creating your image...', true);
                    const imageResponse = await handleImageGeneration(enteredText);

                    // Pass the image response back to App component
                    if (imageResponse && imageResponse.type === 'image') {
                        handleResponse(`Generated image: ${enteredText}`, false, imageResponse);
                    }
                } else {
                    // Handle as regular text conversation
                    await handleGreeting(enteredText);
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            handleResponse('Sorry, there was an error processing your request.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClear = () => {
        const confirmClear = window.confirm("Clear the conversation history?");
        if (confirmClear) {
            clearConversationHistory();
        }
    };

    return (
        <div>
            {/* File upload controls */}
            <div style={{
                color: 'lightgrey',
                position: 'fixed',
                marginTop: '-8vh',
                width: '100vw',
                fontSize: '1.2rem',
                display: 'flex',
                justifyContent: 'center',
                gap: '10px'
            }}>

                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                <input
                    id="fileInput2"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                <label htmlFor="fileInput" className="button2" style={{
                    background: 'transparent',
                    color: 'lightgrey',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: '1px solid #444'
                }}>
                    📸 Camera
                </label>

                <label htmlFor="fileInput2" className="button2" style={{
                    background: 'transparent',
                    color: 'lightgrey',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: '1px solid #444'
                }}>
                    📁 Upload
                </label>

                {file && (
                    <button
                        onClick={() => {
                            setFile(null);
                            setFileURL(null);
                            setShowImageThumb(false);
                        }}
                        className="button2"
                        style={{
                            background: 'transparent',
                            color: '#ff6b6b',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            border: '1px solid #ff6b6b'
                        }}
                    >
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* Image thumbnail */}
            {fileURL && showImageThumb && (
                <div style={{
                    textAlign: 'center',
                    margin: 'auto',
                    width: '100vw',
                    position: 'absolute',
                    top: '18vh'
                }}>
                    <img
                        src={fileURL}
                        onClick={() => setShowImageThumb(!showImageThumb)}
                        style={{
                            margin: "auto",
                            height: '30vh',
                            borderRadius: '.8em',
                            cursor: 'pointer'
                        }}
                        alt="Selected for analysis"
                    />
                </div>
            )}

            {/* Main input */}
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
                    marginTop: '90px',
                    minHeight: "1.2rem",
                    textAlign: "center",
                    fontSize: '1.2rem',
                    overflow: 'auto',
                    resize: 'none',
                    boxSizing: 'border-box',
                    zIndex: 3000,
                    border: file ? '2px solid #4CAF50' : '1px solid #444'
                }}
                value={enteredText}
                onChange={(event) => setEnteredText(event.target.value)}
                placeholder={file ? "Ask about your image or describe what you want to create..." : "Ask anything or describe an image to create..."}
                disabled={isProcessing}
            />

            {/* Control buttons */}
            <div style={{ position: 'relative', zIndex: 3000, marginTop: '10px' }}>
                <button
                    className="button"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    style={{
                        opacity: isProcessing ? 0.5 : 1,
                        cursor: isProcessing ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isProcessing ? 'Processing...' : (file ? 'Analyze & Send' : 'Send')}
                </button>

                <button
                    className="button"
                    onClick={handleClear}
                    disabled={isProcessing}
                >
                    Reset
                </button>

                <button
                    className="button"
                    onClick={downloadConvo}
                    disabled={isProcessing}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

UnifiedInput.propTypes = {
    enteredText: PropTypes.string.isRequired,
    setEnteredText: PropTypes.func.isRequired,
    handleResponse: PropTypes.func.isRequired,
    sendStop: PropTypes.func.isRequired,
    clearConversationHistory: PropTypes.func.isRequired,
    downloadConvo: PropTypes.func.isRequired,
    rez: PropTypes.string.isRequired,
    handleGreeting: PropTypes.func.isRequired,
};

export default UnifiedInput;
