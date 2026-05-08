import React, { useState } from 'react';
import { Copy, Check, Play, ExternalLink, BookOpen, RefreshCw, Trash2, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionBlueprintModal } from './ProductionBlueprintModal';
import { PromptDetailModal } from './PromptDetailModal';

interface Prompt {
  id: string;
  prompt_text: string;
  tags?: string[];
  video_url?: string;
  created_at: string;
  character_anchor?: any;
  frames?: any[];
  summary?: string;
  project_id?: string;
  history?: any[];
  image_url?: string;
  category?: string;
}

export const PromptCard: React.FC<{ 
  prompt: Prompt;
  onDeleted?: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}> = ({ prompt, onDeleted, showToast }) => {
  const [copied, setCopied] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);
    try {
      // Stage 1: Delete from library (prompts table)
      const { error, count } = await supabase
        .from('prompts')
        .delete({ count: 'exact' })
        .eq('id', prompt.id);
      
      if (error) throw error;
      
      if (count === 0) {
        throw new Error('Database denied deletion. Check your Supabase RLS policies.');
      }

      // Stage 2: Clean up internal project (projects table)
      if (prompt.project_id) {
        await supabase
          .from('projects')
          .delete()
          .eq('id', prompt.project_id);
      }

      setIsDeleted(true);
      if (onDeleted) onDeleted();
    } catch (err: any) {
      console.error('Failed to delete:', err);
      if (showToast) {
        showToast(`Could not delete item: ${err.message || 'Access Denied'}`, 'error');
      } else {
        alert(`Could not delete item: ${err.message || 'Access Denied'}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  if (isDeleted) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const isVideo = prompt.category === 'Video';

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
             <span className="bg-[#11202C]/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 border border-white/10">
               {isVideo && <Play size={10} className="fill-[#FB8304] text-[#FB8304]" />}
               {prompt.category}
             </span>
          </div>
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#11202C]/10 group-hover:bg-black/0 transition-all">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl">
                <Play size={24} className="fill-[#FB8304] text-[#FB8304] ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="px-5 pb-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-5 bg-gradient-to-r from-[#FB8304] to-[#E22A1D]"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FB8304]">Prompter</span>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-6 font-bold">
          {prompt.prompt_text}
        </p>

        <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2.5">
             <div className="w-7 h-7 rounded-lg bg-[#11202C] text-white flex items-center justify-center text-[10px] font-black">
               P
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library AI</span>
           </div>
           <span className="text-[10px] font-black text-[#FB8304]/40">
             {new Date(prompt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </span>
        </div>
      </div>

      <div className="px-4 pb-4 mt-auto flex gap-2">
        <button 
          onClick={() => isVideo ? setIsBlueprintOpen(true) : setIsDetailOpen(true)}
          className="flex-1 h-11 rounded-xl bg-[#11202C] text-white hover:bg-[#1a2f3f] transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
        >
          {isVideo ? <BookOpen size={16} /> : <Maximize2 size={16} />}
          <span className="text-[11px] font-black uppercase tracking-widest">{isVideo ? 'Blueprint' : 'Expand'}</span>
        </button>

        {!isVideo && (
          <button 
            onClick={copyToClipboard}
            className={`h-11 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-sm ${
              copied 
                ? 'bg-[#FB8304]/10 border-[#FB8304]/20 text-[#FB8304]' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Copy Prompt"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}

        {isVideo && (
          <a 
            href={`/director?refine=${prompt.id}`}
            className="h-11 px-4 rounded-xl bg-gradient-to-r from-[#FB8304] to-[#E22A1D] text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-[#FB8304]/20"
            title="Refine in Director Suite"
          >
            <RefreshCw size={16} />
          </a>
        )}

        {prompt.video_url && (
          <a 
            href={prompt.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-xl bg-[#11202C]/10 border border-[#11202C]/20 text-[#11202C] hover:bg-[#11202C]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
            title="Watch Video"
          >
            <ExternalLink size={16} />
          </a>
        )}

        <button 
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm"
          title="Delete Item"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {isVideo ? (
        <ProductionBlueprintModal 
          isOpen={isBlueprintOpen}
          onClose={() => setIsBlueprintOpen(false)}
          projectName={prompt.prompt_text.split('\n\n')[0].replace('Concept: ', '')}
          characterAnchor={prompt.character_anchor}
          frames={prompt.frames || []}
          summary={prompt.summary}
          videoUrl={prompt.video_url}
          history={prompt.history}
        />
      ) : (
        <PromptDetailModal 
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          prompt={prompt}
        />
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Item?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">
                This will permanently remove this {isVideo ? 'production' : 'prompt'} from your library. This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="h-12 rounded-xl bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="h-12 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

