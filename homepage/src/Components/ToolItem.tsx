import React, { memo, useCallback, useState } from 'react';
import { XCircleIcon, CheckCircleIcon, StarIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { useTheme } from '../context/ThemeContext';

// Define proper tool interface
interface Tool {
  id: string;
  name: string;
  logo: string;
  affiliateLink?: string;
  website: string;
  upvotes?: number;
  category?: string;
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
  const [isHovering, setIsHovering] = useState(false);
  
  // Memoize handlers for better performance
  const handleClick = useCallback(() => handleToolClick(name), [handleToolClick, name]);
  const handleVisibilityToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleVisibility(id);
  }, [toggleVisibility, id]);
  
  const handleFavoriteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (handleFavorite) handleFavorite(id);
  }, [handleFavorite, id]);
  
  // Color palette for fallback avatars - improved vibrant palette
  const colors = ['#5973fe', '#3fb68b', '#ff5353', '#ffb648', '#DC7F5A', '#0072B5', '#9747FF', '#00B8A9'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];
  
  // Get the domain from the website URL
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return url;
    }
  };
  
  const websiteDomain = getDomain(website);
  
  return (
    <div
      className={`relative flex items-center space-x-3 rounded-md px-3 py-2.5 group ${
        theme === "dark"
          ? "bg-theme-layer-lighter border-theme-layer-lightest hover:bg-theme-layer-lightest"
          : "bg-white border-light-border-dark hover:bg-light-layer-lighter"
      } border shadow-sm hover:shadow-md transition-all duration-150`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={0}
      aria-label={`Open ${name} website`}
    >
      {/* Logo section with optimized loading */}
      <div className="flex-shrink-0">
        {logo ? (
          <img
            className="h-10 w-10 overflow-hidden rounded-md transition-all object-cover"
            src={logo}
            alt={`${name} logo`}
            width={40}
            height={40}
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              // Create colored placeholder based on tool name (consistent color for same name)
              const placeholderEl = document.createElement("div");
              placeholderEl.className = "h-10 w-10 flex items-center justify-center text-white font-bold rounded-md";
              placeholderEl.style.backgroundColor = avatarColor;
              placeholderEl.textContent = name.charAt(0).toUpperCase();
              placeholderEl.setAttribute("role", "img");
              placeholderEl.setAttribute("aria-label", `${name} (no logo available)`);
              target.parentNode?.replaceChild(placeholderEl, target);
            }}
          />
        ) : (
          <div
            className="h-10 w-10 flex items-center justify-center text-white font-bold rounded-md"
            style={{ backgroundColor: avatarColor }}
            role="img"
            aria-label={`${name} (no logo available)`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {/* Tool name and website info */}
      <div className="min-w-0 flex-1 flex flex-col">
        <a
          href={affiliateLink || website}
          target="_blank"
          rel="noopener noreferrer"
          className="focus:outline-none focus:ring-1 focus:ring-theme-text-light rounded-sm block flex-1"
          onClick={handleClick}
        >
          <p
            className={`text-sm font-medium truncate ${
              theme === "dark"
                ? "text-theme-text-light"
                : "text-light-text-dark"
            }`}
          >
            {name}
          </p>
          <p
            className={`text-xs truncate mt-0.5 ${
              theme === "dark"
                ? "text-theme-text-dark"
                : "text-light-text-light"
            }`}
          >
            {websiteDomain}
          </p>
        </a>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center">
        {/* Action buttons that appear on hover */}
        <div className={`flex items-center space-x-2 transition-opacity duration-150 ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
          {/* Star/Favorite button with count */}
          <button
            className={`p-1 rounded-full flex items-center ${
              isFavorited
                ? theme === "dark" 
                  ? "bg-theme-yellow bg-opacity-20 text-theme-yellow" 
                  : "bg-theme-yellow bg-opacity-10 text-theme-yellow"
                : theme === "dark"
                  ? "bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-dark hover:text-theme-yellow"
                  : "bg-light-layer-light hover:bg-light-layer-dark text-light-text-light hover:text-theme-yellow"
            } transition-colors`}
            onClick={handleFavoriteToggle}
            title={isFavorited ? "Remove favorite" : "Favorite this tool"}
            aria-label={isFavorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
            aria-pressed={isFavorited}
          >
            <StarIcon className="w-4 h-4 hover:scale-110 transition-transform" />
            <span className="text-xs font-medium ml-1">{upvotes || 0}</span>
          </button>
          
          {/* Visit website button */}
          <a
            href={affiliateLink || website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`p-1 rounded-full ${
              theme === "dark"
                ? "bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-light"
                : "bg-light-layer-light hover:bg-light-layer-dark text-light-text-dark hover:text-white"
            } transition-colors`}
            title={`Open ${name} website`}
            aria-label={`Open ${name} website`}
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
          
          {/* Visibility toggle button */}
          <button
            onClick={handleVisibilityToggle}
            className={`p-1 rounded-full ${
              theme === "dark"
                ? "bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-dark hover:text-theme-text-light"
                : "bg-light-layer-light hover:bg-light-layer-dark text-light-text-light hover:text-white"
            } transition-colors`}
            title={isVisible ? `Hide ${name}` : `Show ${name}`}
            aria-label={isVisible ? `Hide ${name}` : `Show ${name}`}
          >
            {isVisible ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {/* Mobile-friendly view where buttons are always visible */}
      <div className={`sm:hidden flex items-center space-x-2 absolute right-2 top-2`}>
        {/* Favorite button for mobile */}
        <button
          onClick={handleFavoriteToggle}
          className={`p-1 rounded-full flex items-center ${
            isFavorited
              ? "bg-theme-yellow bg-opacity-20 text-theme-yellow"
              : theme === "dark"
                ? "bg-theme-layer-dark text-theme-text-dark"
                : "bg-light-layer-light text-light-text-light"
          }`}
          aria-label={isFavorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
        >
          <StarIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium ml-1">{upvotes || 0}</span>
        </button>
        
        {/* Visibility toggle button for mobile */}
        <button
          onClick={handleVisibilityToggle}
          className={`p-1 rounded-full ${
            theme === "dark"
              ? "bg-theme-layer-dark text-theme-text-dark hover:text-theme-text-light"
              : "bg-light-layer-light text-light-text-light hover:text-light-text-dark"
          }`}
          aria-label={isVisible ? `Hide ${name}` : `Show ${name}`}
        >
          {isVisible ? <XCircleIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
});

export default ToolItem;
