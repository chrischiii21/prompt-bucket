import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clapperboard, Copy, Check, ExternalLink, Film, Sparkles, Clock } from 'lucide-react';

interface Frame {
  timestamp: string;
  duration: string;
  shot_type: string;
  final_prompt: string;
}

interface CharacterAnchor {
  description: string;
  seed_prompt: string;
}

interface ProductionBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  characterAnchor: CharacterAnchor;
  frames?: any[];
  videoUrl?: string;
  summary?: string;
  project_id?: string;
  history?: any[];
}

export const ProductionBlueprintModal: React.FC<ProductionBlueprintModalProps> = ({ 
  isOpen, 
  onClose, 
  projectName, 
  characterAnchor, 
  frames,
  videoUrl,
  summary,
  history = []
}) => {
  const [currentVersion, setCurrentVersion] = React.useState({ characterAnchor, frames, summary });
  const [versionIdx, setVersionIdx] = React.useState<number>(-1);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  let currentElapsed = 0;

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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Production Blueprint • {frames.length} Scenes</p>
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
                
                {/* Version Multiverse Toggle */}
                {history && history.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                      onClick={() => {
                        setVersionIdx(-1);
                        setCurrentVersion({ characterAnchor, frames, summary });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        versionIdx === -1 ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Latest
                    </button>
                    {history.map((v: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVersionIdx(idx);
                          setCurrentVersion({ 
                            characterAnchor: v.character_anchor, 
                            frames: v.frames, 
                            summary: v.summary 
                          });
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          versionIdx === idx ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        V{idx + 1}
                      </button>
                    ))}
                  </div>
                )}

                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>


              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12">
                  {/* Narrative Synthesis Section */}
                  {currentVersion.summary && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-indigo-600"></div>
                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Story Narrative Synthesis</h3>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-indigo-500/5">
                          <Sparkles size={100} />
                        </div>
                        <p className="text-base text-slate-800 leading-relaxed font-medium italic relative z-10">
                          "{currentVersion.summary}"
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Character Anchor Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-8 bg-indigo-600"></div>
                      <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Character Identity Anchor</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Description</h4>
                        <p className="text-sm font-bold text-slate-900 leading-relaxed italic border-l-2 border-indigo-100 pl-4 py-1">
                          "{currentVersion.characterAnchor?.description || 'Standard Cinematic'}"
                        </p>
                      </div>
                      <div className="p-8 bg-slate-900 rounded-[2rem] shadow-xl text-indigo-100/80">
                        <h4 className="text-[10px] font-black text-indigo-400/50 uppercase tracking-widest mb-4">Stable Prompt Seed</h4>
                        <p className="text-xs font-mono font-bold leading-relaxed">
                          {currentVersion.characterAnchor?.seed_prompt || 'Standard Cinematic Seed'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Scene Timeline Section */}
                  <section className="space-y-6 pb-12">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-px w-8 bg-indigo-600"></div>
                      <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Production Scene Timeline</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {(currentVersion.frames || []).map((frame: any, index: number) => {
                        const durationInt = parseInt(frame.duration) || 3;
                        const timestamp = currentElapsed;
                        currentElapsed += durationInt;

                        return (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex gap-6 items-start"
                          >
                            <div className="w-16 flex flex-col items-center gap-2 pt-2">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{timestamp}s</span>
                              <div className="w-px h-12 bg-indigo-50" />
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] font-black">
                                {index + 1}
                              </div>
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-lg bg-indigo-50 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                  {frame.shot_type}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                  <Clock size={12} /> {frame.duration}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 leading-relaxed pr-12">
                                {frame.final_prompt}
                              </p>
                            </div>

                            <button
                              onClick={() => copyPrompt(frame.final_prompt, index)}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                copiedIndex === index 
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'
                              }`}
                            >
                              {copiedIndex === index ? <Check size={20} /> : <Copy size={20} />}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
