import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Clock, Clapperboard, ArrowRight, UserCircle, Check, X, RefreshCw, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import * as aiScripter from '../../../lib/aiScripter';
import type { CharacterAnchor } from '../../../lib/aiScripter';

const FALLBACK_PROMPTS = {
  character: ["A mysterious traveler in a strange land.", "A hero facing their greatest challenge."],
  text: ["Modern title sequence with bold typography.", "Clean infographic presentation."],
  abstract: ["Ethereal lights in a deep void.", "Rhythmic patterns of color and sound."]
};

const getRandomPrompts = (type: keyof typeof FALLBACK_PROMPTS, count: number = 2) => {
  const pool = FALLBACK_PROMPTS[type] || [];
  return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
};

interface ScripterFormProps {
  onGenerate: (concept: string, duration: number, productionType: string, genre: string, existingCharacter?: CharacterAnchor) => void;
  isGenerating: boolean;
}

export const ScripterForm: React.FC<ScripterFormProps> = ({ onGenerate, isGenerating }) => {
  const [concept, setConcept] = useState('');
  const [genre, setGenre] = useState('');
  const [duration, setDuration] = useState(30);
  const [durationMode, setDurationMode] = useState<'preset' | 'custom' | 'flexible'>('preset');
  const [productionType, setProductionType] = useState<'character' | 'text' | 'abstract'>('character');
  const [approvedProjects, setApprovedProjects] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterAnchor | null>(null);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [characterOption, setCharacterOption] = useState<'library' | 'upload'>('library');
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activePrompts, setActivePrompts] = useState<string[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  useEffect(() => {
    setActivePrompts(getRandomPrompts(productionType as any));
  }, [productionType]);

  const handleGenerateIdeas = async () => {
    if (!genre.trim()) return;
    setIsGeneratingIdeas(true);
    try {
      const ideas = await aiScripter.generateIdeas(genre, productionType);
      setActivePrompts(ideas);
    } catch (err) {
      console.error('Failed to generate ideas:', err);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsUploading(true);
    setImagePrompt('');
    setSelectedCharacter(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `character-references/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('prompt-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(filePath);

      setReferenceImageUrl(publicUrl);

      // Fetch prompt equivalent
      try {
        const response = await fetch('/api/describe-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: publicUrl })
        });
        if (response.ok) {
          const promptData = await response.json();
          if (promptData.prompt) {
            setImagePrompt(promptData.prompt);
          }
        }
      } catch (promptErr) {
        console.error('Failed to get image prompt:', promptErr);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (concept.trim()) {
      const finalDuration = durationMode === 'flexible' ? 0 : duration;
      onGenerate(concept, finalDuration, productionType, genre, referenceImageUrl, selectedCharacter || undefined);
    }
  };

  const GENRE_TAGS = ['Cyberpunk', 'Cinematic Noir', 'Fantasy', 'Corporate', 'Minimalist', 'Sci-Fi', 'Horror', 'Documentary'];

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

              {/* 2. Character Anchor */}
              {productionType === 'character' && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4 ml-1">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-6 bg-[#EE5A24]"></div>
                      <label className="block text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.2em]">2. Character Anchor</label>
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setCharacterOption('library')}
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${characterOption === 'library' ? 'bg-white text-[#EE5A24] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Library
                      </button>
                      <button
                        type="button"
                        onClick={() => setCharacterOption('upload')}
                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${characterOption === 'upload' ? 'bg-white text-[#EE5A24] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {characterOption === 'library' ? (
                      <motion.div
                        key="library"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {approvedProjects.length > 0 && (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Saved Identities</span>
                              <button 
                                type="button"
                                onClick={() => setShowCharacterPicker(!showCharacterPicker)}
                                className="text-[8px] font-bold text-[#EE5A24] uppercase tracking-widest"
                              >
                                {showCharacterPicker ? 'Close' : 'Browse'}
                              </button>
                            </div>

                            {showCharacterPicker && (
                              <div className="grid grid-cols-1 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {approvedProjects.map((project) => (
                                  <button
                                    key={project.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCharacter(project.character_anchor);
                                      setShowCharacterPicker(false);
                                    }}
                                    className={`p-3 rounded-lg border transition-all text-left bg-white ${
                                      selectedCharacter?.description === project.character_anchor.description
                                        ? 'border-[#EE5A24] shadow-sm'
                                        : 'border-slate-100 hover:border-slate-200'
                                    }`}
                                  >
                                    <p className="text-[9px] font-bold text-slate-800 uppercase truncate">{project.project_name}</p>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {selectedCharacter ? (
                          <div className="p-4 bg-white border-2 border-[#EE5A24]/30 rounded-2xl flex items-center gap-4 shadow-lg shadow-[#EE5A24]/5">
                            <img src={selectedCharacter.image_url || ''} className="w-12 h-12 rounded-xl object-cover" alt="" />
                            <div className="flex-grow min-w-0">
                              <p className="text-[8px] font-black text-[#EE5A24] uppercase tracking-widest mb-0.5">Selected Anchor</p>
                              <p className="text-[10px] font-bold text-[#11202C] truncate leading-tight">{selectedCharacter.description.split(',')[0]}</p>
                            </div>
                            <button onClick={() => setSelectedCharacter(null)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                          </div>
                        ) : !showCharacterPicker && (
                          <button
                            type="button"
                            onClick={() => setShowCharacterPicker(true)}
                            className="w-full py-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#EE5A24]/30 hover:bg-slate-50 transition-all text-slate-300 hover:text-[#EE5A24]"
                          >
                            <UserCircle size={20} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Choose From Library</span>
                          </button>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        {referenceImageUrl ? (
                          <div className="space-y-3">
                            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-[#EE5A24]/30 shadow-lg shadow-[#EE5A24]/5 group">
                              <img src={referenceImageUrl} className="w-full h-full object-cover" alt="Reference" />
                              <div className="absolute inset-0 bg-[#11202C]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-lg text-[#11202C] hover:text-[#EE5A24]"><RefreshCw size={14} /></button>
                                <button type="button" onClick={() => { setReferenceImageUrl(''); setImagePrompt(''); }} className="p-2 bg-white rounded-lg text-red-500"><X size={14} /></button>
                              </div>
                            </div>
                            {imagePrompt ? (
                              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative group">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles size={12} className="text-[#EE5A24]" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#11202C]">AI Extracted Prompt</span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                  {imagePrompt}
                                </p>
                                <button 
                                  type="button" 
                                  onClick={() => navigator.clipboard.writeText(imagePrompt)}
                                  className="absolute top-3 right-[70px] text-[9px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-[#11202C]"
                                >
                                  Copy
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedCharacter({ description: imagePrompt, seed_prompt: imagePrompt, image_url: referenceImageUrl })}
                                  className={`absolute top-3 right-3 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded shadow-sm border flex items-center gap-1 ${selectedCharacter?.description === imagePrompt ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-[#EE5A24] border-[#EE5A24]/20 hover:bg-[#EE5A24] hover:text-white'}`}
                                >
                                  <Check size={10} /> {selectedCharacter?.description === imagePrompt ? 'Anchored!' : 'Use as Anchor'}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                                <RefreshCw size={12} className="animate-spin" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Extracting image prompt...</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full py-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-[#EE5A24]/30 hover:bg-slate-50 transition-all text-slate-300 hover:text-[#EE5A24]"
                          >
                            {isUploading ? <RefreshCw size={20} className="animate-spin text-[#EE5A24]" /> : <ImageIcon size={20} />}
                            <span className="text-[9px] font-black uppercase tracking-widest">Upload Character Image</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

            <div className="lg:col-span-2 flex flex-col h-full min-h-[500px]">
              {/* 5. Genre & Style Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4 ml-1">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-6 bg-[#EE5A24]"></div>
                    <label className="block text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.2em]">4. Genre & Topic</label>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleGenerateIdeas}
                    disabled={isGeneratingIdeas || !genre.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#11202C] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#1a2f3f] transition-all disabled:opacity-30 shadow-sm"
                  >
                    {isGeneratingIdeas ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Brainstorm Suggestions
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g. Cinematic Sci-Fi horror, Luxury car ad, 90s retro quiz..."
                      className="w-full bg-[#FBFBFB] border border-slate-100 rounded-2xl px-6 py-4 text-sm text-[#11202C] focus:outline-none focus:ring-4 focus:ring-[#EE5A24]/5 focus:border-[#EE5A24]/30 transition-all font-medium placeholder:text-slate-300"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GENRE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setGenre(tag)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                          genre === tag 
                            ? 'bg-[#EE5A24] text-white shadow-lg shadow-[#EE5A24]/20' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions area */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 ml-1">
                  <div className="h-px w-4 bg-slate-200"></div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Suggested Concepts</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {isGeneratingIdeas ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>
                    ))
                  ) : (
                    activePrompts.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setConcept(p)}
                        className="p-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-500 hover:text-[#EE5A24] hover:border-[#EE5A24]/30 hover:shadow-md transition-all text-left relative overflow-hidden group"
                      >
                         <div className="absolute top-0 left-0 w-1 h-full bg-[#EE5A24] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <p className="line-clamp-2 leading-relaxed">{p}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>


              <div className="flex items-center gap-2 mb-4 ml-1">
                <div className="h-px w-6 bg-[#EE5A24]"></div>
                <label className="block text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.2em]">5. Final Concept Script</label>
              </div>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={selectedCharacter ? `Describe what ${selectedCharacter.description.split(',')[0]} is doing...` : "Select a suggestion above or write your own..."}
                className="flex-grow w-full bg-[#FBFBFB] border border-slate-100 rounded-[1.5rem] p-6 text-sm text-[#11202C] focus:outline-none focus:ring-4 focus:ring-[#EE5A24]/5 focus:border-[#EE5A24]/30 transition-all resize-none placeholder:text-slate-300 font-medium min-h-[150px]"
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
