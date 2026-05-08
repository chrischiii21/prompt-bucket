import React from 'react';
import { X, Calendar, SortAsc, SortDesc, Tag, Layers, Plus, Clapperboard, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContentType: 'all' | 'image' | 'video';
  currentCategory: string;
  currentSortBy: 'newest' | 'oldest';
  categories: string[];
  onApply: (filters: { contentType: 'all' | 'image' | 'video', category: string, sortBy: 'newest' | 'oldest' }) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  currentContentType,
  currentCategory,
  currentSortBy,
  categories,
  onApply,
}) => {
  const [localContentType, setLocalContentType] = React.useState(currentContentType);
  const [localCategory, setLocalCategory] = React.useState(currentCategory);
  const [localSortBy, setLocalSortBy] = React.useState(currentSortBy);

  // Sync local state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalContentType(currentContentType);
      setLocalCategory(currentCategory);
      setLocalSortBy(currentSortBy);
    }
  }, [isOpen, currentContentType, currentCategory, currentSortBy]);

  const handleApply = () => {
    onApply({
      contentType: localContentType,
      category: localCategory,
      sortBy: localSortBy,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#11202C] text-white flex items-center justify-center shadow-lg shadow-[#11202C]/10">
                    <Film size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#11202C] tracking-tight">Refine Results</h2>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-black">Customize your view</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-10">
                {/* Media Format */}
                <div>
                  <div className="flex items-center gap-2 mb-5 text-[#11202C]">
                    <Layers size={14} className="text-[#FB8304]" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">Library Format</label>
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <button
                      onClick={() => setLocalContentType('all')}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        localContentType === 'all' ? 'bg-[#11202C] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => { setLocalContentType('image'); setLocalCategory('All'); }}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        localContentType === 'image' ? 'bg-[#11202C] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Plus size={12} /> Image
                    </button>
                    <button
                      onClick={() => { setLocalContentType('video'); setLocalCategory('All'); }}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        localContentType === 'video' ? 'bg-[#11202C] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Clapperboard size={12} /> Video
                    </button>
                  </div>
                </div>

                {/* Styles - Only for Images/All */}
                {localContentType !== 'video' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-2 mb-5 text-[#11202C]">
                      <Tag size={14} className="text-[#FB8304]" />
                      <label className="text-[10px] font-black uppercase tracking-[0.2em]">Style Collections</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setLocalCategory('All')}
                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                          localCategory === 'All' 
                            ? 'bg-[#11202C] border-[#11202C] text-white shadow-lg' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-[#11202C] hover:bg-slate-100'
                        }`}
                      >
                        All Styles
                      </button>
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setLocalCategory(category)}
                          className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                            localCategory === category 
                              ? 'bg-gradient-to-r from-[#FB8304] to-[#E22A1D] border-[#E22A1D]/10 text-white shadow-lg shadow-[#E22A1D]/10' 
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-[#11202C] hover:bg-slate-100'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Sort Order */}
                <div>
                  <div className="flex items-center gap-2 mb-5 text-[#11202C]">
                    <Calendar size={14} className="text-[#FB8304]" />
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">Publish Order</label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setLocalSortBy('newest')}
                      className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        localSortBy === 'newest'
                          ? 'bg-[#11202C] border-[#11202C] text-white shadow-xl shadow-[#11202C]/10'
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-[#11202C] hover:bg-slate-100'
                      }`}
                    >
                      <SortDesc size={18} />
                      <span className="font-black text-[10px] uppercase tracking-widest">Newest First</span>
                    </button>
                    <button
                      onClick={() => setLocalSortBy('oldest')}
                      className={`flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                        localSortBy === 'oldest'
                          ? 'bg-[#11202C] border-[#11202C] text-white shadow-xl shadow-[#11202C]/10'
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-[#11202C] hover:bg-slate-100'
                      }`}
                    >
                      <SortAsc size={18} />
                      <span className="font-black text-[10px] uppercase tracking-widest">Oldest First</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={handleApply}
                  className="w-full py-5 bg-gradient-to-r from-[#FB8304] to-[#E22A1D] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-[#E22A1D]/20 hover:opacity-90 transition-all active:scale-[0.98]"
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
