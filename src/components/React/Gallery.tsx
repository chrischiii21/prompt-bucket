import React, { useState, useMemo, useEffect } from 'react';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import { UploadModal } from './UploadModal';
import { AnimatePresence, motion } from 'framer-motion';
import { FilterModal } from './FilterModal';
import { X, Layers, Plus, Clapperboard } from 'lucide-react';

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

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface GalleryProps {
  initialPrompts: Prompt[];
}

export const Gallery: React.FC<GalleryProps> = ({ initialPrompts }) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteSuccess = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    showToast('Production permanently deleted from database');
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    setPrompts(initialPrompts);
  }, [initialPrompts]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(prompts.map(p => p.category)));
    return ['All', ...uniqueCategories.sort()];
  }, [prompts]);

  const filteredAndSortedPrompts = useMemo(() => {
    let result = prompts.filter(prompt => {
      const matchesSearch = 
        prompt.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        prompt.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [prompts, searchQuery, selectedCategory, sortBy]);

  const handleUploadSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-[#fafafa] overflow-hidden">
      {/* Sidebar - Fixed Glassmorphic Design */}
      <aside className="w-80 border-r border-slate-200/60 bg-white/70 backdrop-blur-2xl h-full flex flex-col p-8 overflow-y-auto hidden lg:flex z-30">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-12"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/20 rotate-3 group-hover:rotate-0 transition-transform">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Prompt Bucket</h1>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Community Library</span>
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
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <Clapperboard size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest leading-none">Director's Suite</span>
              <span className="text-[9px] font-bold opacity-60 mt-1">AI Video Blueprint Creator</span>
            </div>
          </a>
        </div>

        <nav className="flex-1 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-5 px-2">Collections</div>
          {categories.map((category, idx) => {
            const count = prompts.filter(p => p.category === category || (category === 'All')).length;
            return (
              <motion.button
                key={category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedCategory(category)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                  selectedCategory === category 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' 
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <span>{category}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${selectedCategory === category ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </nav>

        <div className="mt-auto pt-10">
           <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest py-4.5 rounded-2xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-2.5 group"
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
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-0.5 w-12 bg-slate-900"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Viewing</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-2">
                {selectedCategory} <span className="text-slate-200 italic font-light">Archive</span>
              </h2>
              <p className="text-slate-400 font-medium">Found {filteredAndSortedPrompts.length} premium prompts matching your criteria.</p>
            </div>
            
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
              Sort & Filter
            </button>
          </header>

          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-7 space-y-7">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPrompts.map((prompt, idx) => (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="break-inside-avoid"
                >
                  <PromptCard 
                    prompt={prompt} 
                    onDeleted={() => handleDeleteSuccess(prompt.id)}
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
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess}
      />

      {/* Gallery Toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[500]"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border ${
              toast.type === 'success' 
                ? 'bg-emerald-500/90 text-white border-emerald-400' 
                : 'bg-red-500/90 text-white border-red-400'
            } flex items-center gap-3 min-w-[280px]`}>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                {toast.type === 'success' ? <Clapperboard size={18} /> : <X size={18} />}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Library Activity</p>
                <p className="text-sm font-bold">{toast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
