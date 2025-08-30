import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, Send, RotateCcw, Save, X, Image as ImageIcon } from 'lucide-react';
import PropTypes from 'prop-types';

import { Button } from './ui/Button';
import { TextArea } from './ui/Input';
import { GlassCard } from './ui/Card';
import { apiUrl, debugFetch } from '../utils/api';
import DebugOverlay from './DebugOverlay';

const ModernUnifiedInput = ({
    enteredText,
    setEnteredText,
    handleResponse,
    sendStop,
    clearConversationHistory,
    downloadConvo,
    rez,
    handleGreeting,
    appendQuestionToHistory
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [debugOpen, setDebugOpen] = useState(false);
    const [debugEntries, setDebugEntries] = useState([]);
    const pushDebug = (e) => setDebugEntries((prev) => [...prev.slice(-49), e]);
    const [file, setFile] = useState(null);
    const [fileURL, setFileURL] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(false);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
        }
    }, [enteredText]);

    // Handle file input change for image analysis
    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileURL(URL.createObjectURL(selectedFile));
            setShowImagePreview(true);
        }
    };

    // Clear selected file
    const clearFile = () => {
        setFile(null);
        setFileURL(null);
        setShowImagePreview(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    // Classify prompt using our new endpoint
    const classifyPrompt = async (prompt) => {
        try {
            const response = await debugFetch('classify', apiUrl('chat/classify'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            }, pushDebug);

            if (!response.ok) {
                setDebugOpen(true);
                throw new Error('Classification failed');
            }
            const data = await response.json();
            return data.type;
        } catch (error) {
            console.error('Classification error:', error);
            return 'text';
        }
    };

    // Handle image generation
    const handleImageGeneration = async (prompt) => {
        try {
            const response = await debugFetch('image-generate', apiUrl('image/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            }, pushDebug);

            if (!response.ok) {
                setDebugOpen(true);
                throw new Error('Image generation failed');
            }
            return await response.json();
        } catch (error) {
            console.error('Image generation error:', error);
            throw error;
        }
    };

    // Handle image analysis
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
            const response = await debugFetch('image-analyze', apiUrl('image/analyze'), {
                method: 'POST',
                body: formData,
            }, pushDebug);

            if (!response.ok) throw new Error('Image analysis failed');
            const responseData = await response.json();
            handleResponse(responseData.content);
            return responseData;
        } catch (error) {
            console.error('Image analysis error:', error);
            setDebugOpen(true);
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
            if (file) {
                // Add the user's question about the image to history immediately
                if (enteredText && enteredText.trim()) {
                    await appendQuestionToHistory(enteredText.trim());
                }
                await handleImageAnalysis(enteredText);
                clearFile();
            } else {
                const classificationType = await classifyPrompt(enteredText);

                if (classificationType === 'image_generation') {
                    handleResponse('Creating your image...', true);
                    await appendQuestionToHistory(enteredText.trim());
                    const imageResponse = await handleImageGeneration(enteredText);

                    if (imageResponse && imageResponse.type === 'image') {
                        handleResponse(`Generated image: ${enteredText}`, false, imageResponse);
                    }
                } else {
                    await handleGreeting(enteredText);
                }
            }
            setEnteredText('');
        } catch (error) {
            console.error('Submit error:', error);
            setDebugOpen(true);
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
            <div className="w-full max-w-4xl mx-auto px-4">
                {/* Hidden file inputs */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Image Preview */}
                <AnimatePresence>
                    {showImagePreview && fileURL && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="mb-4"
                        >
                            <GlassCard className="p-4 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <img
                                    src={fileURL}
                                    alt="Selected for analysis"
                                    className="w-full max-h-48 object-cover rounded-md cursor-pointer"
                                    onClick={() => setShowImagePreview(!showImagePreview)}
                                />
                                <p className="text-sm text-gray-300 mt-2 text-center">
                                    Image ready for analysis
                                </p>
                            </GlassCard>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Input Area */}
                <GlassCard className="p-6 space-y-4">
                    <div className="flex justify-end">
                        <button type="button" className="text-xs text-gray-400 underline" onClick={() => setDebugOpen(true)}>Debug</button>
                    </div>
                    {/* File Upload Controls */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                            variant="glass"
                            size="sm"
                            onClick={() => cameraInputRef.current?.click()}
                            disabled={isProcessing}
                            className="flex items-center gap-2"
                        >
                            <Camera className="h-4 w-4" />
                            Camera
                        </Button>

                        <Button
                            variant="glass"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="flex items-center gap-2"
                        >
                            <Upload className="h-4 w-4" />
                            Upload
                        </Button>

                        {file && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={clearFile}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Clear Image
                            </Button>
                        )}
                    </div>

                    {/* Text Input */}
                    <div className="space-y-2">
                        <TextArea
                            ref={inputRef}
                            variant="glass"
                            value={enteredText}
                            onChange={(e) => setEnteredText(e.target.value)}
                            placeholder={
                                file
                                    ? "Ask about your image or describe what you want to create..."
                                    : "Ask anything or describe an image to create..."
                            }
                            disabled={isProcessing}
                            className={`min-h-[100px] max-h-[200px] transition-all duration-300 ${file ? 'border-green-400/50' : 'border-white/20'
                                }`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />

                        <div className="text-xs text-gray-400 text-center">
                            {file ? 'Image analysis mode' : 'Smart mode - AI will detect if you want text or image generation'}
                            <br />
                            Press Ctrl+Enter to send
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            onTouchEnd={(e) => { e.preventDefault(); if (!isProcessing && (enteredText.trim() || file)) handleSubmit(); }}
                            disabled={isProcessing || (!enteredText.trim() && !file)}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6"
                        >
                            {isProcessing ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                />
                            ) : (
                                <>
                                    {file ? <ImageIcon className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                                    {isProcessing ? 'Processing...' : (file ? 'Analyze & Send' : 'Send')}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleClear}
                            disabled={isProcessing}
                            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </Button>

                        <Button
                            variant="outline"
                            onClick={downloadConvo}
                            disabled={isProcessing}
                            className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                        >
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </GlassCard>
            </div>
            <DebugOverlay open={debugOpen} onClose={() => setDebugOpen(false)} entries={debugEntries} />
        </div>
    );
};

ModernUnifiedInput.propTypes = {
    enteredText: PropTypes.string.isRequired,
    setEnteredText: PropTypes.func.isRequired,
    handleResponse: PropTypes.func.isRequired,
    sendStop: PropTypes.func.isRequired,
    clearConversationHistory: PropTypes.func.isRequired,
    downloadConvo: PropTypes.func.isRequired,
    rez: PropTypes.string.isRequired,
    handleGreeting: PropTypes.func.isRequired,
    appendQuestionToHistory: PropTypes.func.isRequired,
};

export default ModernUnifiedInput;
