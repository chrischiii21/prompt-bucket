import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = ['Realistic', '3D Render', 'Vector', 'Minimalist', 'Cyberpunk', 'Anime', 'Oil Painting'];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    prompt_text: '',
    category: 'Realistic',
    tags: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.prompt_text) return;

    setLoading(true);
    try {
      // 1. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('prompt-images')
        .upload(fileName, file);

      if (storageError) throw storageError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prompt-images')
        .getPublicUrl(fileName);

      // 3. Insert into database
      const { error: dbError } = await supabase.from('prompts').insert([
        {
          prompt_text: formData.prompt_text,
          image_url: publicUrl,
          category: formData.category,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        },
      ]);

      if (dbError) throw dbError;

      onSuccess();
      onClose();
      // Reset form
      setFile(null);
      setPreview(null);
      setFormData({ prompt_text: '', category: 'Realistic', tags: '' });
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col md:flex-row min-h-[500px]">
              {/* Close button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 z-50"
              >
                <X size={20} />
              </button>

              {/* Left Side: Upload Area */}
              <div className="w-full md:w-5/12 bg-slate-50 p-8 border-r border-slate-100 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Add New Prompt</h2>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Share your masterpiece</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 min-h-[300px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-6 transition-all cursor-pointer overflow-hidden relative group ${
                    preview ? 'border-slate-100' : 'border-slate-200 hover:border-brand-primary/40 hover:bg-white'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {preview ? (
                    <>
                      <img src={preview} className="absolute inset-0 w-full h-full object-contain bg-slate-50" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-900 mb-1">Drop image here</p>
                      <p className="text-[10px] text-slate-400">or click to browse</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Form Area */}
              <div className="flex-1 p-8 md:p-12 bg-white relative">
                <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">The Prompt</label>
                      <textarea
                        required
                        placeholder="Paste your AI prompt here..."
                        rows={4}
                        value={formData.prompt_text}
                        onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                        className="w-full h-32 p-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-brand-primary/50 transition-all outline-none text-sm text-slate-900 resize-none placeholder:text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Category</label>
                      <div className="space-y-3">
                        <select
                          value={CATEGORIES.includes(formData.category) ? formData.category : 'Other'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== 'Other') {
                              setFormData({ ...formData, category: val });
                            } else {
                              setFormData({ ...formData, category: '' });
                            }
                          }}
                          className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-brand-primary/50 transition-all outline-none text-sm text-slate-900 appearance-none"
                        >
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          <option value="Other">Other (Type custom...)</option>
                        </select>
                        
                        {(!CATEGORIES.includes(formData.category) || formData.category === '') && (
                          <motion.input
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            type="text"
                            placeholder="Type your custom category..."
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full h-12 px-4 rounded-2xl bg-white border border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/10 transition-all outline-none text-sm text-slate-900"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tags (comma separated)</label>
                      <input
                        type="text"
                        placeholder="v6, cinematic, volumetric..."
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-brand-primary/50 transition-all outline-none text-sm text-slate-900 placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-8 flex justify-end">
                    <button 
                      disabled={loading || !file || !formData.prompt_text}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2.5"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <span>Add to Bucket</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
