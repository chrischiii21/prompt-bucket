import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, Video, Clapperboard, Layers, Sparkles, Plus, Trash2, Film, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { Toast } from './Toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['Realistic', '3D Render', 'Vector', 'Minimalist', 'Cyberpunk', 'Anime', 'Oil Painting'];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'Image' | 'Video'>('Video');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [frames, setFrames] = useState<string[]>(['']);
  const [toast, setToast] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    prompt_text: '',
    category: 'Realistic',
    tags: '',
    video_url: '',
    character_anchor: '',
    summary: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: Date.now().toString(), message, type });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const addFrame = () => setFrames([...frames, '']);
  const removeFrame = (index: number) => {
    if (frames.length > 1) {
      setFrames(frames.filter((_, i) => i !== index));
    }
  };
  const updateFrame = (index: number, value: string) => {
    const newFrames = [...frames];
    newFrames[index] = value;
    setFrames(newFrames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (type === 'Image') {
      if (!file) return showToast('Please upload an image', 'error');
      if (!formData.prompt_text) return showToast('Please enter the prompt', 'error');
    } else {
      if (!formData.title) return showToast('Please enter a production title', 'error');
      if (frames.some(f => !f.trim())) return showToast('Please fill in all frame prompts', 'error');
    }

    setLoading(true);
    try {
      let publicUrl = '';
      
      // 1. Upload image if exists
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data: storageData, error: storageError } = await supabase.storage
          .from('prompt-images')
          .upload(fileName, file);

        if (storageError) throw storageError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('prompt-images')
          .getPublicUrl(fileName);
        
        publicUrl = url;
      } else if (type === 'Video') {
        publicUrl = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800';
      }

      // 2. Prepare Data
      const finalPromptText = type === 'Video' ? formData.title : formData.prompt_text;
      const category = type === 'Video' ? 'Video' : formData.category;
      
      let character_anchor = null;
      let framesData = null;

      if (type === 'Video') {
        character_anchor = {
          description: 'Imported Identity Anchor',
          seed_prompt: formData.character_anchor || 'Standard Cinematic'
        };
        framesData = frames.map((f, i) => ({
          timestamp: `0:${(i * 3).toString().padStart(2, '0')}`,
          duration: '3s',
          shot_type: 'Standard',
          final_prompt: f
        }));
      }

      // 3. Insert
      const { error: dbError } = await supabase.from('prompts').insert([
        {
          prompt_text: finalPromptText,
          image_url: publicUrl,
          category,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
          video_url: formData.video_url || null,
          character_anchor,
          frames: framesData,
          summary: type === 'Video' ? (formData.summary || `Imported Production: ${formData.title}`) : null
        },
      ]);

      if (dbError) throw dbError;

      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setFrames(['']);
    setFormData({
      title: '',
      prompt_text: '',
      category: 'Realistic',
      tags: '',
      video_url: '',
      character_anchor: '',
      summary: '',
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto md:min-h-[600px]"
            >
              {/* Close button */}
              <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 z-50">
                <X size={20} />
              </button>

              {/* Left Side: Media Upload */}
              <div className="w-full md:w-5/12 bg-[#FBFBFB] p-8 border-r border-slate-100 flex flex-col">
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-[#11202C] text-white flex items-center justify-center shadow-lg shadow-[#11202C]/10">
                      <Plus size={18} />
                    </div>
                    <h2 className="text-xl font-black text-[#011E41] tracking-tight">Add Prompt</h2>
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Share your masterpiece</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 min-h-[180px] md:min-h-0 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-6 transition-all cursor-pointer overflow-hidden relative group ${
                    preview ? 'border-slate-100' : 'border-slate-200 hover:border-[#FF8200] hover:bg-white'
                  }`}
                >
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  {preview ? (
                    <>
                      <img src={preview} className="absolute inset-0 w-full h-full object-contain bg-slate-50" />
                      <div className="absolute inset-0 bg-[#011E41]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-xs font-black text-[#011E41] mb-1">Cover Media</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">or click to browse</p>
                    </div>
                  )}
                </div>

                {type === 'Video' && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-[#FF8200]">
                      <Video size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Video URL</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Link to your creation..."
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      className="w-full bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs text-[#011E41] outline-none focus:border-[#FF8200] transition-all font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Right Side: Dynamic Form */}
              <div className="flex-1 p-8 md:p-12 bg-white flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-10 w-fit border border-slate-100">
                  <button
                    onClick={() => setType('Video')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      type === 'Video' ? 'bg-[#11202C] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Clapperboard size={14} /> Video
                  </button>
                  <button
                    onClick={() => setType('Image')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      type === 'Image' ? 'bg-[#11202C] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <ImageIcon size={14} /> Image
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                      <select
                        value={type === 'Video' ? 'Video' : formData.category}
                        disabled={type === 'Video'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[#FB8304] transition-all outline-none text-sm text-[#11202C] font-black appearance-none disabled:opacity-60"
                      >
                        {type === 'Video' ? <option value="Video">Video Production</option> : CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tags</label>
                      <input
                        type="text"
                        placeholder="v6, cinematic, epic..."
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {type === 'Image' ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">The Prompt</label>
                        <textarea
                          required
                          placeholder="Paste the prompt that generated this image..."
                          value={formData.prompt_text}
                          onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                          className="w-full h-48 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 focus:bg-white transition-all outline-none text-sm text-slate-900 resize-none font-medium leading-relaxed"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Production Title</label>
                        <input
                          required
                          type="text"
                          placeholder="Give your production a name..."
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full h-14 px-5 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white outline-none text-sm text-slate-900 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#2EABDF] uppercase tracking-widest flex items-center gap-2 mb-3">
                          <Quote size={12} /> Narrative Synthesis
                        </label>
                        <textarea
                          placeholder="The overall story or narrative overview..."
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          className="w-full h-24 p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white transition-all outline-none text-sm text-slate-900 resize-none font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#2EABDF] uppercase tracking-widest flex items-center gap-2 mb-3">
                          <Sparkles size={12} /> Character Anchor
                        </label>
                        <textarea
                          placeholder="The stable prompt for character/style consistency..."
                          value={formData.character_anchor}
                          onChange={(e) => setFormData({ ...formData, character_anchor: e.target.value })}
                          className="w-full h-24 p-4 rounded-2xl bg-[#2EABDF]/5 border border-[#2EABDF]/10 focus:bg-white transition-all outline-none text-sm text-slate-900 resize-none font-medium italic"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={14} /> Production Frames
                          </label>
                          <button 
                            type="button" 
                            onClick={addFrame}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#11202C] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#2EABDF] transition-all shadow-lg shadow-slate-200"
                          >
                            <Plus size={12} /> Add Frame
                          </button>
                        </div>
                        
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {frames.map((frame, index) => (
                            <motion.div 
                              key={index} 
                              initial={{ opacity: 0, x: -10 }} 
                              animate={{ opacity: 1, x: 0 }}
                              className="flex gap-3"
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                                {index + 1}
                              </div>
                              <input
                                type="text"
                                placeholder={`Prompt for Frame ${index + 1}...`}
                                value={frame}
                                onChange={(e) => updateFrame(index, e.target.value)}
                                className="flex-1 h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 focus:bg-white outline-none text-xs text-slate-900 font-medium"
                              />
                              <button 
                                type="button"
                                onClick={() => removeFrame(index)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-auto pt-8">
                    <button 
                      disabled={loading}
                      className="w-full h-14 bg-gradient-to-r from-[#FB8304] to-[#E22A1D] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:opacity-90 disabled:opacity-50 transition-all shadow-2xl shadow-[#E22A1D]/20 flex items-center justify-center gap-2.5 active:scale-[0.98]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          {type === 'Video' ? <Film size={18} /> : <ImageIcon size={18} />}
                          <span>{type === 'Video' ? 'Import Production' : 'Add to Bucket'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
};


