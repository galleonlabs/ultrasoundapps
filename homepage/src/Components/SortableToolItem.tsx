import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToolItem from './ToolItem';

interface Tool {
  id: string;
  name: string;
  logo: string;
  affiliateLink?: string;
  website: string;
  upvotes?: number;
  category?: string;
}

interface SortableToolItemProps {
  tool: Tool;
  isFavorited?: boolean;
  toggleVisibility: (id: string) => void;
  isVisible: boolean;
  handleToolClick: (name: string) => void;
  handleFavorite?: (id: string) => void;
  index: number;
}

export const SortableToolItem: React.FC<SortableToolItemProps> = ({
  tool,
  isFavorited,
  toggleVisibility,
  isVisible,
  handleToolClick,
  handleFavorite,
  index
}) => {
  // Use the useSortable hook to make this component draggable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: tool.id });

  // Generate CSS from transform and transition values
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1, // Make the original item semi-transparent while dragging
    zIndex: isDragging ? 0 : 1
  };

  // Add animation delay for initial appearance based on index
  const animationDelay = `${index * 0.03}s`;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      className={`tool-appear ${isDragging ? 'z-0' : 'z-10'}`}
      data-tool-id={tool.id}
    >
      {/* Wrap ToolItem to add drag handle functionality */}
      <div 
        className={`relative group cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ animationDelay }}
        {...listeners}
      >
        {/* Add a visual drag indicator */}
        <div className="absolute left-0 top-0 w-full h-full opacity-0 group-hover:opacity-100 pointer-events-none flex items-center justify-center">
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-800/50 text-gray-300 flex items-center justify-center text-xs">
            ⠿
          </div>
        </div>
        
        <ToolItem
          tool={tool}
          toggleVisibility={toggleVisibility}
          isVisible={isVisible}
          handleToolClick={handleToolClick}
          handleFavorite={handleFavorite}
          isFavorited={isFavorited}
        />
      </div>
    </div>
  );
};

export default SortableToolItem;