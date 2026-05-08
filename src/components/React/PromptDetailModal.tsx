import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Calendar, Tag, Image as ImageIcon } from 'lucide-react';

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: {
    prompt_text: string;
    image_url?: string;
    category?: string;
    tags?: string[];
    created_at: string;
  };
}

export const PromptDetailModal: React.FC<PromptDetailModalProps> = ({ isOpen, onClose, prompt }) => {
  const [copied, setCopied] = React.useState(false);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]"
          >
            {/* Left Side: Large Preview */}
            <div className="w-full md:w-1/2 bg-[#FBFBFB] relative group overflow-hidden flex items-center justify-center">
              <img 
                src={prompt.image_url} 
                alt={prompt.category}
                className="w-full h-full object-contain md:object-cover"
              />
              <div className="absolute top-6 left-6">
                 <span className="bg-[#11202C]/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl">
                   {prompt.category}
                 </span>
              </div>
            </div>

            {/* Right Side: Content Area */}
            <div className="flex-1 p-8 md:p-12 bg-white flex flex-col overflow-y-auto custom-scrollbar">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 z-50"
              >
                <X size={20} />
              </button>

              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#FB8304]/5 flex items-center justify-center text-[#FB8304]">
                    <ImageIcon size={18} />
                  </div>
                  <h2 className="text-xl font-black text-[#11202C] tracking-tight">Prompt Blueprint</h2>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Detailed Visual Specification</p>
              </div>

              <div className="flex-1 space-y-10">
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Prompt</h3>
                    <button 
                      onClick={copyPrompt}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-[#11202C] hover:text-white'
                      }`}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-6 bg-[#FBFBFB] rounded-3xl border border-slate-100 relative overflow-hidden">
                    <p className="text-sm font-medium text-[#11202C] leading-relaxed italic">
                      "{prompt.prompt_text}"
                    </p>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Calendar size={12} className="text-[#FB8304]" /> Created On
                    </h3>
                    <p className="text-sm font-bold text-[#11202C]">
                      {new Date(prompt.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Tag size={12} className="text-[#FB8304]" /> Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags?.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                          {tag}
                        </span>
                      )) || <span className="text-xs text-slate-300 italic">No tags</span>}
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50">
                 <button 
                  onClick={onClose}
                  className="w-full py-4 bg-[#11202C] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1a2f3f] transition-all shadow-xl shadow-[#11202C]/10"
                 >
                   Close Detail
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
