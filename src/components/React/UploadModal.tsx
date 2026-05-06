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
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold">Add New Prompt</h2>
                  <p className="text-white/40 text-sm">Share your masterpiece with the community.</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Image Upload Area */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center relative group"
                  >
                    {preview ? (
                      <>
                        <img src={preview} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-white/20">
                          <ImageIcon size={32} />
                        </div>
                        <p className="text-sm font-medium text-white/60">Drop your image here or <span className="text-brand-primary">browse</span></p>
                        <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest">JPG, PNG, WebP up to 10MB</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">The Prompt</label>
                      <textarea
                        required
                        placeholder="Paste your AI prompt here..."
                        rows={4}
                        value={formData.prompt_text}
                        onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Category</label>
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
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all appearance-none"
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
                            className="w-full bg-white/5 border border-brand-primary/50 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-white/40 block mb-2">Tags (comma separated)</label>
                      <input
                        type="text"
                        placeholder="v6, cinematic, volumetric..."
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    disabled={loading || !file || !formData.prompt_text}
                    className="btn-primary w-full md:w-auto min-w-[200px] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span>Add to Bucket</span>
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
  );
};
