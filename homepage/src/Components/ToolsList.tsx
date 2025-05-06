import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db, analytics } from '../firebase.config';
import './ToolsList.css'
import { logEvent } from "firebase/analytics";
import { ArrowDownCircleIcon, ArrowUpCircleIcon, AdjustmentsHorizontalIcon, BookmarkIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import ToolControls from './ToolControls';
import DraggableToolsList from './DraggableToolsList';
import { useTheme } from '../context/ThemeContext';

// Define proper types
interface Tool {
  id: string;
  name: string;
  logo: string;
  affiliateLink?: string;
  website: string;
  upvotes?: number;
  category: string;
}

interface SavedLayout {
  name: string;
  data: string;
  created?: string;
  toolCount?: number;
}

const ToolsList: React.FC = () => {
  const { theme } = useTheme();
  
  // state declarations with proper types
  const [tools, setTools] = useState<Tool[]>([]);
  const initialVisibility = useMemo(() => JSON.parse(localStorage.getItem('visibility') || '{}'), []);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialVisibility);
  const [groupedTools, setGroupedTools] = useState<Record<string, Tool[]>>({});
  const [hiddens, setHiddens] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [newTool, setNewTool] = useState<Omit<Tool, 'id' | 'upvotes'>>({ 
    name: '', 
    logo: '', 
    website: '', 
    category: '' 
  });
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>(
    JSON.parse(localStorage.getItem('savedLayouts') || '[]')
  );
  const [favorites, setFavorites] = useState<Record<string, boolean>>(
    JSON.parse(localStorage.getItem('favorites') || '[]')
  );

  // Memoized categories to prevent re-renders
  const allCategoriesForDropdown = useMemo(() => 
    [...new Set([...Object.keys(groupedTools), ...customCategories])], 
    [groupedTools, customCategories]
  );

  // Process tools with proper typing
  const processTools = useCallback((toolsArray: Tool[]) => {
    const grouped: Record<string, Tool[]> = toolsArray.reduce((acc: Record<string, Tool[]>, tool) => {
      const category = tool.category || "Uncategorized";
      acc[category] = acc[category] || [];
      acc[category].push(tool);
      return acc;
    }, {});

    // Sort each category by upvotes
    for (const category in grouped) {
      grouped[category].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    }

    setTools(toolsArray);
    setGroupedTools(grouped);
    }, []);
  
  // Optimized data fetching with caching

  useEffect(() => {
    // Track page view
    if (analytics) {
      logEvent(analytics, 'page_view', { page_path: '/' });
    }

    const fetchData = async () => {
      setIsLoading(true);
      
      // Get custom tools from localStorage
      const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
      
      try {
        // Check for cached data with timestamp
        const cachedData = localStorage.getItem('cachedFirestoreTools');
        const cachedTime = localStorage.getItem('cachedFirestoreTime');
        const currentTime = new Date().getTime();
        
        // Cache is valid for 30 minutes (1800000 ms)
        const CACHE_VALIDITY = 1800000;
        
        // Use cached data if available and not expired
        if (cachedData && cachedTime && (currentTime - parseInt(cachedTime)) < CACHE_VALIDITY) {
          console.log('Using cached Firestore data');
          const toolsArray = JSON.parse(cachedData);
          
          // Combine cached tools with custom tools
          const combinedTools = [...toolsArray, ...customTools];
          processTools(combinedTools);
        } 
        // Otherwise fetch from Firestore
        else {
          // Check if Firestore is properly initialized
          if (!db) {
            console.error('Firestore is not initialized');
            throw new Error('Firestore is not initialized');
          }
          
          // Attempt to fetch from Firestore
          console.log('Fetching data from Firestore collection "tools"');
          
          // Set a reasonable timeout for Firestore fetch
          let fetchTimedOut = false;
          const timeoutId = setTimeout(() => {
            console.log('Firestore fetch timed out, using cached data');
            fetchTimedOut = true;
            throw new Error('Firestore fetch timeout');
          }, 5000);
          
          // Fetch data from Firestore
          const querySnapshot = await getDocs(collection(db, 'tools'));
          
          // Clear timeout since fetch completed successfully
          clearTimeout(timeoutId);
          
          // Don't proceed if timed out
          if (fetchTimedOut) throw new Error('Fetch already timed out');
          
          console.log('Firestore query successful, documents count:', querySnapshot.docs.length);
          
          const toolsArray = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          
          // Cache the fetched data
          localStorage.setItem('cachedFirestoreTools', JSON.stringify(toolsArray));
          localStorage.setItem('cachedFirestoreTime', currentTime.toString());
          
          // Combine fetched tools with custom tools
          const combinedTools = [...toolsArray, ...customTools];
          processTools(combinedTools);
        }
        
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        
        // Try to use cached data even if expired as first fallback
        const cachedData = localStorage.getItem('cachedFirestoreTools');
        if (cachedData) {
          console.log('Using expired cached data as fallback');
          const toolsArray = JSON.parse(cachedData);
          // Combine cached tools with custom tools
          const combinedTools = [...toolsArray, ...customTools];
          processTools(combinedTools);
        }
        // Then try custom tools if available
        else if (customTools.length > 0) {
          console.log('Using custom tools from localStorage');
          processTools(customTools);
        } 
        // No fallback data, only use custom tools if available
        else {
          console.log('No data available from Firestore or cache');
          if (customTools.length > 0) {
            console.log('Using only custom tools as fallback');
            processTools(customTools);
          } else {
            console.log('No tools available to display');
            // Set empty array rather than using mock data
            processTools([]);
          }
        }
      } finally {
        // Load saved settings from localStorage synchronously
        try {
          // Load visibility settings
          const savedVisibility = localStorage.getItem('visibility');
          if (savedVisibility) {
            setVisibility(JSON.parse(savedVisibility));
          }
          
          // Load custom categories
          const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
          setCustomCategories(savedCustomCategories);
          
          // Load favorites
          const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '{}');
          setFavorites(savedFavorites);
        } catch (e) {
          console.error('Error loading settings from localStorage:', e);
        }
        
        // Directly set loading state to false
        setIsLoading(false);
      }
    };

    fetchData();
  }, [processTools]);

  // Process and group tools whenever the tools array changes
  // Uses useMemo instead of useState+useEffect for better performance
  useEffect(() => {
    // Skip processing if tools is empty
    if (tools.length === 0) return;
    
    // Use a more efficient approach with a single iteration
    const grouped: Record<string, Tool[]> = {};
    
    // Group tools by category
    tools.forEach((tool: Tool) => {
      const category = tool.category || 'Uncategorized';
      
      // Initialize category array if needed
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      // Add tool to its category
      grouped[category].push(tool);
    });
    
    // Sort each category by upvotes (outside the main loop for better performance)
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    });
    
    // Update state only once after all processing
    setGroupedTools(grouped);
    
  }, [tools]);

  useEffect(() => {
    localStorage.setItem('visibility', JSON.stringify(visibility));
  }, [visibility]);

  const handleToolClick = (toolName: string) => {
    if (analytics) {
      logEvent(analytics, 'select_tool', { name: toolName });
    }
  };
  
  useEffect(() => {
    // Save favorites to localStorage whenever they change
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);
  
  // Optimized favorite handler with debouncing and queueing for Firebase
  const handleFavorite = useCallback(async (toolId: string) => {
    try {
      // Toggle favorite status in local state immediately for responsive UI
      const isFavorited = favorites[toolId];
      const newFavorites = { ...favorites, [toolId]: !isFavorited };
      setFavorites(newFavorites);
      
      // Save to localStorage for persistence
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      
      // Update local state first - optimistic update
      setTools(prevTools => 
        prevTools.map(tool => 
          tool.id === toolId 
            ? { ...tool, upvotes: (tool.upvotes || 0) + (isFavorited ? -1 : 1) } 
            : tool
        )
      );
      
      // Log the favorite action if analytics is available
      if (analytics) {
        logEvent(analytics, isFavorited ? 'unfavorite_tool' : 'favorite_tool', { 
          tool_id: toolId,
          tool_name: tools.find(t => t.id === toolId)?.name || 'unknown'
        });
      }
      
      // Skip Firestore updates for custom tools
      if (toolId.startsWith('custom-')) {
        return; // Exit early for custom tools
      }
      
      // Only attempt Firestore update if db is available
      if (db) {
        // Use a timeout to debounce rapid changes
        setTimeout(async () => {
          try {
            const toolRef = doc(db, 'tools', toolId);
            
            // Double-check current state before updating Firestore
            // This handles cases where user rapidly toggles the favorite button
            const currentFavorited = favorites[toolId];
            
            // Only update if the favorite status has actually changed
            if (currentFavorited !== isFavorited) {
              await updateDoc(toolRef, {
                upvotes: increment(isFavorited ? -1 : 1)
              });
              
              // Update local cache to keep it in sync
              const cachedData = localStorage.getItem('cachedFirestoreTools');
              if (cachedData) {
                const toolsArray = JSON.parse(cachedData);
                const updatedTools = toolsArray.map((tool: Tool) => 
                  tool.id === toolId 
                    ? { ...tool, upvotes: (tool.upvotes || 0) + (isFavorited ? -1 : 1) } 
                    : tool
                );
                localStorage.setItem('cachedFirestoreTools', JSON.stringify(updatedTools));
              }
            }
          } catch (firestoreError) {
            console.error('Firestore update error:', firestoreError);
            // We don't revert the local state here because we want the app to work offline
          }
        }, 200); // 200ms debounce
      } else {
        console.log('Skipping Firestore update - Firestore not available');
      }
    } catch (error) {
      console.error('Error in handleFavorite:', error);
      // Revert the change in favorites if there's an error in the main function
      setFavorites(prev => ({ ...prev, [toolId]: prev[toolId] }));
    }
  }, [favorites, analytics, db, tools, setFavorites, setTools]);

  const toggleVisibility = (id: string) => {
    setVisibility(prev => {
      const newVisibility = { ...prev, [id]: !prev[id] };
      localStorage.setItem('visibility', JSON.stringify(newVisibility));
      return newVisibility;
    });
  };

  const addNewCategory = () => {
    if (newCategory.trim() !== '' && !customCategories.includes(newCategory)) {
      const updatedCategories = [...customCategories, newCategory];
      setCustomCategories(updatedCategories);
      localStorage.setItem('customCategories', JSON.stringify(updatedCategories));
      setNewCategory(''); 
    }
  };

  // Enhanced saveSettings function with versioning and metadata
  const saveSettings = useCallback((layoutName?: string) => {
    // Extract only custom tools
    const customTools = tools.filter(tool => tool.id.startsWith('custom-'));
    
    // Create a structured settings object with metadata
    const settings = {
      version: "2.0", // Added versioning for future compatibility
      timestamp: new Date().toISOString(),
      data: {
        visibility,
        customTools,
        customCategories,
        favorites
      },
      metadata: {
        layoutName: layoutName || "Exported Layout",
        toolCount: {
          total: tools.length,
          visible: tools.filter(tool => !visibility[tool.id]).length,
          hidden: tools.filter(tool => visibility[tool.id]).length,
          custom: customTools.length
        },
        categories: customCategories 
      }
    };
    
    // Convert to JSON with pretty printing for better readability when exported
    const data = JSON.stringify(settings, null, 2);
    
    // Save to local storage with name if provided
    if (layoutName) {
      // Create a layout object with timestamp for sorting
      const newLayout = { 
        name: layoutName, 
        data: data,
        created: new Date().toISOString(),
        toolCount: tools.filter(tool => !visibility[tool.id]).length
      };
      
      // Add to layouts, ensuring no duplicates by name
      const filteredLayouts = savedLayouts.filter(layout => 
        JSON.parse(layout.data).metadata?.layoutName !== layoutName
      );
      
      const updatedLayouts = [...filteredLayouts, newLayout];
      
      // Sort layouts by creation date (newest first)
      updatedLayouts.sort((a, b) => {
        const dateA = new Date(a.created || 0);
        const dateB = new Date(b.created || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Update state and local storage
      setSavedLayouts(updatedLayouts);
      localStorage.setItem('savedLayouts', JSON.stringify(updatedLayouts));
      
      // Show visual feedback (could be improved with a toast notification)
      return true;
    }
    
    // Download file to users computer with date-stamped filename
    const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `ultrasound_tools_${dateStr}.json`;
    
    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href); // Clean up
    
    return true;
  }, [tools, visibility, customCategories, favorites, savedLayouts]);

  // Enhanced layout loading with version checking and validation
  const loadLayout = useCallback((layoutData: string) => {
    try {
      // Parse the layout data
      const parsedData = JSON.parse(layoutData);
      
      // Handle different versions of saved data
      if (parsedData.version === "2.0") {
        // New format with versioning and metadata
        const { data } = parsedData;
        
        // Apply visibility settings if available
        if (data.visibility) {
          setVisibility(data.visibility);
          localStorage.setItem('visibility', JSON.stringify(data.visibility));
        }
        
        // Apply custom tools if available
        if (data.customTools && Array.isArray(data.customTools)) {
          // Combine with existing non-custom tools
          const baseTools = tools.filter(tool => !tool.id.startsWith('custom-'));
          const combinedTools = [...baseTools, ...data.customTools];
          setTools(combinedTools);
          localStorage.setItem('customTools', JSON.stringify(data.customTools));
        }
        
        // Apply custom categories if available
        if (data.customCategories && Array.isArray(data.customCategories)) {
          setCustomCategories(data.customCategories);
          localStorage.setItem('customCategories', JSON.stringify(data.customCategories));
        }
        
        // Apply favorites if available
        if (data.favorites && typeof data.favorites === 'object') {
          setFavorites(data.favorites);
          localStorage.setItem('favorites', JSON.stringify(data.favorites));
        }
        
        // Show success with metadata
        console.log(`Loaded layout "${parsedData.metadata?.layoutName}" with ${parsedData.metadata?.toolCount.visible} visible tools`);
        return true;
      } 
      else {
        // Legacy format (pre-versioning)
        if (parsedData.visibility) {
          setVisibility(parsedData.visibility);
          localStorage.setItem('visibility', JSON.stringify(parsedData.visibility));
        }
        
        if (parsedData.customTools && Array.isArray(parsedData.customTools)) {
          const baseTools = tools.filter(tool => !tool.id.startsWith('custom-'));
          const combinedTools = [...baseTools, ...parsedData.customTools];
          setTools(combinedTools);
          localStorage.setItem('customTools', JSON.stringify(parsedData.customTools));
        }
        
        if (parsedData.customCategories && Array.isArray(parsedData.customCategories)) {
          setCustomCategories(parsedData.customCategories);
          localStorage.setItem('customCategories', JSON.stringify(parsedData.customCategories));
        }
        
        console.log('Loaded legacy layout format');
        return true;
      }
    } catch (error) {
      console.error("Error loading layout:", error);
      return false;
    }
  }, [tools]);

  // File import handling with validation and error handling
  const loadSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('Please select a valid JSON file');
      return;
    }
    
    // Size limit check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum file size is 5MB.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const layoutData = e.target?.result as string;
        const success = loadLayout(layoutData);
        
        if (success) {
          // Reset file input for future imports
          if (event.target) {
            event.target.value = '';
          }
        } else {
          alert('Failed to load layout. Invalid format or data.');
        }
      } catch (error) {
        console.error("Error reading file:", error);
        alert('Error reading file. Please make sure it\'s a valid layout file.');
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    
    reader.readAsText(file);
  }, [loadLayout]);
  
  // Layout management functions
  const deleteLayout = useCallback((index: number) => {
    if (window.confirm('Are you sure you want to delete this saved layout?')) {
      const updatedLayouts = [...savedLayouts];
      updatedLayouts.splice(index, 1);
      setSavedLayouts(updatedLayouts);
      localStorage.setItem('savedLayouts', JSON.stringify(updatedLayouts));
    }
  }, [savedLayouts]);

  const handleNewToolChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTool(prev => ({ ...prev, [name]: value }));
  };

  const addNewTool = () => {
    if (newTool.name && newTool.logo && newTool.website) {
      const newToolWithId = { id: `custom-${new Date().getTime()}`, ...newTool, category: newTool.category || 'Uncategorized' };
      const updatedTools = [...tools, newToolWithId];

      setTools(updatedTools);
      setVisibility(prev => ({ ...prev, [newToolWithId.id]: false }));
      setNewTool({ name: '', logo: '', website: '', category: '' }); // Reset input fields

      const customTools = updatedTools.filter(tool => tool.id.startsWith('custom-'));
      localStorage.setItem('customTools', JSON.stringify(customTools));
    }
  };

  const resetLayout = () => {
    if (window.confirm('Are you sure you want to reset your layout? This will remove all custom tools, categories, and visibility settings.')) {
      localStorage.removeItem('visibility');
      localStorage.removeItem('customTools');
      localStorage.removeItem('customCategories');

      setTools([]);
      setVisibility({});
      setGroupedTools({});
      setCustomCategories([]);
      window.location.reload();
    }
  };
  
  // Enhanced filter functionality with improved search
  const filteredTools = useMemo(() => {
    let result = {...groupedTools};
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      Object.keys(result).forEach(category => {
        result[category] = result[category].filter(tool => {
          // Search by name (highest priority)
          const nameMatch = tool.name.toLowerCase().includes(lowerSearchTerm);
          
          // Search by website URL (check domain)
          const websiteMatch = tool.website.toLowerCase().includes(lowerSearchTerm);
          
          // Search by category name
          const categoryMatch = category.toLowerCase().includes(lowerSearchTerm);
          
          // Combined search 
          return nameMatch || websiteMatch || categoryMatch;
        });
      });
    }
    
    // Filter by active category if selected
    if (activeCategory) {
      const categoryTools = result[activeCategory] || [];
      result = { [activeCategory]: categoryTools };
    }
    
    return result;
  }, [groupedTools, searchTerm, activeCategory]);
  
  // Calculate filtered categories that have at least one visible tool
  const filteredCategories = useMemo(() => {
    return Object.keys(filteredTools)
      .filter(category => filteredTools[category].length > 0)
      // Sort categories by: 1) active category first, 2) number of visible tools (descending)
      .sort((a, b) => {
        // Active category always comes first
        if (a === activeCategory) return -1;
        if (b === activeCategory) return 1;
        
        // Otherwise sort by number of visible tools
        const visibleToolsA = filteredTools[a].filter(tool => !visibility[tool.id]).length;
        const visibleToolsB = filteredTools[b].filter(tool => !visibility[tool.id]).length;
        return visibleToolsB - visibleToolsA;
      });
  }, [filteredTools, activeCategory, visibility]);

  return (
    <div className="pt-4">
      {isLoading ? (
        <div className="py-8">
          {/* Enhanced Loading State - Skeleton UI */}
          <div className="mb-6">
            <div className={`w-full h-12 rounded-md animate-pulse ${
              theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-light'
            }`}></div>
          </div>
          
          {/* Search Bar Skeleton */}
          <div className={`w-full mb-6 rounded-md animate-pulse ${
            theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-light'
          }`} style={{ height: '100px' }}></div>
          
          {/* Category Tabs Skeleton */}
          <div className="mb-8">
            <div className={`w-24 h-4 mb-3 rounded animate-pulse ${
              theme === 'dark' ? 'bg-theme-layer-lighter opacity-70' : 'bg-light-layer-light'
            }`}></div>
            
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map(i => (
                <div 
                  key={i}
                  className={`h-8 rounded-md animate-pulse ${
                    theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-light'
                  }`}
                  style={{ width: `${70 + Math.random() * 60}px` }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Tool Items Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(12).fill(0).map((_, i) => (
              <div 
                key={i} 
                className={`h-14 rounded-md animate-pulse ${
                  theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-light'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              ></div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Responsive Control Bar */}
          <div className={`mb-4 rounded-md border ${
            theme === 'dark' 
              ? 'border-theme-text-dark/30 bg-theme-layer-dark/50' 
              : 'border-light-text-dark/30 bg-light-layer-lighter/50'
          }`}>
            {/* Enhanced Search Bar - Full Width on Mobile */}
            <div className="p-3 border-b border-opacity-20 border-gray-500">
              <div className="flex items-center relative">
                <div className={`absolute left-3 text-sm ${
                  theme === 'dark' 
                    ? 'text-theme-text-dark' 
                    : 'text-light-text-light'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, category or website..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`text-sm rounded-md pl-9 pr-3 py-2.5 w-full ${
                    theme === 'dark' 
                      ? 'border-theme-layer-lightest bg-theme-layer-lighter text-theme-text-light' 
                      : 'border-light-border-dark bg-white text-light-text-dark'
                  }`}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className={`absolute right-3 ${
                      theme === 'dark' 
                        ? 'text-theme-text-dark hover:text-theme-text-light' 
                        : 'text-light-text-light hover:text-light-text-dark'
                    }`}
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Suggestions - Quick Filters for touch */}
              {!searchTerm && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setActiveCategory("DEXs")}
                    className={`px-2 py-1 text-xs rounded-md ${
                      theme === 'dark' 
                        ? 'bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-dark hover:text-theme-text-base' 
                        : 'bg-light-layer-light hover:bg-light-layer-dark text-light-text-light hover:text-white'
                    }`}
                  >
                    DEXs
                  </button>
                  <button
                    onClick={() => setActiveCategory("Analytics")} 
                    className={`px-2 py-1 text-xs rounded-md ${
                      theme === 'dark' 
                        ? 'bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-dark hover:text-theme-text-base' 
                        : 'bg-light-layer-light hover:bg-light-layer-dark text-light-text-light hover:text-white'
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setActiveCategory("Portfolio")} 
                    className={`px-2 py-1 text-xs rounded-md ${
                      theme === 'dark' 
                        ? 'bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-dark hover:text-theme-text-base' 
                        : 'bg-light-layer-light hover:bg-light-layer-dark text-light-text-light hover:text-white'
                    }`}
                  >
                    Portfolio
                  </button>
                  {/* Most popular tools based on upvotes */}
                  <button
                    onClick={() => setSearchTerm("uniswap")} 
                    className={`px-2 py-1 text-xs rounded-md ${
                      theme === 'dark' 
                        ? 'bg-theme-layer-dark hover:bg-theme-layer-base text-theme-text-dark hover:text-theme-text-base' 
                        : 'bg-light-layer-light hover:bg-light-layer-dark text-light-text-light hover:text-white'
                    }`}
                  >
                    Uniswap
                  </button>
                </div>
              )}
              
              {/* Search Results Count */}
              {searchTerm && (
                <div className={`mt-2 text-xs px-1 ${
                  theme === 'dark' 
                    ? 'text-theme-text-dark' 
                    : 'text-light-text-light'
                }`}>
                  Found {Object.values(filteredTools).reduce((count, tools) => count + tools.filter(t => !visibility[t.id]).length, 0)} tools matching "{searchTerm}"
                </div>
              )}
            </div>

            {/* Control Buttons - Responsive Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-3">
              <button
                className={`rounded-md px-2 py-2 text-sm flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                    : 'bg-white hover:bg-light-layer-dark hover:text-white'
                }`}
                onClick={() => setShowControls(!showControls)}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                <span>Edit</span>
              </button>

              <button
                className={`rounded-md px-2 py-2 text-sm flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                    : 'bg-white hover:bg-light-layer-dark hover:text-white'
                }`}
                onClick={() => saveSettings()}
              >
                <BookmarkIcon className="w-4 h-4 mr-1" />
                <span>Export</span>
              </button>

              <div className="relative">
                <label 
                  className={`flex rounded-md px-2 py-2 text-sm items-center justify-center cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                      : 'bg-white hover:bg-light-layer-dark hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <span>Import</span>
                  <input 
                    className="cursor-pointer opacity-0 absolute inset-0 w-full h-full" 
                    type="file" 
                    onChange={loadSettings}
                    aria-label="Import layout"
                  />
                </label>
              </div>

              <button
                className={`rounded-md px-2 py-2 text-sm flex items-center justify-center ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest text-theme-red' 
                    : 'bg-white hover:bg-light-layer-dark text-theme-red hover:text-white'
                }`}
                onClick={resetLayout}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Saved Layouts - Mobile-Optimized */}
          {savedLayouts.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-theme-text-dark' : 'text-light-text-light'
              }`}>Saved Layouts</h3>
              
              {/* Layout Selector with Delete Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {savedLayouts.map((layout, index) => (
                  <div
                    key={index}
                    className={`rounded-md px-3 py-2 flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-theme-layer-lighter border border-theme-layer-lightest'
                        : 'bg-white border border-light-border-dark'
                    }`}
                  >
                    <button
                      onClick={() => loadLayout(layout.data)}
                      className={`text-sm font-medium hover:underline ${
                        theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                      }`}
                    >
                      {layout.name}
                    </button>
                    <div className="flex items-center">
                      <button
                        onClick={() => loadLayout(layout.data)}
                        className={`p-1 mr-1 rounded-md ${
                          theme === 'dark' 
                            ? 'text-theme-text-dark hover:bg-theme-layer-dark hover:text-theme-text-base' 
                            : 'text-light-text-light hover:bg-light-layer-light hover:text-light-text-dark'
                        }`}
                        aria-label={`Load ${layout.name} layout`}
                        title="Load layout"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteLayout(index)}
                        className={`p-1 rounded-md ${
                          theme === 'dark' 
                            ? 'text-theme-text-dark hover:bg-theme-red hover:bg-opacity-20 hover:text-theme-red' 
                            : 'text-light-text-light hover:bg-theme-red hover:bg-opacity-10 hover:text-theme-red'
                        }`}
                        aria-label={`Delete ${layout.name} layout`}
                        title="Delete layout"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Category Navigation - More visually appealing and usable */}
          {Object.keys(groupedTools).length > 0 && (
            <div className="mb-6">
              <h3 className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-theme-text-dark' : 'text-light-text-light'
              }`}>Categories</h3>
              
              {/* Desktop Category Grid */}
              <div className="hidden md:grid category-grid gap-2 mb-2">
                <button
                  className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-all flex items-center justify-between ${
                    activeCategory === null
                      ? theme === 'dark'
                          ? "bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light"
                          : "bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark"
                      : theme === 'dark'
                          ? "border border-theme-layer-lightest text-theme-text-dark hover:text-theme-text-base hover:border-theme-purple"
                          : "border border-light-border-dark text-light-text-light hover:text-light-text-dark hover:border-theme-pan-sky"
                  }`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  <span>All Categories</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter text-theme-text-dark' 
                      : 'bg-light-layer-light text-light-text-light'
                  }`}>
                    {Object.values(groupedTools).reduce((sum, tools) => sum + tools.filter(t => !visibility[t.id]).length, 0)}
                  </span>
                </button>
                
                {Object.keys(groupedTools).map((category) => {
                  const visibleCount = (groupedTools[category] || []).filter(t => !visibility[t.id]).length;
                  return (
                    <button
                      key={category}
                      className={`px-3 py-2 text-sm whitespace-nowrap rounded-md transition-all flex items-center justify-between ${
                        activeCategory === category
                          ? theme === 'dark'
                              ? "bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light"
                              : "bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark"
                          : theme === 'dark'
                              ? "border border-theme-layer-lightest text-theme-text-dark hover:text-theme-text-base hover:border-theme-purple"
                              : "border border-light-border-dark text-light-text-light hover:text-light-text-dark hover:border-theme-pan-sky"
                      } ${visibleCount === 0 ? 'opacity-50' : ''}`}
                      onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                      aria-pressed={activeCategory === category}
                      disabled={visibleCount === 0}
                    >
                      <span>{category}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 ${
                        theme === 'dark' 
                          ? 'bg-theme-layer-lighter text-theme-text-dark' 
                          : 'bg-light-layer-light text-light-text-light'
                      }`}>
                        {visibleCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile Horizontal Scrolling Tabs */}
              <div className="md:hidden overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 flex">
                <button
                  className={`mr-2 px-3 py-2 text-sm whitespace-nowrap rounded-md flex items-center ${
                    activeCategory === null
                      ? theme === 'dark'
                          ? "bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light"
                          : "bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark"
                      : theme === 'dark'
                          ? "border border-theme-layer-lightest text-theme-text-dark"
                          : "border border-light-border-dark text-light-text-light"
                  }`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  <span>All</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1.5 ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter text-theme-text-dark' 
                      : 'bg-light-layer-light text-light-text-light'
                  }`}>
                    {Object.values(groupedTools).reduce((sum, tools) => sum + tools.filter(t => !visibility[t.id]).length, 0)}
                  </span>
                </button>
                
                {Object.keys(groupedTools).map((category) => {
                  const visibleCount = (groupedTools[category] || []).filter(t => !visibility[t.id]).length;
                  if (visibleCount === 0) return null;
                  
                  return (
                    <button
                      key={category}
                      className={`mr-2 px-3 py-2 text-sm whitespace-nowrap rounded-md flex items-center ${
                        activeCategory === category
                          ? theme === 'dark'
                              ? "bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light"
                              : "bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark"
                          : theme === 'dark'
                              ? "border border-theme-layer-lightest text-theme-text-dark"
                              : "border border-light-border-dark text-light-text-light"
                      }`}
                      onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                      aria-pressed={activeCategory === category}
                    >
                      <span>{category}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1.5 ${
                        theme === 'dark' 
                          ? 'bg-theme-layer-lighter text-theme-text-dark' 
                          : 'bg-light-layer-light text-light-text-light'
                      }`}>
                        {visibleCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Active Category Indicator */}
              {activeCategory && (
                <div className="flex items-center mt-3">
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                  }`}>
                    Showing tools in 
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                    }`}> {activeCategory}</span>
                  </div>
                  <button 
                    onClick={() => setActiveCategory(null)}
                    className={`ml-2 px-2 py-0.5 rounded text-xs ${
                      theme === 'dark'
                        ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest text-theme-text-dark'
                        : 'bg-light-layer-light hover:bg-light-layer-lighter text-light-text-light'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Responsive Masonry-style Grid - maximizing screen space usage */}
          <div className="text-theme-text-base">
            {filteredCategories.map((category) => (
              <div key={category} className="mb-8 category-transition">
                <h2 className={`text-base md:text-lg mb-3 font-medium ${
                  theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                }`}>
                  {category}
                  <span className="text-xs ml-2 opacity-70">
                    ({(filteredTools[category] || []).filter(x => !visibility[x.id]).length})
                  </span>
                </h2>
                
                {/* Draggable Grid Layout with drag-and-drop functionality */}
                <DraggableToolsList 
                  tools={(filteredTools[category] || []).filter(x => !visibility[x.id])}
                  category={category}
                  visibility={visibility}
                  favorites={favorites}
                  toggleVisibility={toggleVisibility}
                  handleToolClick={handleToolClick}
                  handleFavorite={handleFavorite}
                  onOrderChange={(newTools) => {
                    // Create a deep copy of the current tools array to avoid mutation issues
                    const currentTools = JSON.parse(JSON.stringify(tools));
                    
                    // Get tool IDs in their new order
                    const orderedIds = newTools.map(tool => tool.id);
                    
                    // Find all tools in this category
                    const categoryTools = currentTools.filter((tool: Tool) => tool.category === category);
                    const otherTools = currentTools.filter((tool: Tool) => tool.category !== category);
                    
                    // Sort the category tools according to the new order
                    categoryTools.sort((a: Tool, b: Tool) => {
                      const aIndex = orderedIds.indexOf(a.id);
                      const bIndex = orderedIds.indexOf(b.id);
                      
                      // If both are in the ordered list, sort by their position
                      if (aIndex !== -1 && bIndex !== -1) {
                        return aIndex - bIndex;
                      }
                      
                      // If only one is in the list, prioritize the one in the list
                      if (aIndex !== -1) return -1;
                      if (bIndex !== -1) return 1;
                      
                      // Otherwise keep original order
                      return 0;
                    });
                    
                    // Combine the sorted category tools with the other tools
                    const sortedTools = [...categoryTools, ...otherTools];
                    
                    // Update the tools state with the new order
                    setTools(sortedTools);
                    
                    // Save custom tools to localStorage for persistence
                    const customTools = sortedTools.filter(tool => tool.id.startsWith('custom-'));
                    if (customTools.length > 0) {
                      localStorage.setItem('customTools', JSON.stringify(customTools));
                    }
                  }}
                />
                
                {/* Empty state when no visible tools in category */}
                {(filteredTools[category] || []).filter(x => !visibility[x.id]).length === 0 && (
                  <div className={`text-sm p-4 rounded-md text-center ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter text-theme-text-dark' 
                      : 'bg-light-layer-light text-light-text-light'
                  }`}>
                    No visible tools in this category
                  </div>
                )}
              </div>
            ))}
            
            {/* Empty state when no categories match filter */}
            {filteredCategories.length === 0 && (
              <div className={`text-center py-12 rounded-md ${
                theme === 'dark' 
                  ? 'bg-theme-layer-lighter text-theme-text-base' 
                  : 'bg-light-layer-light text-light-text-base'
              }`}>
                <p className="text-lg mb-2">No tools match your search</p>
                <p className="text-sm opacity-70">Try adjusting your search term or filters</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setActiveCategory(null);
                  }}
                  className={`mt-4 px-3 py-1.5 rounded-md text-sm ${
                    theme === 'dark'
                      ? 'bg-theme-layer-dark hover:bg-theme-layer-base'
                      : 'bg-light-layer-darker hover:bg-light-layer-darkest text-white'
                  }`}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Hidden Apps Section - Enhanced for mobile */}
          <div className="mt-10 pt-6 border-t border-opacity-20 border-gray-500">
            {/* Count total hidden apps */}
            {(() => {
              const hiddenToolsCount = Object.values(filteredTools)
                .flat()
                .filter(tool => visibility[tool.id])
                .length;
                
              return (
                <button 
                  onClick={() => setHiddens(!hiddens)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                      : 'bg-white hover:bg-light-layer-light border border-light-border-dark'
                  }`}
                  aria-expanded={hiddens}
                  aria-controls="hidden-tools-section"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <div>
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                      }`}>Hidden Apps</span>
                      <span className={`ml-2 text-sm px-1.5 py-0.5 rounded-full ${
                        theme === 'dark' 
                          ? 'bg-theme-layer-dark text-theme-text-dark' 
                          : 'bg-light-layer-light text-light-text-light'
                      }`}>
                        {hiddenToolsCount}
                      </span>
                    </div>
                  </div>
                  {hiddens ? (
                    <ArrowUpCircleIcon className="w-5 h-5" />
                  ) : (
                    <ArrowDownCircleIcon className="w-5 h-5" />
                  )}
                </button>
              );
            })()}

            {/* Collapsible hidden apps section */}
            {hiddens && (
              <div id="hidden-tools-section" className="text-theme-text-base mt-4">
                {/* Count number of hidden tools across all categories */}
                {filteredCategories.some(category => 
                  (filteredTools[category] || []).filter(x => visibility[x.id]).length > 0
                ) ? (
                  filteredCategories.map((category) => {
                    // Only show categories with hidden tools
                    const hiddenTools = (filteredTools[category] || []).filter(x => visibility[x.id]);
                    if (hiddenTools.length === 0) return null;
                    
                    return (
                      <div key={`hidden-${category}`} className="mb-6 category-transition">
                        <div className={`mb-3 px-3 py-2 rounded-md ${
                          theme === 'dark' 
                            ? 'bg-theme-layer-dark' 
                            : 'bg-light-layer-light'
                        }`}>
                          <h3 className={`text-sm font-medium flex items-center ${
                            theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                          }`}>
                            <span>{category}</span>
                            <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-full ${
                              theme === 'dark' 
                                ? 'bg-theme-layer-lighter text-theme-text-dark' 
                                : 'bg-light-layer-darker text-white'
                            }`}>
                              {hiddenTools.length}
                            </span>
                          </h3>
                        </div>
                        
                        <DraggableToolsList 
                          tools={hiddenTools}
                          category={category}
                          visibility={visibility}
                          favorites={favorites}
                          toggleVisibility={toggleVisibility}
                          handleToolClick={handleToolClick}
                          handleFavorite={handleFavorite}
                          onOrderChange={(newTools) => {
                            // Create a deep copy of the current tools array to avoid mutation issues
                            const currentTools = JSON.parse(JSON.stringify(tools));
                            
                            // Get tool IDs in their new order
                            const orderedIds = newTools.map(tool => tool.id);
                            
                            // Find tools in this category that are hidden
                            const hiddenCategoryTools = currentTools.filter(
                              (tool: Tool) => tool.category === category && visibility[tool.id]
                            );
                            const otherTools = currentTools.filter(
                              (tool: Tool) => !(tool.category === category && visibility[tool.id])
                            );
                            
                            // Sort the hidden category tools according to the new order
                            hiddenCategoryTools.sort((a: Tool, b: Tool) => {
                              const aIndex = orderedIds.indexOf(a.id);
                              const bIndex = orderedIds.indexOf(b.id);
                              
                              // If both are in the ordered list, sort by their position
                              if (aIndex !== -1 && bIndex !== -1) {
                                return aIndex - bIndex;
                              }
                              
                              // If only one is in the list, prioritize it
                              if (aIndex !== -1) return -1;
                              if (bIndex !== -1) return 1;
                              
                              // Otherwise keep original order
                              return 0;
                            });
                            
                            // Combine the sorted category tools with the other tools
                            const sortedTools = [...hiddenCategoryTools, ...otherTools];
                            
                            // Update the tools state with the new order
                            setTools(sortedTools);
                            
                            // Save custom tools to localStorage for persistence
                            const customTools = sortedTools.filter(tool => tool.id.startsWith('custom-'));
                            if (customTools.length > 0) {
                              localStorage.setItem('customTools', JSON.stringify(customTools));
                            }
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className={`text-center py-8 rounded-md ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter bg-opacity-50 text-theme-text-dark' 
                      : 'bg-light-layer-light text-light-text-light'
                  }`}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1} 
                      stroke="currentColor" 
                      className="w-12 h-12 mx-auto mb-3 opacity-30"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <p className="text-lg">No hidden tools</p>
                    <p className="text-sm opacity-70 mt-1">All your tools are visible</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Section */}
          {showControls && (
            <ToolControls
              newTool={newTool}
              handleNewToolChange={handleNewToolChange}
              addNewTool={addNewTool}
              newCategory={newCategory}
              setNewCategory={setNewCategory}
              addNewCategory={addNewCategory}
              resetLayout={resetLayout}
              allCategoriesForDropdown={allCategoriesForDropdown}
              saveLayout={(name: string) => saveSettings(name)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ToolsList;
