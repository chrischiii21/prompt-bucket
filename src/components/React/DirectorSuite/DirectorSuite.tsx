import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, CheckCircle, ArrowRight, Play, Copy, RefreshCw, Layout as LayoutIcon } from 'lucide-react';
import * as aiScripter from '../../../lib/aiScripter';
import type { ProjectData, Frame } from '../../../lib/aiScripter';
import { Timeline } from './Timeline';
import { ScripterForm } from './ScripterForm';
import { supabase } from '../../../lib/supabaseClient';

export const DirectorSuite: React.FC = () => {
  const [step, setStep] = useState<'form' | 'refining' | 'approved'>('form');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefiningCharacter, setIsRefiningCharacter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleGenerate = async (concept: string, duration: number) => {
    setIsGenerating(true);
    try {
      const data = await aiScripter.generateVision(concept, duration);
      setProjectData(data);
      setStep('refining');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateFrame = (index: number, updatedFrame: Frame) => {
    if (!projectData) return;
    const newFrames = [...projectData.frames];
    newFrames[index] = updatedFrame;
    setProjectData({ ...projectData, frames: newFrames });
  };

  const handleApprove = async () => {
    if (!projectData) return;
    setIsSaving(true);
    setError(null);
    try {
      // 1. Save to projects table
      const { data: projectDataRes, error: dbError } = await supabase
        .from('projects')
        .insert([{
          project_name: projectData.project_name,
          total_duration: projectData.total_duration,
          status: 'Approved',
          character_anchor: projectData.character_anchor,
          frames: projectData.frames
        }])
        .select();

      if (dbError) throw dbError;
      const newProjectId = projectDataRes?.[0]?.id;
      setProjectId(newProjectId);

      // 2. Cross-post to prompt library (prompts table)
      const combinedPrompt = `Concept: ${projectData.project_name}\n\nCharacter Anchor: ${projectData.character_anchor.description}\n\nFrames: ${projectData.frames.length} scenes, ${projectData.total_duration}`;
      
      const { error: promptError } = await supabase
        .from('prompts')
        .insert([{
          prompt_text: combinedPrompt,
          category: 'Video',
          tags: ['Video', 'Production Bible', projectData.total_duration],
          image_url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800', // Video placeholder
          character_anchor: projectData.character_anchor,
          frames: projectData.frames
        }]);

      if (promptError) console.error('Failed to post to library:', promptError);

      setProjectData({ ...projectData, status: 'Approved' });
      setStep('approved');
    } catch (err: any) {
      console.error('Approval failed:', err);
      setError(err.message || 'Failed to save to Supabase. Make sure the "projects" table exists with correct permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVideoLink = async () => {
    if (!projectId || !videoUrl.trim()) return;
    setIsSavingUrl(true);
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ video_url: videoUrl })
        .eq('id', projectId);

      if (updateError) throw updateError;
      alert('Video link saved successfully!');
    } catch (err: any) {
      console.error('Save link failed:', err);
      setError('Failed to save video link.');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleRefineCharacter = async (tweak: string) => {
    if (!projectData || !tweak.trim()) return;
    setIsRefiningCharacter(true);
    setError(null);
    try {
      // 1. Refine the character anchor itself
      const newAnchor = await aiScripter.refineCharacter(projectData.character_anchor, tweak);
      
      // 2. Propagate changes to all frames
      // To keep it efficient and consistent, we'll ask the AI to re-verify each frame's prompt 
      // with the new anchor description.
      const updatedFrames = await Promise.all(
        projectData.frames.map(async (frame) => {
          const newPrompt = await aiScripter.refineFrame(
            frame, 
            `Synchronize this scene with the new character details: ${newAnchor.description}`, 
            newAnchor
          );
          return { ...frame, final_prompt: newPrompt };
        })
      );

      setProjectData({
        ...projectData,
        character_anchor: newAnchor,
        frames: updatedFrames
      });
    } catch (err: any) {
      console.error('Character refinement failed:', err);
      setError(err.message || 'Failed to refine character.');
    } finally {
      setIsRefiningCharacter(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 p-4 md:p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-3"
          >
            <span className="font-bold">Error:</span> {error}
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-800">✕</button>
          </motion.div>
        )}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative">
          <div className="flex items-center gap-4">
             <a href="/" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all">
                <ArrowRight className="rotate-180" size={18} />
             </a>
             <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-black tracking-tight text-slate-900"
                >
                  Director's <span className="text-indigo-600 italic font-light">Suite</span>
                </motion.h1>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-0.5 w-8 bg-indigo-600"></div>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">AI Video Production Bible</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-3">
            {step !== 'form' && (
              <button 
                onClick={() => setStep('form')}
                className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-sm"
              >
                <RefreshCw size={14} /> New Project
              </button>
            )}
            {step === 'refining' && (
              <button 
                onClick={handleApprove}
                disabled={isSaving}
                className="px-6 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Approve & Save Vision
              </button>
            )}
            {step === 'approved' && (
              <div className="px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <CheckCircle size={16} /> Vision Approved
              </div>
            )}
          </div>
        </header>

        {/* Main Workflow */}
        <main>
          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <ScripterForm onGenerate={handleGenerate} isGenerating={isGenerating} />
              </motion.div>
            )}

            {(step === 'refining' || step === 'approved') && projectData && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-4 gap-12"
              >
                {/* Character Anchor Sidebar */}
                <aside className="lg:col-span-1">
                  <div className="sticky top-8 bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
                    
                    <div className="flex items-center gap-2 mb-6">
                       <div className="h-px w-6 bg-indigo-600"></div>
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Character Anchor</span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">The Protagonist</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 italic font-medium">
                      "{projectData.character_anchor.description}"
                    </p>

                    {projectData.status === 'Draft' && (
                      <div className="space-y-3 mb-8">
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="Tweak character (e.g. 'add red glasses')"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-xs text-slate-900 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRefineCharacter(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <button 
                            disabled={isRefiningCharacter}
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              handleRefineCharacter(input.value);
                              input.value = '';
                            }}
                            className="absolute right-2 top-2 p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            {isRefiningCharacter ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          </button>
                        </div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center">Propagates to all frames</p>
                      </div>
                    )}
                    
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                      <div className="text-[9px] text-slate-400 uppercase font-black mb-3 tracking-widest">Seed Prompt</div>
                      <div className="text-[11px] text-slate-600 font-mono break-words leading-relaxed">
                        {projectData.character_anchor.seed_prompt}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                      <CheckCircle size={14} /> Character Synced
                    </div>

                    {step === 'approved' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 pt-8 border-t border-slate-100"
                      >
                        <div className="flex items-center gap-2 mb-4">
                           <div className="h-px w-6 bg-slate-400"></div>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Final Video Link</span>
                        </div>
                        <div className="space-y-3">
                          <input 
                            type="url"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="Paste video URL (YouTube, Vimeo, etc.)"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                          />
                          <button 
                            onClick={handleSaveVideoLink}
                            disabled={isSavingUrl || !videoUrl.trim()}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                          >
                            {isSavingUrl ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Link
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </aside>

                {/* Timeline Main View */}
                <div className="lg:col-span-3">
                  <Timeline 
                    frames={projectData.frames} 
                    characterAnchor={projectData.character_anchor}
                    status={projectData.status}
                    onUpdateFrame={handleUpdateFrame}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>
    </div>
  );
};
