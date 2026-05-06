import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clapperboard, Copy, Check, ExternalLink } from 'lucide-react';

interface Frame {
  timestamp: string;
  shot_type: string;
  final_prompt: string;
}

interface CharacterAnchor {
  description: string;
  seed_prompt: string;
}

interface ProductionBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  characterAnchor: CharacterAnchor;
  frames: Frame[];
  videoUrl?: string;
}

export const ProductionBibleModal: React.FC<ProductionBibleModalProps> = ({ 
  isOpen, 
  onClose, 
  projectName, 
  characterAnchor, 
  frames,
  videoUrl
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyPrompt = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
            className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Clapperboard size={18} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{projectName}</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Production Bible • {frames.length} Scenes</p>
              </div>
              
              <div className="flex items-center gap-4">
                {videoUrl && (
                  <a 
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all"
                  >
                    <ExternalLink size={14} /> Watch Final
                  </a>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Sidebar */}
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Users size={16} className="text-indigo-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Character Anchor</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6 italic">
                      "{characterAnchor.description}"
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="text-[9px] text-slate-400 font-black uppercase mb-2 tracking-widest">Seed Prompt</div>
                       <p className="text-[10px] text-slate-500 font-mono leading-relaxed break-words">{characterAnchor.seed_prompt}</p>
                    </div>
                  </div>
                </div>

                {/* Main Timeline */}
                <div className="lg:col-span-2 space-y-6">
                  {frames.map((frame, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black text-white bg-slate-900 px-2.5 py-1 rounded-lg tracking-widest">
                            {frame.timestamp}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                            {frame.shot_type}
                          </span>
                        </div>
                        <button 
                          onClick={() => copyPrompt(frame.final_prompt, idx)}
                          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                          title="Copy Scene Prompt"
                        >
                          {copiedIndex === idx ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {frame.final_prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
