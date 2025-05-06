import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage, system preference, or default to dark
  const [theme, setTheme] = useState<Theme>(() => {
    // First try to get from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    
    // Otherwise check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    // Default to dark theme
    return "dark";
  });
  
  // Track transition state for animations
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Toggle between dark and light themes with transition
  const toggleTheme = useCallback(() => {
    setIsTransitioning(true);
    
    // Use setTimeout to allow CSS transitions to complete
    setTimeout(() => {
      setTheme(prevTheme => {
        const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        return newTheme;
      });
      
      // Reset transitioning state after the theme change
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 50);
  }, []);

  // Apply theme to document element when it changes
  useEffect(() => {
    // Remove old theme classes
    document.documentElement.classList.remove('dark', 'light');
    
    // Add transition class before applying new theme
    document.documentElement.classList.add('theme-transition');
    
    // Apply new theme
    document.documentElement.classList.add(theme);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    // Add listener for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Remove transition class after theme is applied
    const removeTransition = setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 500);
    
    // Cleanup
    return () => {
      clearTimeout(removeTransition);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};