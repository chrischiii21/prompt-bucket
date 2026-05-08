import React from 'react';
import { motion } from 'framer-motion';
import { FrameCard } from './FrameCard';
import type { Frame, CharacterAnchor } from '../../../lib/aiScripter';

interface TimelineProps {
  frames: Frame[];
  characterAnchor: CharacterAnchor;
  currentSummary: string;
  status: 'Draft' | 'Approved';
  onUpdateFrame: (index: number, updatedFrame: Frame, updatedSummary: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ frames, characterAnchor, currentSummary, status, onUpdateFrame }) => {
  return (
    <div className="relative pl-10 md:pl-16">
      {/* The Timeline Rail */}
      <div className="absolute left-0 top-0 bottom-8 w-1 bg-slate-100 rounded-full" />
      <div className="absolute left-0 top-0 bottom-8 w-1 bg-[#EE5A24] rounded-full shadow-[0_0_10px_rgba(251,131,4,0.2)]" />
      
      <div className="space-y-16">
        {frames.map((frame, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline Node */}
            <div className="absolute -left-[45px] md:-left-[69px] top-8 w-4 h-4 rounded-full bg-white border-4 border-[#11202C] z-10 shadow-lg shadow-[#11202C]/10" />

            <FrameCard 
              frame={frame} 
              index={index}
              characterAnchor={characterAnchor}
              currentSummary={currentSummary}
              isReadOnly={status === 'Approved'}
              onUpdate={(updatedFrame, updatedSummary) => onUpdateFrame(index, updatedFrame, updatedSummary)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
