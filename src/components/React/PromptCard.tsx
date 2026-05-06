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
      className="group bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col h-full"
    >
      {/* Preview Area */}
      <div className="p-4">
        <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
          <img 
            src={prompt.image_url} 
            alt={prompt.category}
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
             <span className="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg shadow-xl">
               {prompt.category}
             </span>
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="px-5 pb-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-5 bg-slate-200"></div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Prompter</span>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6 font-medium">
          {prompt.prompt_text}
        </p>

        <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2.5">
             <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
               P
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Library AI</span>
           </div>
           <span className="text-[10px] font-bold text-slate-300">
             {new Date(prompt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 pb-4 mt-auto">
        <button 
          onClick={copyToClipboard}
          className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-sm ${
            copied 
              ? 'bg-green-50 border-green-200 text-green-600' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {copied ? (
            <>
              <Check size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span className="text-[11px] font-bold uppercase tracking-widest">Copy Prompt</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
