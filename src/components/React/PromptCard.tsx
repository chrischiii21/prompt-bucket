import React, { useState } from 'react';
import { Copy, Check, Play, ExternalLink, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionBlueprintModal } from './ProductionBlueprintModal';

interface Prompt {
  id: string;
  prompt_text: string;
  tags?: string[];
  video_url?: string;
  created_at: string;
  character_anchor?: any;
  frames?: any[];
}

export const PromptCard: React.FC<{ prompt: Prompt }> = ({ prompt }) => {
  const [copied, setCopied] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

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
             <span className="bg-slate-900/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5">
               {prompt.category === 'Video' && <Play size={10} className="fill-current" />}
               {prompt.category}
             </span>
          </div>
          {prompt.category === 'Video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-all">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl">
                <Play size={24} className="fill-current ml-1" />
              </div>
            </div>
          )}
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
      <div className="px-4 pb-4 mt-auto flex gap-2">
        {prompt.category === 'Video' ? (
          <button 
            onClick={() => setIsBlueprintOpen(true)}
            className="flex-1 h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
          >
            <BookOpen size={16} />
            <span className="text-[11px] font-bold uppercase tracking-widest">View Blueprint</span>
          </button>
        ) : (
          <button 
            onClick={copyToClipboard}
            className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-sm ${
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
                <span className="text-[11px] font-bold uppercase tracking-widest">Copy</span>
              </>
            )}
          </button>
        )}

        {prompt.video_url && (
          <a 
            href={prompt.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
          >
            <ExternalLink size={16} />
            <span className="text-[11px] font-bold uppercase tracking-widest">Watch</span>
          </a>
        )}
      </div>

      <ProductionBlueprintModal 
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
        projectName={prompt.prompt_text.split('\n\n')[0].replace('Concept: ', '')}
        characterAnchor={prompt.character_anchor}
        frames={prompt.frames || []}
        videoUrl={prompt.video_url}
      />
    </motion.div>
  );
};
