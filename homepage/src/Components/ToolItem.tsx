import React from 'react';
import { XCircleIcon, CheckCircleIcon, StarIcon } from '@heroicons/react/20/solid';
import { classNames } from '../utils/index.tsx';

interface ToolItemProps {
  tool: {
    id: string;
    name: string;
    logo: string;
    affiliateLink?: string;
    website: string;
    upvotes?: number;
  };
  isFavorited?: boolean;
  toggleVisibility: (id: string) => void;
  isVisible: boolean;
  handleToolClick: (name: string) => void;
  handleFavorite?: (id: string) => void;
}

const ToolItem: React.FC<ToolItemProps> = ({ tool, toggleVisibility, isVisible, handleToolClick, handleFavorite, isFavorited = false }) => {
  const { id, name, logo, affiliateLink, website, upvotes } = tool;
  
  return (
    <div className="relative flex items-center space-x-3 rounded-sm bg-gradient-to-r from-theme-layer-lighter to-theme-layer-lightest px-2 py-2 group hover:shadow-[1px_1px_0px_#ffffff] border border-theme-layer-lightest transition-all duration-200 hover:scale-[1.01]">
      <div className="flex-shrink-0">
        {logo ? (
          <img 
            className="h-9 w-9 border border-theme-layer-lightest grayscale-[20%] overflow-hidden rounded-sm group-hover:grayscale-0 transition-all" 
            src={logo} 
            alt={name}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              // Create colored placeholder based on tool name (consistent color for same name)
              const colors = ['#5973fe', '#3fb68b', '#ff5353', '#ffb648', '#DC7F5A', '#0072B5'];
              const colorIndex = name.charCodeAt(0) % colors.length;
              const placeholderEl = document.createElement('div');
              placeholderEl.className = 'h-9 w-9 flex items-center justify-center text-white font-bold rounded-sm';
              placeholderEl.style.backgroundColor = colors[colorIndex];
              placeholderEl.textContent = name.charAt(0).toUpperCase();
              target.parentNode?.replaceChild(placeholderEl, target);
            }}
          />
        ) : (
          <div 
            className="h-9 w-9 flex items-center justify-center text-white font-bold rounded-sm border border-theme-layer-lightest"
            style={{
              backgroundColor: ['#5973fe', '#3fb68b', '#ff5353', '#ffb648', '#DC7F5A', '#0072B5'][name.charCodeAt(0) % 6]
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <a 
          href={affiliateLink || website} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="focus:outline-none block" 
          onClick={() => handleToolClick(name)}
        >
          <p className="text-sm font-medium text-theme-text-base group-hover:text-white">{name}</p>
        </a>
      </div>
      <div className="flex items-center">
        <div 
          className={`mr-2 flex items-center text-xs ${isFavorited ? 'text-theme-yellow' : 'text-theme-text-dark'} cursor-pointer hover:text-theme-yellow`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (handleFavorite) handleFavorite(id);
          }}
          title={isFavorited ? "Remove favorite" : "Favorite this tool"}
        >
          <StarIcon className={`w-4 h-4 mr-0.5 ${isFavorited ? 'text-theme-yellow' : 'text-theme-text-dark'}`} />
          <span>{upvotes || 0}</span>
        </div>
        {isVisible ? (
          <XCircleIcon
            onClick={() => toggleVisibility(id)}
            className={classNames('group flex w-5 h-5 border-0 hover:text-gray-300 hover:cursor-pointer items-center justify-center text-theme-layer-base bg-theme-layer-lightest rounded-sm')}
          />
        ) : (
          <CheckCircleIcon
            onClick={() => toggleVisibility(id)}
            className={classNames('group flex w-5 h-5 border-0 hover:text-gray-300 hover:cursor-pointer items-center justify-center text-theme-layer-base bg-theme-layer-lightest rounded-sm')}
          />
        )}
      </div>
    </div>
  );
};

export default ToolItem;
