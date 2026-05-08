import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Clapperboard, ArrowRight, UserCircle, Check, X, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { CharacterAnchor } from '../../../lib/aiScripter';

interface ScripterFormProps {
  onGenerate: (concept: string, duration: number, productionType: string, existingCharacter?: CharacterAnchor) => void;
  isGenerating: boolean;
}

export const ScripterForm: React.FC<ScripterFormProps> = ({ onGenerate, isGenerating }) => {
  const [concept, setConcept] = useState('');
  const [duration, setDuration] = useState(30);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom' | 'flexible'>('preset');
  const [productionType, setProductionType] = useState<'character' | 'text' | 'abstract'>('character');
  const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterAnchor | null>(null);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, character_anchor')
        .eq('status', 'Approved')
        .order('created_at', { ascending: false });

      if (data) {
        // Filter unique characters based on description
        const uniqueChars: any[] = [];
        const seen = new Set();
        data.forEach(p => {
          if (!seen.has(p.character_anchor.description)) {
            seen.add(p.character_anchor.description);
            uniqueChars.push(p);
          }
        });
        setApprovedProjects(uniqueChars);
      }
    };
    fetchCharacters();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (concept.trim()) {
      const finalDuration = durationMode === 'flexible' ? 0 : duration;
      onGenerate(concept, finalDuration, productionType, selectedCharacter || undefined);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-2">
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EE5A24]/5 flex items-center justify-center text-[#EE5A24] border border-[#EE5A24]/10 shadow-sm">
              <Clapperboard size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#11202C] tracking-tight">Phase 1: AI Scripter</h2>
              <p className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Workspace Core</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ready for Concept</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Pre-Production Specs (1/3) */}
            <div className="lg:col-span-1 space-y-6 border-r border-slate-100 pr-8">
              {/* 1. Production Modality */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <div className="h-px w-6 bg-[#EE5A24]"></div>
                  <label className="block text-[10px] font-black text-[#11202C] uppercase tracking-[0.2em]">1. Modality</label>
                </div>
                <div className="grid grid-cols-1 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  {[
                    { id: 'character', label: 'Character Driven', desc: 'Narrative with consistent identity' },
                    { id: 'text', label: 'Text & Graphics', desc: 'Quizzes, typography, visuals only' },
                    { id: 'abstract', label: 'Exp / No Faces', desc: 'Landscape, abstract, no faces' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setProductionType(type.id as any)}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all text-left ${
                        productionType === type.id 
                          ? 'bg-white text-[#11202C] shadow-sm border border-slate-100' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <div>
                        <p className={`text-[11px] font-black uppercase tracking-[0.1em] ${productionType === type.id ? 'text-[#EE5A24]' : ''}`}>
                          {type.label}
                        </p>
                      </div>
                      {productionType === type.id && <Check size={14} className="text-[#EE5A24]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Character Reference */}
              {productionType === 'character' && approvedProjects.length > 0 && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-4 ml-1">
                    <div className="flex items-center gap-2">
                        <div className="h-px w-6 bg-emerald-500"></div>
                        <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">2. Character Anchor</label>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowCharacterPicker(!showCharacterPicker)}
                      className="text-[9px] font-bold text-slate-400 hover:text-[#11202C] uppercase tracking-widest transition-colors"
                    >
                      {showCharacterPicker ? 'Close' : 'Browse'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showCharacterPicker && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="grid grid-cols-1 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-[180px] overflow-y-auto custom-scrollbar">
                          {approvedProjects.map((project) => (
                            <button
                              key={project.id}
                              type="button"
                              onClick={() => setSelectedCharacter(
                                selectedCharacter?.description === project.character_anchor.description ? null : project.character_anchor
                              )}
                              className={`p-3 rounded-lg border transition-all text-left ${
                                selectedCharacter?.description === project.character_anchor.description
                                  ? 'bg-white border-emerald-500 shadow-sm'
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <p className="text-[10px] font-bold text-slate-800 uppercase truncate">
                                {project.project_name}
                              </p>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {selectedCharacter && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Selected Identity</span>
                        <button onClick={() => setSelectedCharacter(null)} className="text-emerald-300 hover:text-emerald-500"><X size={14} /></button>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-emerald-600/50 uppercase tracking-widest mb-1">Full Description</p>
                        <p className="text-[10px] text-emerald-800 leading-relaxed italic line-clamp-3">"{selectedCharacter.description}"</p>
                      </div>
                      <div className="pt-2 border-t border-emerald-100/50">
                        <p className="text-[8px] font-black text-emerald-600/50 uppercase tracking-widest mb-1">Seed Prompt</p>
                        <p className="text-[9px] font-mono text-emerald-700/70 break-words line-clamp-2">{selectedCharacter.seed_prompt}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* 3. Timeline Mode */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <div className="h-px w-6 bg-[#EE5A24]"></div>
                  <label className="block text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.2em]">3. Duration</label>
                </div>
                <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  {['preset', 'custom', 'flexible'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMode(m as any)}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        durationMode === m ? 'bg-white text-[#11202C] shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="min-h-[50px] flex items-center justify-center">
                  {durationMode === 'preset' && (
                    <div className="flex gap-3">
                      {[15, 30, 60].map(s => (
                        <button 
                          key={s} 
                          type="button" 
                          onClick={() => setDuration(s)} 
                          className={`w-14 h-10 rounded-xl text-[11px] font-black border transition-all ${
                            duration === s 
                              ? 'bg-[#EE5A24] text-white border-[#EE5A24] shadow-lg shadow-[#EE5A24]/20 scale-105' 
                              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {s}s
                        </button>
                      ))}
                    </div>
                  )}
                  {durationMode === 'custom' && (
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={duration} 
                        onChange={(e) => setDuration(parseInt(e.target.value) || 5)} 
                        className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-[#11202C] focus:outline-none focus:border-[#EE5A24]/50" 
                      />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seconds</span>
                    </div>
                  )}
                  {durationMode === 'flexible' && (
                    <div className="flex items-center gap-2.5 text-[#EE5A24] text-[11px] font-black uppercase tracking-widest">
                      <Sparkles size={14} className="animate-pulse" /> AI Decides
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Concept Area (2/3) */}
            <div className="lg:col-span-2 flex flex-col h-full min-h-[450px]">
              <div className="flex items-center gap-2 mb-4 ml-1">
                <div className="h-px w-6 bg-[#EE5A24]"></div>
                <label className="block text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.2em]">4. The Concept Script</label>
              </div>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={selectedCharacter ? `Describe what ${selectedCharacter.description.split(',')[0]} is doing...` : "e.g. A Cyber Noir heist..."}
                className="flex-grow w-full bg-[#FBFBFB] border border-slate-100 rounded-[1.5rem] p-6 text-base text-[#11202C] focus:outline-none focus:ring-4 focus:ring-[#EE5A24]/5 focus:border-[#EE5A24]/30 transition-all resize-none placeholder:text-slate-300 font-medium"
                required
              />
            </div>
          </div>

          {/* Global Action Bar */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isGenerating || !concept.trim()}
              className="group relative w-full py-5 bg-[#11202C] text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#1a2f3f] transition-all shadow-xl shadow-[#11202C]/10 disabled:opacity-50 overflow-hidden"
            >
              {isGenerating ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Generate Production Blueprint</span>
                  <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
              
              {/* Visual Flair */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#EE5A24]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-8 text-center max-w-xl mx-auto opacity-30">
        {[
          { icon: <Sparkles size={22} />, label: "Character Synced" },
          { icon: <Clock size={22} />, label: "Beat Matched" },
          { icon: <Clapperboard size={22} />, label: "Production Ready" }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-3 text-slate-300">
            <div className="text-slate-400/50">{item.icon}</div>
            <span className="text-[10px] uppercase font-black tracking-[0.2em]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
