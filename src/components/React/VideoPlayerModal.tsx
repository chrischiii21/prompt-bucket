import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, RefreshCw } from 'lucide-react';
import { createPortal } from 'react-dom';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, videoUrl, title }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    
    try {
      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
        return `https://www.youtube.com/embed/${id}?autoplay=1`;
      }
      
      // Vimeo
      if (url.includes('vimeo.com')) {
        const id = url.split('/').pop();
        return `https://player.vimeo.com/video/${id}?autoplay=1`;
      }
      
      // Google Drive
      if (url.includes('drive.google.com')) {
        let id = '';
        if (url.includes('/d/')) {
          id = url.split('/d/')[1]?.split('/')[0];
        } else if (url.includes('id=')) {
          id = url.split('id=')[1]?.split('&')[0];
        }
        if (id) return `https://drive.google.com/file/d/${id}/preview`;
      }
    } catch (e) {
      console.error('Error parsing video URL:', e);
    }
    
    return null;
  };

  const embedUrl = React.useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative w-full max-w-6xl aspect-video bg-black rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
          >
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
              <h3 className="text-white font-black text-xl tracking-tight pointer-events-auto">{title || 'Production Preview'}</h3>
              <div className="flex items-center gap-3 pointer-events-auto">
                <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
                >
                  <ExternalLink size={20} />
                </a>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="w-full h-full bg-[#0A0A0A] relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={40} className="text-[#EE5A24] animate-spin" />
                    <span className="text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.3em]">Igniting Production...</span>
                  </div>
                </div>
              )}
              {embedUrl ? (
                <iframe 
                  src={embedUrl}
                  className="w-full h-full border-none relative z-10"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
                  allowFullScreen
                  onLoad={() => setIsLoading(false)}
                />
              ) : (
                <video 
                  src={videoUrl} 
                  autoPlay 
                  controls 
                  className="w-full h-full object-contain relative z-10"
                  onLoadedData={() => setIsLoading(false)}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
