import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Prompt {
  id: string;
  prompt_text: string;
  image_url: string;
  category: string;
  tags?: string[];
}

export const PromptCard: React.FC<{ prompt: Prompt }> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative glass rounded-2xl overflow-hidden masonry-item border-white/5 hover:border-white/20 transition-all duration-500"
    >
      <div class="relative aspect-[4/5] overflow-hidden">
        <img 
          src={prompt.image_url} 
          alt={prompt.category}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
          <div className="flex gap-2 mb-3">
            {prompt.tags?.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-wider font-bold bg-white/10 backdrop-blur-md px-2 py-1 rounded-md text-white/80">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-white/90 line-clamp-3 mb-4 leading-relaxed font-medium">
            {prompt.prompt_text}
          </p>
        </div>
        
        <div className="absolute top-4 right-4 flex flex-col gap-2 transition-all duration-500">
          <button 
            onClick={copyToClipboard}
            className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-brand-primary transition-all active:scale-90 shadow-lg"
            title="Copy Prompt"
          >
            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
          </button>
        </div>
      </div>
      
      <div className="p-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-primary uppercase tracking-widest">{prompt.category}</span>
        <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full border-2 border-black bg-brand-primary"></div>
            <div className="w-6 h-6 rounded-full border-2 border-black bg-brand-secondary"></div>
        </div>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-brand-primary/40 pointer-events-none"
          >
            Copied prompt!
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
