import React, { useState, useMemo, useEffect } from 'react';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import { UploadModal } from './UploadModal';
import { AnimatePresence, motion } from 'framer-motion';
import { FilterModal } from './FilterModal';
import { X, Layers, Plus, Clapperboard } from 'lucide-react';
import { Toast } from './Toast';

interface Prompt {
  id: string;
  prompt_text: string;
  image_url: string;
  category: string;
  tags?: string[];
  created_at: string;
  character_anchor?: any;
  frames?: any[];
  summary?: string;
}

interface GalleryProps {
  initialPrompts: Prompt[];
}

export const Gallery: React.FC<GalleryProps> = ({ initialPrompts }) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [toast, setToast] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ id: Date.now().toString(), message, type });
  };

  const handleDeleteSuccess = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    showToast('Item permanently deleted', 'success');
  };
  const [contentType, setContentType] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    setPrompts(initialPrompts);
  }, [initialPrompts]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(prompts.map(p => p.category)))
      .filter(c => c !== 'Video');
    return uniqueCategories.sort();
  }, [prompts]);

  const filteredAndSortedPrompts = useMemo(() => {
    let result = prompts.filter(prompt => {
      const matchesSearch = 
        prompt.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        prompt.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (contentType === 'all') {
        matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory;
      } else if (contentType === 'image') {
        matchesCategory = (selectedCategory === 'All' && prompt.category !== 'Video') || prompt.category === selectedCategory;
      } else if (contentType === 'video') {
        matchesCategory = prompt.category === 'Video';
      }
      
      const matchesType = 
        contentType === 'all' || 
        (contentType === 'image' && prompt.category !== 'Video') || 
        (contentType === 'video' && prompt.category === 'Video');
      
      return matchesSearch && matchesCategory && matchesType;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [prompts, searchQuery, selectedCategory, sortBy, contentType]);

  const handleApplyFilters = (filters: { contentType: 'all' | 'image' | 'video', category: string, sortBy: 'newest' | 'oldest' }) => {
    setContentType(filters.contentType);
    setSelectedCategory(filters.category);
    setSortBy(filters.sortBy);
  };

  const handleUploadSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-[#FBFBFB] overflow-hidden font-sans">
      {/* Sidebar - Fixed Glassmorphic Design */}
      <aside className="w-80 border-r border-slate-200/60 bg-white/70 backdrop-blur-2xl h-full flex flex-col p-8 overflow-y-auto hidden lg:flex z-30">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#11202C] text-white flex items-center justify-center shadow-xl shadow-[#11202C]/20 rotate-3 group-hover:rotate-0 transition-transform">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#11202C] leading-none">Prompt Bucket</h1>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#FB8304]">Community Library</span>
          </div>
        </motion.div>

        <div className="mb-6">
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onFilterClick={() => setIsFilterModalOpen(true)}
          />
        </div>

        <div className="mb-10">
          <a 
            href="/director"
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#11202C]/5 border border-[#11202C]/10 text-[#11202C] hover:bg-[#11202C]/10 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FB8304] text-white flex items-center justify-center shadow-lg shadow-[#FB8304]/20 group-hover:scale-110 transition-transform">
              <Clapperboard size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest leading-none">Director's Suite</span>
              <span className="text-[9px] font-bold opacity-60 mt-1 text-[#FB8304]">AI Video Blueprint Creator</span>
            </div>
          </a>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
          {/* Library Sections */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Library</div>
            <button
              onClick={() => { setContentType('all'); setSelectedCategory('All'); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                contentType === 'all' && selectedCategory === 'All' ? 'bg-[#11202C] text-white shadow-xl shadow-[#11202C]/20' : 'text-slate-500 hover:bg-slate-100/80 hover:text-[#11202C]'
              }`}
            >
              <span className="flex items-center gap-3"><Layers size={16} /> All Items</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                contentType === 'all' && selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {prompts.length}
              </span>
            </button>
            <button
              onClick={() => { setContentType('image'); setSelectedCategory('All'); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                contentType === 'image' && selectedCategory === 'All' ? 'bg-[#11202C] text-white shadow-xl shadow-[#11202C]/20' : 'text-slate-500 hover:bg-slate-100/80 hover:text-[#11202C]'
              }`}
            >
              <span className="flex items-center gap-3"><Plus size={16} /> Image Prompts</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                contentType === 'image' && selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {prompts.filter(p => p.category !== 'Video').length}
              </span>
            </button>
            <button
              onClick={() => { setContentType('video'); setSelectedCategory('All'); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                contentType === 'video' ? 'bg-[#11202C] text-white shadow-xl shadow-[#11202C]/20' : 'text-slate-500 hover:bg-slate-100/80 hover:text-[#11202C]'
              }`}
            >
              <span className="flex items-center gap-3"><Clapperboard size={16} /> Productions</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                contentType === 'video' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {prompts.filter(p => p.category === 'Video').length}
              </span>
            </button>
          </nav>

          {/* Style Collections - Only relevant for images */}
          {contentType !== 'video' && (
            <nav className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Styles</div>
              {categories.map((category, idx) => {
                const count = prompts.filter(p => p.category === category).length;
                return (
                  <motion.button
                    key={category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => { setContentType('image'); setSelectedCategory(category); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      selectedCategory === category && contentType === 'image'
                        ? 'bg-gradient-to-r from-[#FB8304] to-[#E22A1D] text-white shadow-xl shadow-[#E22A1D]/20' 
                        : 'text-slate-500 hover:bg-slate-100/80 hover:text-[#11202C]'
                    }`}
                  >
                    <span>{category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${selectedCategory === category && contentType === 'image' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {count}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          )}
        </div>

        <div className="mt-auto pt-10">
           <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-[#FB8304] text-white text-[11px] font-black uppercase tracking-widest py-4.5 rounded-2xl hover:bg-[#ff8c00] transition-all shadow-2xl shadow-[#FB8304]/20 flex items-center justify-center gap-2.5 group"
           >
             <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
               <Plus size={14} />
             </div>
             Upload Prompt
           </motion.button>
        </div>
      </aside>

      {/* Main Content Workspace - Independent Scroll */}
      <main className="flex-1 h-full overflow-y-auto p-8 lg:p-16">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-0.5 w-12 bg-gradient-to-r from-[#FB8304] to-[#E22A1D]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Viewing</span>
              </div>
              <h2 className="text-5xl font-black text-[#11202C] tracking-tight mb-2">
                {contentType === 'all' ? 'All Items' : contentType === 'image' ? (selectedCategory === 'All' ? 'Image Prompts' : selectedCategory) : 'Video Productions'} 
                <span className="text-slate-100 italic font-light"> Archive</span>
              </h2>
              <p className="text-slate-400 font-medium">Found {filteredAndSortedPrompts.length} premium entries in your library.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-[#11202C] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 border-b-[#FB8304]/20"
              >
                Sort & Filter
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPrompts.map((prompt, idx) => (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <PromptCard 
                    prompt={prompt} 
                    onDeleted={() => handleDeleteSuccess(prompt.id)}
                    showToast={showToast}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredAndSortedPrompts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-48 text-center"
            >
              <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center mx-auto mb-8 text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900">Zero Results Found</h3>
              <p className="text-slate-400 max-w-xs mx-auto font-medium">We couldn't find any prompts matching "{searchQuery}". Try a broader term or different category.</p>
            </motion.div>
          )}
        </div>
      </main>

      <FilterModal 
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentContentType={contentType}
        currentCategory={selectedCategory}
        currentSortBy={sortBy}
        categories={categories}
        onApply={handleApplyFilters}
      />

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
