import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle theme change animation
  const handleThemeChange = () => {
    setIsAnimating(true);
    setTimeout(() => {
      toggleTheme();
      setTimeout(() => {
        setIsAnimating(false);
      }, 400); // Match with the animation duration
    }, 200);
  };

  return (
    <button
      onClick={handleThemeChange}
      disabled={isAnimating}
      className={`p-2 rounded-full transition-all duration-300 focus:outline-none
                  ${isAnimating ? 'scale-110' : 'scale-100'} 
                  ${theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-light' 
                    : 'bg-light-layer-light hover:bg-light-layer-dark'
                  }`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className={`relative w-5 h-5 ${isAnimating ? 'animate-spin' : ''}`}>
        {/* Sun icon */}
        <div className={`absolute inset-0 transform transition-all duration-300 ${
          theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90 scale-50'
        }`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-theme-yellow" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        
        {/* Moon icon */}
        <div className={`absolute inset-0 transform transition-all duration-300 ${
          theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0'
        }`}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-light-text-dark" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;