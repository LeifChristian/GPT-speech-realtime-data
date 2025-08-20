import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { Button } from './ui/Button';
import { GlassCard } from './ui/Card';

const ModernImageSidebar = ({ sessionImages = [], onImageSelect, generatedImage }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    if (sessionImages.length === 0) return null;

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
        <>
            {/* Main Sidebar */}
            <motion.div
                className="fixed top-4 right-4 h-[calc(100vh-2rem)] z-50"
                variants={containerVariants}
                animate={isCollapsed ? "collapsed" : "expanded"}
                transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
            >
                <GlassCard className="h-full flex flex-col relative overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            {!isCollapsed && (
                                <motion.div
                                    variants={contentVariants}
                                    animate={isCollapsed ? "collapsed" : "expanded"}
                                    className="flex items-center gap-2"
                                >
                                    <ImageIcon className="h-5 w-5 text-white" />
                                    <span className="text-white font-medium">Images</span>
                                    <span className="text-xs text-gray-400 bg-white/10 px-2 py-1 rounded-full">
                                        {sessionImages.length}
                                    </span>
                                </motion.div>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="text-white hover:bg-white/10 flex-shrink-0"
                            >
                                {isCollapsed ? (
                                    <ChevronLeft className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
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

            {/* Full Screen Image Modal moved to App so sidebar doesn't auto-open */}
        </>
    );
};

export default ModernImageSidebar;
