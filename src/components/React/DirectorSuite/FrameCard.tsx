import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Check, Sparkles, Film, Clock, Play, ExternalLink } from 'lucide-react';
import { refineFrame, getVideoThumbnail, type Frame, type CharacterAnchor } from '../../../lib/aiScripter';
import { VideoPlayerModal } from '../VideoPlayerModal';

interface FrameCardProps {
  frame: Frame;
  index: number;
  characterAnchor: CharacterAnchor;
  currentSummary: string;
  isReadOnly: boolean;
  onUpdate: (updatedFrame: Frame, updatedSummary: string, shouldCascade?: boolean) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ frame, index, characterAnchor, currentSummary, isReadOnly, onUpdate }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(frame.final_prompt);
  const [editedVideoUrl, setEditedVideoUrl] = useState(frame.video_url || '');
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [tweak, setTweak] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditedPrompt(frame.final_prompt);
    setEditedVideoUrl(frame.video_url || '');
  }, [frame.final_prompt, frame.video_url]);

  const handleRefine = async () => {
    if (!tweak.trim()) return;
    setIsRefining(true);
    try {
      const result = await refineFrame(frame, tweak, characterAnchor, currentSummary);
      onUpdate({ ...frame, final_prompt: result.final_prompt }, result.summary, true);
      setEditedPrompt(result.final_prompt);
      setTweak('');
      setIsEditing(false);
    } catch (error) {
      console.error('Refinement failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveManual = async () => {
    setIsRefining(true);
    try {
      // Treat the manual edit as a strong tweak to ensure AI integration and character consistency
      const result = await refineFrame(frame, `INTEGRATE THIS MANUAL EDIT: ${editedPrompt}`, characterAnchor, currentSummary);
      onUpdate({ ...frame, final_prompt: result.final_prompt, video_url: editedVideoUrl }, result.summary, true);
      setEditedPrompt(result.final_prompt);
      setIsManualEditing(false);
    } catch (error) {
      console.error('Manual edit refinement failed, saving raw:', error);
      onUpdate({ ...frame, final_prompt: editedPrompt, video_url: editedVideoUrl }, currentSummary, true);
      setIsManualEditing(false);
    } finally {
      setIsRefining(false);
    }
  };

  const handleQuickLink = () => {
    onUpdate({ ...frame, video_url: editedVideoUrl }, currentSummary);
    setIsEditingLinks(false);
  };

  const getDurationInSeconds = (d: string) => parseInt(d) || 0;
  const getTimestampInSeconds = (t: string) => {
    const [m, s] = t.split(':').map(Number);
    return (m * 60) + s;
  };

  const startSec = getTimestampInSeconds(frame.timestamp);
  const durSec = getDurationInSeconds(frame.duration);
  const endSec = startSec + durSec;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(frame.final_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group relative bg-white border ${isReadOnly ? 'border-emerald-200 shadow-emerald-100/50' : 'border-slate-200 hover:border-[#EE5A24]/30'} rounded-[2rem] p-8 transition-all hover:shadow-2xl hover:shadow-slate-200/60`}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Frame Media & Info */}
        <div className="md:w-64 shrink-0 space-y-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group/video shadow-inner">
            {(isEditingLinks ? editedVideoUrl : frame.video_url) ? (
              <div className="relative w-full h-full cursor-pointer group/playback" onClick={() => !isEditingLinks && setIsVideoModalOpen(true)}>
                <img 
                  src={getVideoThumbnail(isEditingLinks ? editedVideoUrl : frame.video_url) || characterAnchor.image_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800'} 
                  className="w-full h-full object-cover group-hover/playback:scale-110 transition-all duration-700"
                  alt="Preview"
                />
                <div className={`absolute inset-0 flex items-center justify-center transition-all ${isEditingLinks ? 'bg-[#11202C]/20' : 'bg-[#11202C]/40 group-hover/playback:bg-[#11202C]/20'}`}>
                  {!isEditingLinks && (
                    <div className="w-12 h-12 rounded-full bg-white text-[#EE5A24] flex items-center justify-center shadow-2xl scale-100 group-hover/playback:scale-110 transition-all">
                      <Play size={20} className="ml-1 fill-[#EE5A24]" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#11202C]/80 backdrop-blur-md rounded text-[7px] font-black text-white uppercase tracking-widest">
                  {isEditingLinks ? 'Previewing...' : 'Preview Ready'}
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <Film size={24} className="opacity-20" />
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">No Video Linked</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Frame {index + 1}
            </div>
            <div className="mb-4">
              <div className="text-2xl font-black text-[#11202C] tracking-tight leading-none mb-1">
                {startSec} - {endSec} <span className="text-xs text-slate-400 font-bold ml-1 uppercase">sec</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <Clock size={10} /> Duration: {frame.duration || '3s'}
              </div>
            </div>
            <div className="inline-block px-3 py-1 bg-[#EE5A24]/5 border border-[#EE5A24]/10 rounded-lg text-[9px] font-black text-[#EE5A24] uppercase tracking-widest">
              {frame.shot_type}
            </div>
          </div>
        </div>

        {/* Prompt Area */}
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Prompt</span>
               <div className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  Character Synced
               </div>
            </div>
            
            {(isReadOnly || isManualEditing) ? (
              <div className="flex items-center gap-2">
                {isManualEditing && (
                  <>
                    <button 
                      onClick={() => setIsManualEditing(false)}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveManual}
                      className="px-4 py-1.5 bg-[#EE5A24] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#EE5A24]/80 transition-all flex items-center gap-2 shadow-lg shadow-[#EE5A24]/10"
                    >
                      <Check size={12} /> Save Changes
                    </button>
                  </>
                )}
                {isReadOnly && (
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-[#11202C] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a2f3f] transition-all shadow-lg shadow-[#11202C]/10 active:scale-[0.98]"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {isManualEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prompt Text</label>
                <textarea
                  autoFocus
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full min-h-[120px] text-slate-600 leading-relaxed text-sm bg-[#FBFBFB] p-5 rounded-2xl border-2 border-[#EE5A24]/30 focus:outline-none focus:border-[#EE5A24] transition-all font-medium resize-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Scene Video Link</label>
                <input
                  type="text"
                  value={editedVideoUrl}
                  onChange={(e) => setEditedVideoUrl(e.target.value)}
                  placeholder="YouTube, Vimeo, or Drive link..."
                  className="w-full bg-[#FBFBFB] px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-[#EE5A24]/30 focus:outline-none text-sm transition-all font-medium"
                />
              </div>
            </div>
          ) : (
            <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 italic font-medium">
              {frame.final_prompt}
            </p>
          )}

          {!isReadOnly && !isManualEditing && (
            <div className="mt-8 border-t border-slate-50 pt-6 space-y-4">
              {isEditing ? (
                <div className="flex gap-3 w-full">
                  <input 
                    type="text" 
                    value={tweak}
                    onChange={(e) => setTweak(e.target.value)}
                    placeholder="Describe a tweak (e.g. 'Add more rain')"
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-[#11202C] focus:outline-none focus:border-[#EE5A24]/50 transition-all font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={isRefining || !tweak.trim()}
                    className="px-6 py-3 bg-[#11202C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#1a2f3f] transition-all disabled:opacity-50 shadow-lg shadow-[#11202C]/10"
                  >
                    {isRefining ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Refine
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-3 text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Primary Actions Row */}
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-[#11202C] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#1a2f3f] transition-all shadow-lg shadow-[#11202C]/10 active:scale-95 group"
                    >
                      <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                      AI Refine
                    </button>

                    <div className="w-px h-4 bg-slate-200" />
                    
                    <button 
                      onClick={() => {
                        setEditedPrompt(frame.final_prompt);
                        setEditedVideoUrl(frame.video_url || '');
                        setIsManualEditing(true);
                      }}
                      className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-[#EE5A24] transition-all uppercase tracking-widest"
                    >
                      <Copy size={14} />
                      Manual Edit
                    </button>

                    <div className="w-px h-4 bg-slate-200" />

                    {!isEditingLinks && (
                      <button 
                        onClick={() => setIsEditingLinks(true)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-[#EE5A24] transition-all uppercase tracking-widest"
                      >
                        <Film size={14} />
                        { frame.video_url ? 'Update Link' : 'Add Link' }
                      </button>
                    )}
                  </div>

                  {/* Expanded Link Row - only visible when editing */}
                  {isEditingLinks && (
                    <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                      <div className="h-px w-8 bg-slate-100" />
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-grow flex items-center gap-2 bg-slate-50 border border-[#EE5A24]/20 rounded-xl px-4 py-2 shadow-inner">
                          <Film size={12} className="text-[#EE5A24]/50" />
                          <input 
                            type="text"
                            value={editedVideoUrl}
                            onChange={(e) => setEditedVideoUrl(e.target.value)}
                            placeholder="Paste scene video link..."
                            className="bg-transparent border-none text-[10px] w-full focus:outline-none font-medium"
                            autoFocus
                          />
                        </div>
                        <button onClick={handleQuickLink} className="bg-[#11202C] text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Save</button>
                        <button onClick={() => setIsEditingLinks(false)} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 ml-1">✕</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {frame.video_url && (
        <VideoPlayerModal 
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          videoUrl={frame.video_url}
          title={`Scene ${index + 1} Preview`}
        />
      )}
    </div>
  );
};
