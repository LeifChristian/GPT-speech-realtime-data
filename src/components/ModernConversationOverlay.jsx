import React from 'react';
import { motion } from 'framer-motion';
import { X, MessageSquare, User, Bot } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassCard } from './ui/Card';

const ModernConversationOverlay = ({ conversation, onClose }) => {
    if (!conversation) {
        return null;
    }

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

    const messages = parseHistory(conversation.history);

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
                className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
            >
                <GlassCard className="h-full flex flex-col">
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
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.type === 'bot' && (
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}

                                <div className={`max-w-[70%] rounded-2xl p-4 ${message.type === 'empty'
                                    ? 'bg-gray-700/50 text-gray-300 text-center'
                                    : message.type === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700/50 text-gray-100'
                                    }`}>
                                    {message.type === 'empty' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <MessageSquare className="h-8 w-8 opacity-50" />
                                            <p>{message.content}</p>
                                        </div>
                                    ) : (
                                        <div className="whitespace-pre-wrap break-words">
                                            {renderTextWithLinks(message.content)}
                                        </div>
                                    )}
                                </div>

                                {message.type === 'user' && (
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10 flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                            {messages.length > 1 ? `${messages.length} messages` : 'Empty conversation'}
                        </div>
                        <Button
                            onClick={onClose}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                            Close
                        </Button>
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default ModernConversationOverlay;
