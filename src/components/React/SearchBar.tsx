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
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
        <Search size={20} />
      </div>
      <input
        type="text"
        placeholder="Search prompts by keywords..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full h-14 pl-14 pr-16 rounded-2xl bg-white border border-slate-200 text-[#11202C] placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-[#FB8304]/10 focus:border-[#FB8304]/30 transition-all duration-300 shadow-sm font-medium"
      />
      <div className="absolute inset-y-0 right-4 flex items-center">
        <button 
          onClick={onFilterClick}
          className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-[#11202C] hover:bg-slate-100 transition-all border border-slate-100" 
          title="Filter results"
        >
          <Filter size={20} />
        </button>
      </div>
    </div>
  );
};
