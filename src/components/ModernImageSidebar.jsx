import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassCard } from './ui/Card';

const ModernImageSidebar = ({ sessionImages, onImageSelect, generatedImage, isOpen, onClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    if (!isOpen || sessionImages.length === 0) return null;

    const downloadImage = async (imageUrl, prompt) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `generated-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const containerVariants = {
        expanded: { width: 280, opacity: 1 },
        collapsed: { width: 60, opacity: 0.8 }
    };

    const contentVariants = {
        expanded: { opacity: 1, scale: 1 },
        collapsed: { opacity: 0, scale: 0.8 }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 right-0 h-full w-80 bg-black/60 backdrop-blur-md border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
                >
                    <GlassCard className="h-full flex flex-col relative overflow-hidden">
                        {/* Header with close */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-white" />
                                <span className="text-white font-medium">Images</span>
                                <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                                    {sessionImages.length}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white hover:bg-white/10 mr-12"

                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        {!isCollapsed && (
                            <motion.div
                                variants={contentVariants}
                                animate="expanded"
                                className="flex-1 overflow-y-auto p-4 space-y-3"
                            >
                                {sessionImages.slice().reverse().map((img, index) => (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group relative"
                                    >
                                        <div className="relative overflow-hidden rounded-lg bg-black/20 aspect-square">
                                            <img
                                                src={img.url}
                                                alt={img.prompt}
                                                className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                                onClick={() => {
                                                    onImageSelect(img.url);
                                                    setSelectedImageIndex(sessionImages.length - 1 - index);
                                                }}
                                            />

                                            {/* Overlay with actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onImageSelect(img.url);
                                                        }}
                                                        className="bg-white/10 hover:bg-white/20 text-white"
                                                    >
                                                        <ImageIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadImage(img.url, img.prompt);
                                                        }}
                                                        className="bg-white/10 hover:bg-white/20 text-white"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Prompt text */}
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                                                {img.prompt}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(img.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </GlassCard>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModernImageSidebar;
