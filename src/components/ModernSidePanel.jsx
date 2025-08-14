import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, MessageSquare, Edit3, Trash2, X } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassCard } from './ui/Card';

const ModernSidePanel = ({
    onSelectConversation,
    onAddConversation,
    onRenameConversation,
    onDeleteConversation,
    selectedConversationId,
    setThisConversation,
    conversations = []
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleSelectConversation = (conversationId, conversation) => {
        onSelectConversation(conversationId, conversation);
        setThisConversation(conversation);
        setIsOpen(false); // Close on mobile after selection
    };

    const handleAddConversation = (e) => {
        e.stopPropagation();
        const conversationName = prompt('Enter a name for the new conversation');
        if (conversationName) {
            onAddConversation(conversationName);
        }
    };

    const handleRenameConversation = (e, conversationId) => {
        e.stopPropagation();
        const selectedConversation = conversations.find(conversation => conversation.id === conversationId);
        if (selectedConversation) {
            const newConversationName = prompt('Enter a new name for the conversation', selectedConversation.name);
            if (newConversationName && newConversationName !== selectedConversation.name) {
                onRenameConversation(conversationId, newConversationName);
            }
        }
    };

    const handleDeleteConversation = (e, conversationId) => {
        e.stopPropagation();
        const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
        if (confirmDelete) {
            onDeleteConversation(conversationId);
        }
    };

    const sidebarVariants = {
        closed: {
            x: -320,
            opacity: 0,
        },
        open: {
            x: 0,
            opacity: 1,
        }
    };

    const overlayVariants = {
        closed: { opacity: 0, pointerEvents: 'none' },
        open: { opacity: 1, pointerEvents: 'auto' }
    };

    return (
        <>
            {/* Hamburger Menu Button */}
            <motion.div
                className="fixed top-4 left-4 z-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    variant="glass"
                    size="icon"
                    onClick={togglePanel}
                    className="bg-black/20 hover:bg-black/40 text-white border-white/20"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </motion.div>

            {/* Overlay: click outside closes (all viewports) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        variants={overlayVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Side Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed top-0 left-0 h-full w-80 z-50"
                        variants={sidebarVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        <GlassCard className="h-full w-full rounded-none rounded-r-xl flex flex-col">
                            {/* Header */}
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="h-6 w-6 text-blue-400" />
                                        <h2 className="text-xl font-bold text-white">Conversations</h2>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}
                                        className="text-white hover:bg-white/10"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Add New Conversation Button */}
                                <Button
                                    onClick={handleAddConversation}
                                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Conversation
                                </Button>
                            </div>

                            {/* Conversations List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {conversations.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No conversations yet.</p>
                                        <p className="text-sm">Create your first conversation!</p>
                                    </div>
                                ) : (
                                    <>
                                        {conversations.map((conversation) => (
                                            <motion.div
                                                key={conversation.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${conversation.id === selectedConversationId
                                                    ? 'bg-blue-600/20 border border-blue-500/30'
                                                    : 'hover:bg-white/10 border border-transparent'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectConversation(conversation.id, conversation);
                                                }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-medium truncate">
                                                            {conversation.name}
                                                        </h3>
                                                        <p className="text-gray-400 text-sm truncate mt-1">
                                                            {conversation.history && conversation.history.trim()
                                                                ? (() => {
                                                                    // Clean up the history text for preview - use actual app format
                                                                    const cleaned = conversation.history
                                                                        .replace(/Question:\s*/g, '')
                                                                        .replace(/Response:\s*/g, '')
                                                                        .replace(/\n/g, ' ')
                                                                        .trim();
                                                                    return cleaned.slice(0, 60) + (cleaned.length > 60 ? '...' : '');
                                                                })()
                                                                : 'No messages yet'
                                                            }
                                                        </p>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handleRenameConversation(e, conversation.id)}
                                                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handleDeleteConversation(e, conversation.id)}
                                                            className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/10">
                                <div className="text-center text-xs text-gray-400">
                                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                                </div>
                                {/* Debug info */}
                                {conversations.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-2">
                                        <details>
                                            <summary>Debug Info</summary>
                                            {conversations.map(conv => (
                                                <div key={conv.id} className="mt-1">
                                                    <strong>{conv.name}:</strong> {conv.history ? conv.history.slice(0, 30) + '...' : 'No history'}
                                                </div>
                                            ))}
                                        </details>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ModernSidePanel;
