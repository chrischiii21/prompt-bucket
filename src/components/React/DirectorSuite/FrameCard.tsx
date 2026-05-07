import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCw, Check, Sparkles, Film, Clock } from 'lucide-react';
import { refineFrame, type Frame, type CharacterAnchor } from '../../../lib/aiScripter';

interface FrameCardProps {
  frame: Frame;
  index: number;
  characterAnchor: CharacterAnchor;
  currentSummary: string;
  isReadOnly: boolean;
  onUpdate: (updatedFrame: Frame, updatedSummary: string) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ frame, index, characterAnchor, currentSummary, isReadOnly, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tweak, setTweak] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRefine = async () => {
    if (!tweak.trim()) return;
    setIsRefining(true);
    try {
      const result = await refineFrame(frame, tweak, characterAnchor, currentSummary);
      onUpdate({ ...frame, final_prompt: result.final_prompt }, result.summary);
      setTweak('');
      setIsEditing(false);
    } catch (error) {
      console.error('Refinement failed:', error);
    } finally {
      setIsRefining(false);
    }
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
    <div className={`group relative bg-white border ${isReadOnly ? 'border-emerald-200 shadow-emerald-100/50' : 'border-slate-200 hover:border-indigo-200'} rounded-[2rem] p-8 transition-all hover:shadow-2xl hover:shadow-slate-200/60`}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Frame Info */}
        <div className="md:w-52 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            <Film size={16} className="text-indigo-600" /> Frame {index + 1}
          </div>
          <div className="mb-4">
            <div className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              {startSec} - {endSec} <span className="text-xs text-slate-400 font-bold ml-1 uppercase">sec</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <Clock size={10} /> Duration: {frame.duration || '3s'}
            </div>
          </div>
          <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest">
            {frame.shot_type}
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
            
            {isReadOnly && (
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>

          <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100 italic font-medium">
            {frame.final_prompt}
          </p>

          {!isReadOnly && (
            <div className="mt-6">
              {isEditing ? (
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    value={tweak}
                    onChange={(e) => setTweak(e.target.value)}
                    placeholder="Describe a tweak (e.g. 'Add more rain', 'Make it cinematic')"
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                  />
                  <button 
                    onClick={handleRefine}
                    disabled={isRefining || !tweak.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
                  >
                    {isRefining ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Refine
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-3 text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest"
                >
                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                  Regenerate with specific tweak
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
