import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterClick?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, setSearchQuery, onFilterClick }) => {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/40">
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder="Search prompts by keywords, categories, or styles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-14 pl-14 pr-16 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 transition-all duration-300"
      />
      <div className="absolute inset-y-0 right-4 flex items-center">
        <button 
          onClick={onFilterClick}
          className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5" 
          title="Filter results"
        >
          <Filter size={20} />
        </button>
      </div>
    </div>
  );
};
