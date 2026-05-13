import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Save, CheckCircle, ArrowRight, Play, Copy, RefreshCw, Layout as LayoutIcon, UserCircle, X, Layers, Clapperboard } from 'lucide-react';
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
  const [originalPromptId, setOriginalPromptId] = useState<string | null>(null);
  const [history, setHistory] = useState<ProjectData[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(-1);
  const [lastApprovedSnapshot, setLastApprovedSnapshot] = useState<ProjectData | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isCascading, setIsCascading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refineId = params.get('refine');
    
    if (refineId) {
      loadProjectForRefinement(refineId);
    }
  }, []);

  const loadProjectForRefinement = async (id: string) => {
    setIsGenerating(true);
    try {
      // Check both tables to ensure compatibility with library IDs
      let { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !project) {
        const { data: promptProject, error: promptError } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (promptError) throw promptError;
        project = promptProject;
      }

      if (project) {
        setOriginalPromptId(id);
        const loadedHistory = project.history || [];
        const loadedData = {
          project_name: project.project_name || project.prompt_text?.split('\n\n')[0].replace('Concept: ', '') || 'Untitled Project',
          summary: project.summary || '',
          total_duration: project.total_duration || '30s',
          character_anchor: project.character_anchor,
          frames: project.frames,
          overall_prompt: project.overall_prompt || project.summary || '',
          id: project.id
        };
        setVideoUrl(project.video_url || '');
        setHistory(loadedHistory);
        // The current DB record IS the last approved snapshot — restore it so re-approval archives correctly
        setLastApprovedSnapshot(loadedData);
        setProjectData(loadedData);
        setCurrentVersionIndex(-1);
        setStep('refining');
        showToast('Project Loaded for Refinement');
      }
    } catch (err: any) {
      console.error('Failed to load project:', err);
      showToast('Could not load project for refinement', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = async (concept: string, duration: number, prodType: string, genre: string, referenceImageUrl?: string, existingCharacter?: any) => {
    setIsGenerating(true);
    try {
      const data = await aiScripter.generateVision(concept, duration, prodType, genre, referenceImageUrl, existingCharacter);
      if (data && data.frames) {
        // Archive the current working draft before replacing it
        if (projectData && step === 'refining') {
          setHistory(prev => [...prev, projectData]);
          setCurrentVersionIndex(-1); // Reset to "Working Draft"
        }
        setProjectData({
          project_name: data.project_name || concept,
          summary: data.summary || '',
          total_duration: duration + 's',
          character_anchor: data.character_anchor || existingCharacter,
          frames: data.frames,
          overall_prompt: data.overall_prompt || data.summary || '',
          status: 'Draft'
        });
        setStep('refining');
        showToast('Production Blueprint Generated');
      } else {
        throw new Error('AI returned an empty blueprint.');
      }
    } catch (error: any) {
      console.error('Generation failed:', error);
      showToast(error.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateFrame = async (index: number, updatedFrame: Frame, updatedSummary: string, shouldCascade: boolean = false) => {
    if (!projectData) return;
    
    const newFrames = [...projectData.frames];
    newFrames[index] = updatedFrame;
    
    // Immediate UI update for the targeted frame
    setProjectData({ ...projectData, frames: newFrames, summary: updatedSummary });

    if (shouldCascade && index < newFrames.length - 1) {
      setIsCascading(true);
      try {
        let runningSummary = updatedSummary;
        let lastFramePrompt = updatedFrame.final_prompt;

        for (let i = index + 1; i < newFrames.length; i++) {
          const result = await aiScripter.refineFrame(
            newFrames[i],
            `STRICT CONSISTENCY: The previous scene was just updated. Adjust this scene to maintain perfect narrative and visual continuity with the new context: "${lastFramePrompt}"`,
            projectData.character_anchor,
            runningSummary
          );
          
          newFrames[i] = { ...newFrames[i], final_prompt: result.final_prompt };
          runningSummary = result.summary;
          lastFramePrompt = result.final_prompt;
          
          // Update UI incrementally so the user sees progress
          setProjectData(prev => prev ? { ...prev, frames: [...newFrames], summary: runningSummary } : null);
        }
        showToast('Cascading Consistency Applied');
      } catch (err: any) {
        console.error('Cascading refinement failed:', err);
        showToast('Consistency cascade failed', 'error');
      } finally {
        setIsCascading(false);
      }
    }
  };

  // workingDraft holds the latest live version so we can restore it after viewing history
  const [workingDraft, setWorkingDraft] = useState<ProjectData | null>(null);

  const handleSwitchVersion = (index: number) => {
    if (index === -1) {
      // Restore the working draft
      if (workingDraft) {
        setProjectData(workingDraft);
      }
      setCurrentVersionIndex(-1);
      return;
    }
    const version = history[index];
    if (version) {
      // Save current working state before time-traveling
      if (currentVersionIndex === -1) {
        setWorkingDraft(projectData);
      }
      setProjectData(version);
      setCurrentVersionIndex(index);
    }
  };

  const handleSave = async () => {
    if (!projectData) return;
    setIsSaving(true);
    try {
      const projectPayload = {
        project_name: projectData.project_name,
        total_duration: projectData.total_duration,
        status: 'Draft',
        character_anchor: projectData.character_anchor,
        frames: projectData.frames,
        summary: projectData.summary,
        overall_prompt: projectData.overall_prompt,
        video_url: videoUrl,
        history: history // Persist the multiverse
      };

      let newProjectId = projectData.id;
      
      if (projectData.id) {
        await supabase.from('projects').update(projectPayload).eq('id', projectData.id);
      } else {
        const { data, error } = await supabase.from('projects').insert(projectPayload).select();
        if (error) throw error;
        newProjectId = data?.[0]?.id;
      }

      // 2. Save to prompts (Library)
      const librarySummary = projectData.summary || 'Production synthesis complete.';
      const promptPayload = {
        prompt_text: `Concept: ${projectData.project_name}\n\nNarrative: ${librarySummary}`,
        summary: librarySummary,
        image_url: projectData.character_anchor?.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
        category: 'Video',
        character_anchor: projectData.character_anchor,
        frames: projectData.frames,
        overall_prompt: projectData.overall_prompt,
        project_id: newProjectId,
        video_url: videoUrl,
        tags: [projectData.project_name.toLowerCase(), 'director-suite', 'blueprint']
      };

      if (originalPromptId) {
        await supabase.from('prompts').update(promptPayload).eq('id', originalPromptId);
      } else {
        await supabase.from('prompts').insert(promptPayload);
      }

      setProjectData({ ...projectData, id: newProjectId, status: 'Draft', video_url: videoUrl });
      setProjectId(newProjectId);
      setToast({ message: 'Vision Saved to Library!', type: 'success' });
    } catch (err: any) {
      console.error('Save failed:', err);
      setToast({ message: err.message || 'Failed to save to database', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!projectData) return;
    setIsSaving(true);
    try {
      let finalProjectId = projectData.id;

      // Build updated history: archive the PREVIOUS approved version before saving the new one
      const updatedHistory = lastApprovedSnapshot
        ? [...history, lastApprovedSnapshot]
        : history;

      // 1. First-time approval — insert new records
      if (!finalProjectId) {
        const projectPayload = {
          project_name: projectData.project_name,
          total_duration: projectData.total_duration,
          status: 'Approved',
          character_anchor: projectData.character_anchor,
          frames: projectData.frames,
          summary: projectData.summary,
          video_url: videoUrl,
          history: updatedHistory
        };
        const { data, error } = await supabase.from('projects').insert(projectPayload).select();
        if (error) throw error;
        finalProjectId = data?.[0]?.id;

        const librarySummary = projectData.summary || 'Production synthesis complete.';
        const { data: promptData } = await supabase.from('prompts').insert({
          prompt_text: `Concept: ${projectData.project_name}\n\nNarrative: ${librarySummary}`,
          summary: librarySummary,
          image_url: projectData.character_anchor?.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
          category: 'Video',
          character_anchor: projectData.character_anchor,
          frames: projectData.frames,
          project_id: finalProjectId,
          video_url: videoUrl,
          history: updatedHistory,
          tags: [projectData.project_name.toLowerCase(), 'director-suite', 'blueprint']
        }).select();
        if (promptData?.[0]?.id) setOriginalPromptId(promptData[0].id);

      } else {
        // 2. Re-approval — update existing records with new data + archived history
        const { error: projError } = await supabase
          .from('projects')
          .update({
            status: 'Approved',
            character_anchor: projectData.character_anchor,
            frames: projectData.frames,
            summary: projectData.summary,
            video_url: videoUrl,
            history: updatedHistory
          })
          .eq('id', finalProjectId);
        if (projError) throw projError;

        // Also keep the library prompt in sync
        if (originalPromptId) {
          const librarySummary = projectData.summary || 'Production synthesis complete.';
          await supabase.from('prompts').update({
            summary: librarySummary,
            prompt_text: `Concept: ${projectData.project_name}\n\nNarrative: ${librarySummary}`,
            character_anchor: projectData.character_anchor,
            frames: projectData.frames,
            video_url: videoUrl,
            history: updatedHistory
          }).eq('id', originalPromptId);
        }
      }

      // Commit the updated history and snapshot this approval as the new baseline
      const approvedData = { ...projectData, id: finalProjectId, status: 'Approved', video_url: videoUrl };
      setHistory(updatedHistory);
      setLastApprovedSnapshot(approvedData);
      setCurrentVersionIndex(-1); // Always show the newest version
      setProjectData(approvedData);
      setProjectId(finalProjectId);
      setStep('approved');
      setToast({ message: 'Production Vision Approved!', type: 'success' });
    } catch (err: any) {
      console.error('Failed to approve:', err);
      setToast({ message: `Failed to approve: ${err.message}`, type: 'error' });
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
      
      // Also sync to prompts table
      if (originalPromptId) {
        await supabase
          .from('prompts')
          .update({ video_url: videoUrl })
          .eq('id', originalPromptId);
      }
      
      showToast('Video URL Synchronized!');
    } catch (err: any) {
      console.error('Save link failed:', err);
      showToast('Failed to save link', 'error');
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
      const result = await aiScripter.refineCharacter(projectData.character_anchor, tweak, projectData.summary);
      const newAnchor = result.character_anchor;
      let runningSummary = result.summary;
      
      // 2. Propagate changes to all frames
      const updatedFrames = await Promise.all(
        projectData.frames.map(async (frame) => {
          const frameResult = await aiScripter.refineFrame(
            frame, 
            `Synchronize this scene with the new character details: ${newAnchor.description}`, 
            newAnchor,
            runningSummary
          );
          runningSummary = frameResult.summary;
          return { ...frame, final_prompt: frameResult.final_prompt };
        })
      );

      setProjectData({
        ...projectData,
        character_anchor: newAnchor,
        summary: runningSummary,
        frames: updatedFrames
      });
      showToast('Character & Frames Re-Synchronized!');
    } catch (err: any) {
      console.error('Character refinement failed:', err);
      showToast(err.message || 'Refinement failed', 'error');
    } finally {
      setIsRefiningCharacter(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#11202C] p-4 md:p-8 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-[#E22A1D] text-sm flex items-center gap-3"
          >
            <span className="font-bold">Error:</span> {error}
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-800">✕</button>
          </motion.div>
        )}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative">
          <div className="flex items-center gap-4">
             <a href="/" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#11202C] hover:border-slate-300 transition-all">
                <ArrowRight className="rotate-180" size={18} />
             </a>
             <div>
                <motion.h1 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl font-black tracking-tight text-[#11202C]"
                >
                  Director's <span className="text-[#EE5A24] italic font-light">Suite</span>
                </motion.h1>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-0.5 w-8 bg-[#EE5A24]"></div>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">AI Video Blueprint Creator</p>
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
                className="px-6 py-3 rounded-2xl bg-[#11202C] text-white hover:bg-[#1a2f3f] transition-all shadow-xl shadow-[#11202C]/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                Approve & Save Vision
              </button>
            )}
            {step === 'approved' && (
              <div className="flex items-center gap-3">
                <div className="px-6 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                  <CheckCircle size={16} /> Vision Approved
                </div>
                <a 
                  href="/"
                  className="px-6 py-3 rounded-2xl bg-[#11202C] text-white hover:bg-[#1a2f3f] transition-all shadow-xl shadow-[#11202C]/10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  <Layers size={14} /> Go to Library
                </a>
                <button 
                  onClick={() => setStep('refining')}
                  className="px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-[#11202C] hover:border-slate-300 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Refine Further
                </button>
              </div>
            )}
            {isCascading && (
              <div className="flex items-center gap-3 px-4 py-2 bg-[#EE5A24]/10 border border-[#EE5A24]/20 rounded-2xl text-[#EE5A24] animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Synchronizing Frames...</span>
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#EE5A24]/5 blur-3xl -mr-16 -mt-16 rounded-full" />
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="h-px w-6 bg-[#EE5A24]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EE5A24]">Character Anchor</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-[#11202C] mb-3 tracking-tight">The Protagonist</h3>

                    {/* Read-only Description */}
                    <div className="mb-5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Description</label>
                      <div className="border-l-2 border-[#EE5A24]/20 pl-4 py-1">
                        <p className="text-[11px] font-bold text-slate-800 leading-relaxed italic">
                          "{projectData.character_anchor?.description || 'Generic Production Style'}"
                        </p>
                      </div>
                    </div>

                    {/* Read-only Seed Prompt */}
                    <div className="mb-6">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Seed Prompt</label>
                      <div className="p-4 bg-[#11202C] rounded-xl border border-slate-800">
                        <p className="text-[10px] text-[#EE5A24]/80 font-mono break-words leading-relaxed">
                          {projectData.character_anchor?.seed_prompt || 'Standard Cinematic Seed'}
                        </p>
                      </div>
                    </div>

                    {/* AI Refine — always available, affects description + seed prompt + all frames */}
                    <div className="space-y-3 mb-6">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">AI Refine</label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="e.g. 'add red glasses', 'futuristic outfit'..."
                          className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 pr-12 text-[11px] text-[#11202C] focus:outline-none focus:border-[#EE5A24] transition-all font-bold"
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
                          className="absolute right-2 top-2 w-8 h-8 bg-[#11202C] text-white rounded-lg hover:bg-[#1a2f3f] transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          {isRefiningCharacter ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] text-center">Updates description, seed prompt & all frames</p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em]">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle size={14} />
                      </div>
                      Character Synced
                    </div>
                  </div>
                </aside>

                {/* Timeline Main View */}
                <div className="lg:col-span-3">
                  {/* Version History Toggle — only visible when refinements exist */}
                  {history.length > 0 && (
                    <div className="flex items-center gap-2 mb-6 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 w-fit">
                      <button 
                        onClick={() => handleSwitchVersion(-1)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          currentVersionIndex === -1 ? 'bg-[#11202C] text-white shadow-lg shadow-[#11202C]/10' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Working Draft
                      </button>
                      {history.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSwitchVersion(idx)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentVersionIndex === idx ? 'bg-[#EE5A24] text-white shadow-lg shadow-[#EE5A24]/20' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          V{idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Story Summary Card */}
                <div className="mb-12 p-10 bg-white rounded-[3rem] border border-slate-100 relative overflow-hidden group shadow-sm">
                  <div className="absolute top-0 right-0 p-10 text-slate-50 group-hover:text-[#EE5A24]/5 transition-colors pointer-events-none">
                    <Sparkles size={140} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-[#EE5A24]"></div>
                        <h3 className="text-[10px] font-black text-[#EE5A24] uppercase tracking-[0.2em]">Director's Narrative Summary</h3>
                      </div>
                    </div>
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = (el.scrollHeight + 5) + 'px';
                        }
                      }}
                      value={projectData.summary}
                      onChange={(e) => {
                        setProjectData({ ...projectData, summary: e.target.value });
                      }}
                      placeholder="Enter the overarching story summary here..."
                      className="w-full bg-transparent text-sm font-bold text-slate-800 leading-relaxed italic pr-24 resize-none focus:outline-none placeholder:text-slate-200 border-none p-0 overflow-hidden min-h-[60px] transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Overall Production Video Link */}
                <div className="mb-12 p-6 bg-[#EE5A24]/5 border border-[#EE5A24]/10 rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-inner">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#EE5A24] text-white flex items-center justify-center shadow-lg shadow-[#EE5A24]/20">
                      <Play size={20} className="fill-white" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-[#EE5A24] uppercase tracking-widest">Production Delivery</h4>
                      <p className="text-[11px] font-bold text-slate-600">Link your final masterpiece here</p>
                    </div>
                  </div>
                  
                  <div className="flex-grow flex gap-3 w-full">
                    <input 
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="YouTube, Vimeo, or Google Drive link..."
                      className="flex-grow bg-white border border-[#EE5A24]/20 rounded-2xl px-6 py-3.5 text-sm text-[#11202C] focus:outline-none focus:border-[#EE5A24] transition-all font-medium placeholder:text-slate-300"
                    />
                    {(projectId || originalPromptId) && (
                      <button 
                        onClick={handleSaveVideoLink}
                        disabled={isSavingUrl || !videoUrl.trim()}
                        className="px-6 py-3.5 bg-[#11202C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-[#1a2f3f] transition-all disabled:opacity-50 shadow-xl shadow-[#11202C]/10"
                      >
                        {isSavingUrl ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Sync
                      </button>
                    )}
                  </div>
                </div>

                <Timeline 
                  frames={projectData.frames} 
                  characterAnchor={projectData.character_anchor || { description: 'Generic Style', seed_prompt: 'Cinematic' }}
                  currentSummary={projectData.summary || ''}
                  status={projectData.status}
                  onUpdateFrame={handleUpdateFrame}
                  videoUrl={videoUrl}
                />
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#EE5A24]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#EE5A24]/10 blur-[120px] rounded-full" />
      </div>

      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#11202C]/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white"
          >
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#EE5A24] to-[#E22A1D] flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-8 animate-bounce">
              <Sparkles size={48} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase tracking-widest">Architecting Vision</h3>
            <p className="text-orange-200 text-xs font-bold uppercase tracking-[0.3em]">Building your production blueprint...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[200]"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/90 text-white border-emerald-400' 
                : 'bg-[#E22A1D]/90 text-white border-red-400'
            } flex items-center gap-3 min-w-[280px]`}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                {toast.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{toast.type}</p>
                <p className="text-sm font-bold">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
