import React, { useState } from 'react';
import { Copy, Check, Play, ExternalLink, BookOpen, RefreshCw, Trash2, Maximize2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionBlueprintModal } from './ProductionBlueprintModal';
import { PromptDetailModal } from './PromptDetailModal';
import { VideoPlayerModal } from './VideoPlayerModal';
import { getVideoThumbnail } from '../../lib/aiScripter';

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
  isSelected?: boolean;
  onSelect?: () => void;
  isSelectionMode?: boolean;
}> = ({ prompt, onDeleted, showToast, isSelected, onSelect, isSelectionMode }) => {
  const [copied, setCopied] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(prompt.video_url || '');


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
      onClick={() => isSelectionMode && onSelect?.()}
      className={`group bg-white rounded-3xl overflow-hidden border transition-all duration-500 flex flex-col h-full ${
        isSelected 
          ? 'border-[#EE5A24] ring-2 ring-[#EE5A24]/20 shadow-2xl shadow-[#EE5A24]/10' 
          : 'border-slate-200 hover:border-brand-primary/30 hover:shadow-2xl hover:shadow-slate-200/50'
      } ${isSelectionMode ? 'cursor-pointer' : ''}`}
    >
      <div className="p-4">
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group/media">
            <>
              <img 
                src={getVideoThumbnail(prompt.video_url) || prompt.image_url} 
                alt={prompt.category}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                 <span className="bg-[#11202C]/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 border border-white/10">
                   {isVideo && <Play size={10} className="fill-[#EE5A24] text-[#EE5A24]" />}
                   {prompt.category}
                 </span>
              </div>
              
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <div className="absolute top-3 right-3 z-30">
                  <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${
                    isSelected 
                      ? 'bg-[#EE5A24] border-[#EE5A24] shadow-lg shadow-[#EE5A24]/20' 
                      : 'bg-white/20 backdrop-blur-md border-white/40'
                  }`}>
                    {isSelected && <Check size={14} className="text-white stroke-[4]" />}
                  </div>
                </div>
              )}
              
              {isVideo && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-[#11202C]/10 group-hover:bg-black/0 transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelectionMode) {
                      onSelect?.();
                    } else {
                      setIsBlueprintOpen(true);
                    }
                  }}
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentVideoUrl) {
                        setIsVideoModalOpen(true);
                      } else {
                        setIsBlueprintOpen(true);
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-white text-[#EE5A24] border border-white/30 flex items-center justify-center shadow-2xl scale-100 hover:scale-125 transition-all z-20"
                  >
                    <Play size={20} className="fill-[#EE5A24] ml-0.5" />
                  </div>
                </div>
              )}
            </>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="px-5 pb-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-5 bg-gradient-to-r from-[#EE5A24] to-[#E22A1D]"></div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#EE5A24]">Prompter</span>
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
         <span className="text-[10px] font-black text-[#EE5A24]/40">
           {new Date(prompt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
         </span>
        </div>
      </div>

      <div className="px-4 pb-4 mt-auto flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); isSelectionMode ? onSelect?.() : (isVideo ? setIsBlueprintOpen(true) : setIsDetailOpen(true)); }}
          className={`flex-1 h-11 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm ${
            isSelected ? 'bg-[#EE5A24] text-white' : 'bg-[#11202C] text-white hover:bg-[#1a2f3f]'
          }`}
        >
          {isSelectionMode ? (
            <>{isSelected ? <Check size={16} /> : <Plus size={16} />} <span className="text-[11px] font-black uppercase tracking-widest">{isSelected ? 'Selected' : 'Select'}</span></>
          ) : (
            <>{isVideo ? <BookOpen size={16} /> : <Maximize2 size={16} />} <span className="text-[11px] font-black uppercase tracking-widest">{isVideo ? 'Blueprint' : 'Expand'}</span></>
          )}
        </button>

        {!isVideo && !isSelectionMode && (
          <button 
            onClick={copyToClipboard}
            className={`h-11 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border shadow-sm ${
              copied 
                ? 'bg-[#EE5A24]/10 border-[#EE5A24]/20 text-[#EE5A24]' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Copy Prompt"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}

        {isVideo && !isSelectionMode && (
          <div className="flex gap-2">
            <a 
              href={`/director?refine=${prompt.id}`}
              className="h-11 px-3 rounded-xl bg-[#EE5A24]/10 text-[#EE5A24] hover:bg-[#EE5A24]/20 border border-[#EE5A24]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              title="Refine in Director Suite"
            >
              <RefreshCw size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Refine</span>
            </a>
            <button 
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm"
              title="Delete Item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        {!isVideo && !isSelectionMode && (
           <button 
             onClick={handleDeleteClick}
             disabled={isDeleting}
             className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-95 shadow-sm"
             title="Delete Item"
           >
             <Trash2 size={16} />
           </button>
        )}
      </div>

      {isVideo ? (
        <ProductionBlueprintModal 
          isOpen={isBlueprintOpen}
          onClose={() => setIsBlueprintOpen(false)}
          projectName={prompt.prompt_text.split('\n\n')[0].replace('Concept: ', '')}
          characterAnchor={prompt.character_anchor}
          frames={prompt.frames || []}
          summary={prompt.summary}
          videoUrl={currentVideoUrl}
          prompt_id={prompt.id}
          project_id={prompt.project_id}
          history={prompt.history}
          onUpdateVideoUrl={(newUrl) => setCurrentVideoUrl(newUrl)}
        />
      ) : (
        <PromptDetailModal 
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          prompt={prompt}
        />
      )}

      {currentVideoUrl && (
        <VideoPlayerModal 
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={currentVideoUrl}
          title={prompt.prompt_text.split('\n\n')[0].replace('Concept: ', '')}
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

