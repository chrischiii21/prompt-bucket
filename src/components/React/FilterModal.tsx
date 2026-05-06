import React from 'react';
import { X, Calendar, SortAsc, SortDesc, Tag, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  sortBy: 'newest' | 'oldest';
  setSortBy: (sort: 'newest' | 'oldest') => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  sortBy,
  setSortBy,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl shadow-black/10"
          >
            <div className="p-8 bg-white">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Refine Results</h2>
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">Filter & Sort</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                {/* Categories */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <Tag size={16} />
                    <label className="text-xs font-bold uppercase tracking-widest">Categories</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                          selectedCategory === category 
                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Order */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-slate-500">
                    <Calendar size={16} />
                    <label className="text-xs font-bold uppercase tracking-widest">Sort By Date</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSortBy('newest')}
                      className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                        sortBy === 'newest'
                          ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <SortDesc size={18} />
                      <span className="font-medium text-sm">Newest First</span>
                    </button>
                    <button
                      onClick={() => setSortBy('oldest')}
                      className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                        sortBy === 'oldest'
                          ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <SortAsc size={18} />
                      <span className="font-medium text-sm">Oldest First</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={onClose}
                  className="btn-primary w-full py-4 rounded-2xl font-bold shadow-xl shadow-black/5"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
