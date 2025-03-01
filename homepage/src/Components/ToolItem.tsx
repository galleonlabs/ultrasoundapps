import React, { memo, useCallback } from 'react';
import { XCircleIcon, CheckCircleIcon, StarIcon } from '@heroicons/react/20/solid';
import { classNames } from '../utils/index.tsx';

// Define proper tool interface
interface Tool {
  id: string;
  name: string;
  logo: string;
  affiliateLink?: string;
  website: string;
  upvotes?: number;
}

interface ToolItemProps {
  tool: Tool;
  isFavorited?: boolean;
  toggleVisibility: (id: string) => void;
  isVisible: boolean;
  handleToolClick: (name: string) => void;
  handleFavorite?: (id: string) => void;
}

// Use memoization to prevent unnecessary re-renders
const ToolItem: React.FC<ToolItemProps> = memo(function ToolItem({ tool, toggleVisibility, isVisible, handleToolClick, handleFavorite, isFavorited = false }) {
  const { id, name, logo, affiliateLink, website, upvotes } = tool;
  
  // Memoize handlers for better performance
  const handleClick = useCallback(() => handleToolClick(name), [handleToolClick, name]);
  const handleVisibilityToggle = useCallback(() => toggleVisibility(id), [toggleVisibility, id]);
  const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (handleFavorite) handleFavorite(id);
  }, [handleFavorite, id]);
  
  // Color palette for fallback avatars
  const colors = ['#5973fe', '#3fb68b', '#ff5353', '#ffb648', '#DC7F5A', '#0072B5'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];
  
  return (
    <div 
      className="relative flex items-center space-x-3 rounded-sm bg-gradient-to-r from-theme-layer-lighter to-theme-layer-lightest px-2 py-2 group hover:shadow-[1px_1px_0px_#ffffff] border border-theme-layer-lightest sm:transition-all sm:duration-200 sm:hover:scale-[1.01]"
      tabIndex={0}
      role="button"
      aria-label={`Open ${name} website`}
    >
      <div className="flex-shrink-0">
        {logo ? (
          <img 
            className="h-9 w-9 border border-theme-layer-lightest overflow-hidden rounded-sm sm:grayscale-[20%] sm:group-hover:grayscale-0 sm:transition-all" 
            src={logo} 
            alt={`${name} logo`}
            width={36}
            height={36}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              // Create colored placeholder based on tool name (consistent color for same name)
              const placeholderEl = document.createElement('div');
              placeholderEl.className = 'h-9 w-9 flex items-center justify-center text-white font-bold rounded-sm';
              placeholderEl.style.backgroundColor = avatarColor;
              placeholderEl.textContent = name.charAt(0).toUpperCase();
              placeholderEl.setAttribute('role', 'img');
              placeholderEl.setAttribute('aria-label', `${name} (no logo available)`);
              target.parentNode?.replaceChild(placeholderEl, target);
            }}
          />
        ) : (
          <div 
            className="h-9 w-9 flex items-center justify-center text-white font-bold rounded-sm border border-theme-layer-lightest"
            style={{ backgroundColor: avatarColor }}
            role="img"
            aria-label={`${name} (no logo available)`}
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
          className="focus:outline-none focus:ring-2 focus:ring-theme-text-light rounded-sm block" 
          onClick={handleClick}
        >
          <p className="text-sm font-medium text-theme-text-base group-hover:text-white truncate">{name}</p>
        </a>
      </div>
      <div className="flex items-center">
        <button 
          className={`mr-2 flex items-center text-xs ${isFavorited ? 'text-theme-yellow' : 'text-theme-text-dark'} cursor-pointer hover:text-theme-yellow focus:outline-none focus:ring-1 focus:ring-theme-text-light p-1 rounded-sm`}
          onClick={handleFavoriteToggle}
          title={isFavorited ? "Remove favorite" : "Favorite this tool"}
          aria-label={isFavorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
          aria-pressed={isFavorited}
        >
          <StarIcon className={`w-4 h-4 mr-0.5 ${isFavorited ? 'text-theme-yellow' : 'text-theme-text-dark'}`} />
          <span>{upvotes || 0}</span>
        </button>
        <button
          onClick={handleVisibilityToggle}
          className={classNames('group flex w-5 h-5 border-0 hover:text-gray-300 hover:cursor-pointer items-center justify-center text-theme-layer-base bg-theme-layer-lightest rounded-sm focus:outline-none focus:ring-1 focus:ring-theme-text-light')}
          aria-label={isVisible ? `Hide ${name}` : `Show ${name}`}
        >
          {isVisible ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
});

export default ToolItem;
