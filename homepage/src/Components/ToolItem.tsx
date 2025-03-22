import React, { memo, useCallback } from 'react';
import { XCircleIcon, CheckCircleIcon, StarIcon } from '@heroicons/react/20/solid';
import { classNames } from '../utils/index.tsx';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  
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
      className={`relative flex items-center space-x-3 rounded-sm px-2 py-2 group ${
        theme === "dark"
          ? "bg-theme-layer-lighter border-theme-layer-lightest hover:bg-theme-layer-lightest"
          : "bg-light-layer-light border-light-border-dark hover:bg-light-layer-lighter"
      } border transition-all duration-150`}
      tabIndex={0}
      role="button"
      aria-label={`Open ${name} website`}
    >
      <div className="flex-shrink-0">
        {logo ? (
          <img
            className="h-8 w-8 overflow-hidden rounded-sm transition-all"
            src={logo}
            alt={`${name} logo`}
            width={32}
            height={32}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              // Create colored placeholder based on tool name (consistent color for same name)
              const placeholderEl = document.createElement("div");
              placeholderEl.className = "h-8 w-8 flex items-center justify-center text-white font-bold rounded-sm";
              placeholderEl.style.backgroundColor = avatarColor;
              placeholderEl.textContent = name.charAt(0).toUpperCase();
              placeholderEl.setAttribute("role", "img");
              placeholderEl.setAttribute("aria-label", `${name} (no logo available)`);
              target.parentNode?.replaceChild(placeholderEl, target);
            }}
          />
        ) : (
          <div
            className="h-8 w-8 flex items-center justify-center text-white font-bold rounded-sm"
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
          className="focus:outline-none focus:ring-1 focus:ring-theme-text-light rounded-sm block"
          onClick={handleClick}
        >
          <p
            className={`text-sm font-medium truncate ${
              theme === "dark"
                ? "text-theme-text-base"
                : "text-light-text-dark"
            }`}
          >
            {name}
          </p>
        </a>
      </div>
      <div className="flex items-center space-x-2">
        <button
          className={`flex items-center text-xs cursor-pointer focus:outline-none rounded-sm ${
            isFavorited
              ? "text-theme-yellow"
              : theme === "dark"
              ? "text-theme-text-dark hover:text-theme-yellow"
              : "text-light-text-light hover:text-theme-yellow"
          }`}
          onClick={handleFavoriteToggle}
          title={isFavorited ? "Remove favorite" : "Favorite this tool"}
          aria-label={isFavorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
          aria-pressed={isFavorited}
        >
          <StarIcon
            className={`w-4 h-4 ${
              isFavorited ? "text-theme-yellow" : theme === "dark" ? "text-theme-text-dark" : "text-light-text-light"
            }`}
          />
          <span className="ml-1">{upvotes || 0}</span>
        </button>
        <button
          onClick={handleVisibilityToggle}
          className={classNames(
            `flex w-5 h-5 hover:cursor-pointer items-center justify-center rounded-sm focus:outline-none ${
              theme === "dark"
                ? "text-theme-layer-base hover:text-gray-300"
                : "text-gray-600 hover:text-gray-800"
            }`
          )}
          aria-label={isVisible ? `Hide ${name}` : `Show ${name}`}
        >
          {isVisible ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});

export default ToolItem;
