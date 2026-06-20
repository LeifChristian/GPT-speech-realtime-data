import { apiUrl } from '../utils/api';
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, User, Bot, ImagePlus, Send, Square, Play, Pause } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassCard } from './ui/Card';

const ModernConversationOverlay = ({ conversation, onClose, handleGreeting, handleResponse, appendQuestionToHistory, appendResponseToHistory, thumbnails = [], addThumbnail, speakText, updateMainResponse }) => {
    // Local input state (must be declared before any conditional returns)
    const [inputText, setInputText] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const fileInputRef = useRef(null);

    // Add state after existing states
    const [file, setFile] = useState(null);
    const [fileURL, setFileURL] = useState(null);
    const [showImagePreview, setShowImagePreview] = useState(false);

    // Re-add state for local messages
    const [messages, setMessages] = useState([]);

    // Add state for analyzed images
    const [analyzedImages, setAnalyzedImages] = useState([]);
    const [fullImage, setFullImage] = useState(null);

    // Re-add useEffect to parse history
    useEffect(() => {
        if (conversation?.history) {
            const parts = conversation.history.split(/(Question: |Response: )/);
            const historyMessages = [];
            for (let i = 1; i < parts.length; i += 2) { // Start from 1 to skip empty first part
                const type = parts[i].includes('Question:') ? 'user' : 'assistant';
                const content = parts[i + 1].trim();
                if (content) {
                    historyMessages.push({ id: Date.now() + i, role: type, content });
                }
            }
            setMessages(historyMessages);
        } else {
            setMessages([]);
        }
    }, [conversation]);

    // Parse conversation history better
    const parseHistory = (history) => {
        if (!history || !history.trim()) {
            return [{ type: 'empty', content: 'No messages in this conversation yet.' }];
        }

        // Split by the actual patterns used in the app: "Question:" and "Response:"
        const parts = history.split(/(?:Question:\s*|Response:\s*)/);
        const messages = [];

        // Remove empty first element if it exists
        if (parts[0] === '') parts.shift();

        for (let i = 0; i < parts.length; i++) {
            const content = parts[i]?.trim();
            if (content) {
                messages.push({
                    type: i % 2 === 0 ? 'user' : 'bot',
                    content: content
                });
            }
        }

        return messages.length > 0 ? messages : [{ type: 'empty', content: 'No messages in this conversation yet.' }];
    };

    if (!conversation) {
        return null;
    }

    const validMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

    const classifyPrompt = async (prompt) => {
        try {
            const response = await fetch(apiUrl('chat/classify'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error('Classification failed');
            const data = await response.json();
            return data.type;
        } catch (err) {
            console.error('Classification error:', err);
            return 'text';
        }
    };

    const handleImageGeneration = async (prompt) => {
        const res = await fetch(apiUrl('image/generate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!res.ok) throw new Error('Image generation failed');
        return await res.json();
    };

    const onDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        if (!validMime.includes(file.type)) return;
        await handleImageAnalyze(file);
    };

    // Add handleFileSelect function
    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileURL(URL.createObjectURL(selectedFile));
            setShowImagePreview(true);
        }
    };

    // Add clearFile function
    const clearFile = () => {
        setFile(null);
        setFileURL(null);
        setShowImagePreview(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImageAnalyze = async (file) => {
        try {
            setIsProcessing(true);
            handleResponse('Analyzing your image...', true);
            const formData = new FormData();
            formData.append('file', file);
            if (inputText) formData.append('stuff', inputText);
            const res = await fetch(apiUrl('image/analyze'), {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Image analyze failed');
            const data = await res.json();
            // Persist and TTS via shared handler (also add to history)
            handleResponse(data.content);
            // Create a local blob URL for thumbnail persistence during session
            const blobUrl = URL.createObjectURL(file);
            addThumbnail?.(blobUrl, inputText);
            // Insert a placeholder token into the conversation so the image is represented in history
            // Consumers can choose to render a thumbnail for this token while state is alive
            handleResponse('<Image>');
        } catch (err) {
            console.error(err);
            handleResponse('Error analyzing image.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Add local response handler
    const localHandleResponse = (content, isTemp = false) => {
        const msgId = Date.now();
        setMessages(prev => [...prev, { id: msgId, role: isTemp ? 'temp' : 'assistant', content, isTemp }]);
        if (!isTemp) {
            speakText(content);
        }
    };

    // Update handleImageAnalysis to use local handleResponse and append to history
    const handleImageAnalysis = async (prompt) => {
        if (!file) return;

        // Use local temp message
        localHandleResponse('Analyzing your image...', true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('stuff', prompt || 'What is in this image?');

        try {
            const response = await fetch(apiUrl('image/analyze'), {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Image analysis failed');
            const responseData = await response.json();

            // Remove temp message
            setMessages(prev => prev.filter(msg => !msg.isTemp));

            // Add to local messages (like handleGreeting)
            localHandleResponse(responseData.content);

            // Persist to global history
            appendQuestionToHistory(prompt ? `Question about image: ${prompt}` : 'Analyze image');
            appendResponseToHistory(responseData.content);

            // Speak if needed
            if (speakText) speakText(responseData.content); // Assuming it's optional or check if not already speaking

            // Add to analyzed images
            const msgId = Date.now(); // Generate a unique ID for the response
            setMessages(prev => [...prev, { id: msgId, role: 'assistant', content: responseData.content }]);
            setAnalyzedImages(prev => [...prev, { id: msgId, url: fileURL, prompt }]); // Use the message id
            updateMainResponse(responseData.content);

            return responseData;
        } catch (error) {
            console.error('Image analysis error:', error);
            setMessages(prev => prev.filter(msg => !msg.isTemp));
            localHandleResponse('Error analyzing image.');
        } finally {
            clearFile();
            setIsProcessing(false); // Ensure processing ends
        }
    };

    // Update handleSubmit to handle file
    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !file)) return; // Allow if file only

        try {
            setIsProcessing(true);

            if (file) {
                const analysisPrompt = inputText.trim() || 'Describe this image';
                if (!conversation.history.endsWith(`Question: ${analysisPrompt}`)) {
                    await appendQuestionToHistory(analysisPrompt);
                }
                await handleImageAnalysis(analysisPrompt);
            } else {
                if (inputText.trim() && !conversation.history.endsWith(`Question: ${inputText.trim()}`)) {
                    await appendQuestionToHistory(inputText.trim());
                }
                const mode = await classifyPrompt(inputText.trim());
                if (mode === 'image_generation') {
                    handleResponse('Creating your image...', true);
                    const imageResponse = await handleImageGeneration(inputText.trim());
                    if (imageResponse && imageResponse.type === 'image') {
                        handleResponse(`Generated image: ${inputText.trim()}`, false, imageResponse);
                        addThumbnail?.(imageResponse.content, inputText.trim());
                    }
                } else {
                    await handleGreeting(inputText.trim());
                }
            }
        } catch (err) {
            console.error('Submit error:', err);
            handleResponse('Sorry, there was an error processing your request.');
        } finally {
            setInputText('');
            setIsProcessing(false);
        }
    };

    const renderTextWithLinks = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        return text.split(urlRegex).map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="w-full max-w-4xl h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
            >
                <GlassCard className="h-full flex flex-col min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-6 w-6 text-blue-400" />
                            <h2 className="text-2xl font-bold text-white">{conversation.name}</h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/10"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}

                                <div className={`max-w-[70%] rounded-2xl p-4 ${message.role === 'empty' ? 'bg-gray-700/50 text-gray-300 text-center' :
                                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700/50 text-gray-100'
                                    }`}>
                                    {message.role === 'empty' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <MessageSquare className="h-8 w-8 opacity-50" />
                                            <p>{message.content}</p>
                                        </div>
                                    ) : message.content === '<Image>' && thumbnails.length > 0 ? (
                                        <img
                                            src={thumbnails[thumbnails.length - 1].url}
                                            alt={thumbnails[thumbnails.length - 1].prompt || 'Uploaded'}
                                            className="max-w-[240px] max-h-[240px] rounded-md border border-white/10 object-cover"
                                        />
                                    ) : (
                                        <div className="whitespace-pre-wrap break-words">
                                            {renderTextWithLinks(message.content)}
                                        </div>
                                    )}
                                </div>

                                {message.role === 'assistant' && analyzedImages.some(img => img.id === message.id) && (
                                    <div className="mt-2">
                                        <img
                                            src={analyzedImages.find(img => img.id === message.id).url}
                                            alt="Analyzed image"
                                            className="max-w-[240px] max-h-[240px] rounded-md border border-white/10 object-cover cursor-pointer"
                                            onClick={() => setFullImage(analyzedImages.find(img => img.id === message.id).url)}
                                        />
                                    </div>
                                )}

                                {message.role === 'user' && (
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer: controls + stacked input with auto-grow and send below */}
                    <form onSubmit={handleSubmit} className="p-6 border-t border-white/10 space-y-2">
                        <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }} title="Stop speech" aria-label="Stop speech">
                                <Square className="h-5 w-5" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => {
                                if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); setIsSpeaking(false); } else { window.speechSynthesis.resume(); setIsSpeaking(true); }
                            }} title="Play/Pause" aria-label="Play/Pause">
                                {isSpeaking ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload image"
                                aria-label="Upload image"
                                disabled={isProcessing}
                            >
                                <ImagePlus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div
                            className={`bg-gray-800/50 rounded-xl p-2 border ${dragActive ? 'border-blue-400' : 'border-white/10'}`}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
                            onDrop={onDrop}
                        >
                            {showImagePreview && fileURL && (
                                <div className="relative mb-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearFile}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    <img
                                        src={fileURL}
                                        alt="Selected for analysis"
                                        className="w-full max-h-48 object-cover rounded-md"
                                    />
                                    <p className="text-sm text-gray-300 mt-2 text-center">
                                        Image ready for analysis
                                    </p>
                                </div>
                            )}
                            <textarea
                                rows={1}
                                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
                                className="w-full bg-transparent outline-none text-white placeholder:text-gray-400 px-3 py-2 resize-none"
                                placeholder="Type your message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isProcessing}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="flex justify-end pt-2" />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isProcessing || (!inputText.trim() && !file)}
                        >
                            <Send className="h-4 w-4 mr-1" /> Send
                        </Button>
                        <AnimatePresence>
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-sm text-gray-400 mt-2"
                                >
                                    Processing...
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </GlassCard>
            </motion.div>
            {fullImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                    onClick={() => setFullImage(null)}
                >
                    <img src={fullImage} alt="Full view" className="max-w-[90%] max-h-[90%] object-contain" />
                </motion.div>
            )}
        </motion.div>
    );
};

export default ModernConversationOverlay;
