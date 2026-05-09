import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clapperboard, Copy, Check, ExternalLink, Film, Sparkles, Clock, Edit3, Save, Loader2, Layers, Play } from 'lucide-react';
import { VideoPlayerModal } from './VideoPlayerModal';
import { supabase } from '../../lib/supabaseClient';
import { getVideoThumbnail } from '../../lib/aiScripter';

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
  prompt_id?: string;
  history?: any[];
  onUpdateVideoUrl?: (newUrl: string) => void;
}

export const ProductionBlueprintModal: React.FC<ProductionBlueprintModalProps> = ({ 
  isOpen, 
  onClose, 
  projectName, 
  characterAnchor, 
  frames,
  videoUrl,
  summary,
  project_id,
  prompt_id,
   history = [],
   onUpdateVideoUrl
 }) => {
   const [currentVersion, setCurrentVersion] = React.useState({ characterAnchor, frames, summary });
  const [versionIdx, setVersionIdx] = React.useState<number>(-1);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isEditingLink, setIsEditingLink] = React.useState(false);
  const [newVideoUrl, setNewVideoUrl] = React.useState(videoUrl || '');
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Frame-level video state
  const [linkingFrameIdx, setLinkingFrameIdx] = React.useState<number | null>(null);
  const [editedFrameUrl, setEditedFrameUrl] = React.useState('');
  const [playingFrameUrl, setPlayingFrameUrl] = React.useState<string | null>(null);

  let currentElapsed = 0;

  const copyPrompt = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveLink = async () => {
    if (!prompt_id) return;
    setIsSaving(true);
    try {
      // 1. Update prompts table
      const { error: promptError } = await supabase
        .from('prompts')
        .update({ video_url: newVideoUrl })
        .eq('id', prompt_id);
      
      if (promptError) throw promptError;

      // 2. Update projects table if linked
      if (project_id) {
        await supabase
          .from('projects')
          .update({ video_url: newVideoUrl })
          .eq('id', project_id);
      }

      if (onUpdateVideoUrl) onUpdateVideoUrl(newVideoUrl);
      setIsSaving(false);
      setIsEditingLink(false);
    } catch (err) {
      console.error('Failed to save link:', err);
      alert('Failed to save video link. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFrameVideo = async (index: number, url: string) => {
    if (!currentVersion.frames) return;
    
    setIsSaving(true);
    try {
      const updatedFrames = [...currentVersion.frames];
      updatedFrames[index] = { ...updatedFrames[index], video_url: url };
      
      if (project_id) {
        const { error } = await supabase.from('projects').update({ frames: updatedFrames }).eq('id', project_id);
        if (error) throw error;
      }
      if (prompt_id) {
        const { error } = await supabase.from('prompts').update({ frames: updatedFrames }).eq('id', prompt_id);
        if (error) throw error;
      }

      setCurrentVersion({ ...currentVersion, frames: updatedFrames });
      setLinkingFrameIdx(null);
    } catch (err) {
      console.error('Frame update failed:', err);
    } finally {
      setIsSaving(false);
    }
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
                  <div className="w-8 h-8 rounded-lg bg-[#11202C] flex items-center justify-center text-white shadow-lg shadow-[#11202C]/10">
                    <Clapperboard size={18} />
                  </div>
                  <h2 className="text-2xl font-black text-[#11202C] tracking-tight">{projectName}</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Production Blueprint • {currentVersion.frames?.length || 0} Scenes</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {isEditingLink ? (
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 shadow-sm animate-in fade-in slide-in-from-right-4">
                        <input 
                          type="url"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          placeholder="Paste Video URL..."
                          className="bg-transparent border-none text-xs text-[#11202C] focus:outline-none w-48 font-medium px-2"
                        />
                        <button 
                          onClick={handleSaveLink}
                          disabled={isSaving}
                          className="p-2 bg-[#11202C] text-white rounded-lg hover:bg-[#1a2f3f] transition-all disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button 
                          onClick={() => { setIsEditingLink(false); setNewVideoUrl(videoUrl || ''); }}
                          className="p-2 text-slate-400 hover:text-slate-600 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => setIsEditingLink(true)}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
                        >
                          <Edit3 size={14} />
                          {videoUrl ? 'Edit Link' : 'Add Video'}
                        </button>

                        {videoUrl && (
                          <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#EE5A24]/10 text-[#EE5A24] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#EE5A24]/20 transition-all shadow-sm"
                          >
                            {isPlaying ? <X size={14} /> : <Film size={14} />}
                            {isPlaying ? 'Close Video' : 'Watch Final'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Version Multiverse Toggle */}
                {history && history.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button
                      onClick={() => {
                        setVersionIdx(-1);
                        setCurrentVersion({ characterAnchor, frames, summary });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        versionIdx === -1 ? 'bg-[#11202C] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
                          versionIdx === idx ? 'bg-[#EE5A24] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
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
                        <div className="h-px w-8 bg-[#EE5A24]"></div>
                        <h3 className="text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.3em]">Story Narrative Synthesis</h3>
                      </div>
                      <div className="p-8 bg-[#FBFBFB] rounded-[2.5rem] border border-slate-100 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 p-8 text-[#EE5A24]/5">
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
                      <div className="h-px w-8 bg-[#EE5A24]"></div>
                      <h3 className="text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.3em]">Character Identity Anchor</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Core Description</h4>
                        <p className="text-sm font-bold text-[#11202C] leading-relaxed italic border-l-2 border-[#EE5A24]/20 pl-4 py-1">
                          "{currentVersion.characterAnchor?.description || 'Standard Cinematic'}"
                        </p>
                      </div>
                      <div className="p-8 bg-[#11202C] rounded-[2rem] shadow-xl text-[#EE5A24]/80">
                        <h4 className="text-[10px] font-black text-[#EE5A24]/40 uppercase tracking-widest mb-4">Stable Prompt Seed</h4>
                        <p className="text-xs font-mono font-bold leading-relaxed text-white">
                          {currentVersion.characterAnchor?.seed_prompt || 'Standard Cinematic Seed'}
                        </p>
                      </div>
                    </div>
                  </section>
                   <section className="space-y-6 pb-12">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-px w-8 bg-[#11202C]"></div>
                      <h3 className="text-[10px] font-black text-[#11202C] uppercase tracking-[0.3em]">Production Scene Timeline</h3>
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
                            className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-[#EE5A24]/30 hover:shadow-xl hover:shadow-[#EE5A24]/5 transition-all flex flex-col md:flex-row gap-6 items-start"
                          >
                            {/* Shot Preview Space */}
                            <div className="w-full md:w-48 aspect-video rounded-2xl bg-slate-50 border border-slate-100 relative overflow-hidden group/thumb shrink-0">
                               {frame.video_url ? (
                                 <div className="w-full h-full relative cursor-pointer" onClick={() => setPlayingFrameUrl(frame.video_url)}>
                                   <img 
                                     src={getVideoThumbnail(frame.video_url) || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800'} 
                                     className="w-full h-full object-cover group-hover/thumb:scale-110 transition-all duration-700"
                                     alt="Shot Preview"
                                   />
                                   <div className="absolute inset-0 bg-[#11202C]/40 flex items-center justify-center">
                                      <div className="w-10 h-10 rounded-full bg-white text-[#EE5A24] flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition-all">
                                        <Play size={16} className="ml-0.5 fill-[#EE5A24]" />
                                      </div>
                                   </div>
                                   <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[7px] font-black text-white uppercase tracking-widest">
                                     Watch Scene
                                   </div>
                                 </div>
                               ) : (
                                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                    <Film size={20} className="opacity-20" />
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40">No Preview</span>
                                 </div>
                               )}
                            </div>

                            <div className="w-16 hidden md:flex flex-col items-center gap-2 pt-2">
                              <span className="text-[10px] font-black text-[#EE5A24] uppercase tracking-widest">{timestamp}s</span>
                              <div className="w-px h-12 bg-slate-100" />
                              <div className="w-8 h-8 rounded-full bg-[#11202C] flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-[#11202C]/20">
                                {index + 1}
                              </div>
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-lg bg-[#EE5A24]/5 text-[9px] font-black text-[#EE5A24] uppercase tracking-widest">
                                  {frame.shot_type}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                  <Clock size={12} /> {frame.duration}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-[#11202C] leading-relaxed">
                                {frame.final_prompt}
                              </p>

                              {/* Frame Link Manager */}
                              <div className="pt-2">
                                {linkingFrameIdx === index ? (
                                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <input 
                                      type="text"
                                      value={editedFrameUrl}
                                      onChange={(e) => setEditedFrameUrl(e.target.value)}
                                      placeholder="Paste scene video link..."
                                      className="flex-grow bg-slate-50 border border-[#EE5A24]/20 rounded-xl px-4 py-2 text-[10px] focus:outline-none focus:border-[#EE5A24] font-medium"
                                      autoFocus
                                    />
                                    <button 
                                      onClick={() => handleUpdateFrameVideo(index, editedFrameUrl)}
                                      className="p-2 bg-[#EE5A24] text-white rounded-xl hover:bg-[#EE5A24]/80 transition-all"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button 
                                      onClick={() => setLinkingFrameIdx(null)}
                                      className="p-2 text-slate-400 hover:text-red-500"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      setLinkingFrameIdx(index);
                                      setEditedFrameUrl(frame.video_url || '');
                                    }}
                                    className="flex items-center gap-2 text-[9px] font-black text-slate-400 hover:text-[#EE5A24] transition-all uppercase tracking-widest"
                                  >
                                    <Film size={12} />
                                    {frame.video_url ? 'Update Scene Link' : 'Link Shot Video'}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                onClick={() => copyPrompt(frame.final_prompt, index)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                  copiedIndex === index 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-[#11202C] hover:text-white'
                                }`}
                              >
                                {copiedIndex === index ? <Check size={20} /> : <Copy size={20} />}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                </div>
            </div>
          </motion.div>
          {videoUrl && (
            <VideoPlayerModal 
              isOpen={isPlaying}
              onClose={() => setIsPlaying(false)}
              videoUrl={videoUrl}
              title={projectName}
            />
          )}

          {playingFrameUrl && (
            <VideoPlayerModal 
              isOpen={!!playingFrameUrl}
              onClose={() => setPlayingFrameUrl(null)}
              videoUrl={playingFrameUrl}
              title={`Shot Detail`}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
