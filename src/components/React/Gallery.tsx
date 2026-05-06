import React, { useState, useMemo, useEffect } from 'react';
import { PromptCard } from './PromptCard';
import { SearchBar } from './SearchBar';
import { UploadModal } from './UploadModal';
import { AnimatePresence, motion } from 'framer-motion';
import { FilterModal } from './FilterModal';
import { X } from 'lucide-react';

interface Prompt {
  id: string;
  prompt_text: string;
  image_url: string;
  category: string;
  tags?: string[];
  created_at: string;
}

interface GalleryProps {
  initialPrompts: Prompt[];
}

export const Gallery: React.FC<GalleryProps> = ({ initialPrompts }) => {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Sync with initialPrompts if they change (server-side update)
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

  useEffect(() => {
    const btn = document.getElementById('upload-btn');
    if (btn) {
      const handler = () => setIsUploadModalOpen(true);
      btn.addEventListener('click', handler);
      return () => btn.removeEventListener('click', handler);
    }
  }, []);

  return (
    <div className="flex-1">
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
            >
              The World's Finest <br />
              <span className="text-gradient">AI Prompt Library</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto"
            >
              Unleash your creativity with curated high-quality prompts. <br className="hidden md:block" />
              Join the community and build your bucket of inspiration.
            </motion.p>
          </div>

          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onFilterClick={() => setIsFilterModalOpen(true)}
          />

          <FilterModal 
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          <div className="mt-12 mb-20">
            {selectedCategory !== 'All' && (
               <div className="flex items-center justify-center gap-2">
                 <span className="text-xs font-bold uppercase tracking-widest text-white/40">Showing:</span>
                 <span className="bg-brand-primary/20 text-brand-primary text-xs font-bold px-3 py-1 rounded-full border border-brand-primary/20 uppercase tracking-widest">
                   {selectedCategory}
                 </span>
                 <button 
                  onClick={() => setSelectedCategory('All')}
                  className="text-white/20 hover:text-white transition-colors ml-2"
                 >
                   <X size={14} />
                 </button>
               </div>
            )}
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedPrompts.map(prompt => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </AnimatePresence>
          </div>

          {filteredAndSortedPrompts.length === 0 && (
            <div className="py-40 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">No prompts found</h3>
              <p className="text-white/40">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </section>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};
