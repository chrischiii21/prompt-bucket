import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Clapperboard, ArrowRight } from 'lucide-react';

interface ScripterFormProps {
  onGenerate: (concept: string, duration: number) => void;
  isGenerating: boolean;
}

export const ScripterForm: React.FC<ScripterFormProps> = ({ onGenerate, isGenerating }) => {
  const [concept, setConcept] = useState('');
  const [duration, setDuration] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (concept.trim()) {
      onGenerate(concept, duration);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-2xl shadow-slate-200/50">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        
        <div className="flex justify-center mb-10">
          <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-xl shadow-indigo-100/50 rotate-3 group-hover:rotate-0 transition-transform">
            <Clapperboard size={36} />
          </div>
        </div>

        <h2 className="text-4xl font-black text-center mb-3 text-slate-900 tracking-tight">Phase 1: The AI Scripter</h2>
        <p className="text-slate-400 text-center mb-12 font-medium">Define your vision and let AI build the production bible.</p>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="relative group">
            <div className="flex items-center gap-2 mb-4 ml-1">
               <div className="h-px w-6 bg-indigo-600"></div>
               <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">The Concept</label>
            </div>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. A Cyber Noir heist where the protagonist discovers a glitch in reality..."
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-lg text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all resize-none h-48 placeholder:text-slate-300 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
               <div className="flex items-center gap-2 mb-4 ml-1">
                  <div className="h-px w-6 bg-slate-400"></div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Duration</label>
               </div>
              <div className="relative">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4.5 pl-14 pr-6 appearance-none focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all text-slate-700 font-bold text-sm cursor-pointer"
                >
                  <option value={15}>15 Seconds (5 Frames)</option>
                  <option value={30}>30 Seconds (10 Frames)</option>
                  <option value={60}>60 Seconds (20 Frames)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={isGenerating || !concept.trim()}
                className="w-full h-[62px] bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:hover:bg-slate-900 group active:scale-[0.98]"
              >
                {isGenerating ? (
                  <Sparkles className="animate-pulse" />
                ) : (
                  <>
                    <span>Generate Production Bible</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-8 text-center max-w-xl mx-auto">
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
