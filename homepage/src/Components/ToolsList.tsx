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
    
    // Filter out unwanted tools
    const toolsToRemove = [
      'CoinTracker', 'Coinstats', 'Delta', 'Zapper', 'Koinly', 'Zerion', 
      'Marinade Finance', 'Figment', 'Staked', 'Ankr', 'Stakewise', 
      'Portal Bridge', 'Ankr Staking', 'Frax Ether'
    ];
    
    const filteredTools = tools.filter(tool => 
      !toolsToRemove.includes(tool.name)
    );
    
    // Use a more efficient approach with a single iteration
    const grouped: Record<string, Tool[]> = {};
    
    // Group tools by category with category merging
    filteredTools.forEach((tool: Tool) => {
      let category = tool.category || 'Uncategorized';
      
      // Merge Staking and Liquid Staking
      if (category === 'Liquid Staking' || category === 'Staking') {
        category = 'Staking';
      }
      
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
          <div className={`mb-6 rounded-lg shadow-lg ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-theme-layer-dark to-theme-layer-darker border border-theme-layer-lighter/20' 
              : 'bg-white shadow-md border border-light-border-dark/20'
          }`}>
            {/* Enhanced Search Bar - Full Width on Mobile */}
            <div className={`p-4 border-b ${
              theme === 'dark' ? 'border-theme-layer-lighter/20' : 'border-light-border-dark/20'
            }`}>
              <div className="flex items-center relative">
                <div className={`absolute left-4 text-sm ${
                  theme === 'dark' 
                    ? 'text-theme-text-dark' 
                    : 'text-light-text-light'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search apps by name, category or website..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`text-base rounded-lg pl-12 pr-12 py-3 w-full transition-all focus:outline-none focus:ring-2 ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-base border border-theme-layer-lighter text-theme-text-light placeholder-theme-text-dark focus:ring-theme-purple/50 focus:border-theme-purple' 
                      : 'bg-light-layer-lighter border border-light-border-dark text-light-text-dark placeholder-light-text-light focus:ring-theme-pan-sky/50 focus:border-theme-pan-sky'
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
              <button
                className={`rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center transition-all ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-base hover:bg-theme-layer-lighter text-theme-text-light border border-theme-layer-lighter' 
                    : 'bg-light-layer-lighter hover:bg-light-layer-light text-light-text-dark border border-light-border-dark'
                }`}
                onClick={() => setShowControls(!showControls)}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1.5" />
                <span>Edit Layout</span>
              </button>

              <button
                className={`rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center transition-all ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-base hover:bg-theme-layer-lighter text-theme-text-light border border-theme-layer-lighter' 
                    : 'bg-light-layer-lighter hover:bg-light-layer-light text-light-text-dark border border-light-border-dark'
                }`}
                onClick={() => saveSettings()}
              >
                <BookmarkIcon className="w-4 h-4 mr-1.5" />
                <span>Export</span>
              </button>

              <div className="relative">
                <label 
                  className={`flex rounded-lg px-3 py-2.5 text-sm font-medium items-center justify-center cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-base hover:bg-theme-layer-lighter text-theme-text-light border border-theme-layer-lighter' 
                      : 'bg-light-layer-lighter hover:bg-light-layer-light text-light-text-dark border border-light-border-dark'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
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
                className={`rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center transition-all ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-base hover:bg-theme-red/20 text-theme-red border border-theme-red/30 hover:border-theme-red' 
                    : 'bg-light-layer-lighter hover:bg-theme-red/10 text-theme-red border border-theme-red/30 hover:border-theme-red'
                }`}
                onClick={resetLayout}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1.5" />
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
            <div className="mb-8">
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
              }`}>Browse by Category</h3>
              
              {/* Desktop Category Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-2">
                <button
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap rounded-lg transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
                    activeCategory === null
                      ? theme === 'dark'
                          ? "bg-gradient-to-r from-theme-purple/30 to-theme-purple/20 border border-theme-purple/50 text-theme-text-light"
                          : "bg-gradient-to-r from-theme-pan-sky/30 to-theme-pan-sky/20 border border-theme-pan-sky/50 text-light-text-dark"
                      : theme === 'dark'
                          ? "bg-theme-layer-lighter border border-theme-layer-lightest text-theme-text-base hover:bg-theme-layer-lightest hover:text-theme-text-light hover:border-theme-purple/50"
                          : "bg-white border border-light-border-dark text-light-text-base hover:bg-light-layer-lighter hover:text-light-text-dark hover:border-theme-pan-sky/50"
                  }`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                    All Categories
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 font-semibold ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-dark text-theme-text-light' 
                      : 'bg-light-layer-light text-light-text-dark'
                  }`}>
                    {Object.values(groupedTools).reduce((sum, tools) => sum + tools.filter(t => !visibility[t.id]).length, 0)}
                  </span>
                </button>
                
                {Object.keys(groupedTools).sort((a, b) => {
                  // Sort by visible count, then alphabetically
                  const countA = (groupedTools[a] || []).filter(t => !visibility[t.id]).length;
                  const countB = (groupedTools[b] || []).filter(t => !visibility[t.id]).length;
                  if (countB !== countA) return countB - countA;
                  return a.localeCompare(b);
                }).map((category) => {
                  const visibleCount = (groupedTools[category] || []).filter(t => !visibility[t.id]).length;
                  const categoryIcons: Record<string, string> = {
                    'DEXs': 'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z',
                    'Analytics': 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
                    'Portfolio': 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z',
                    'Exchanges': 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
                    'Staking': 'M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Z',
                    'Bridges': 'M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
                    'NFTs': 'M2.25 15.75 5.159 5.159a2.25 2.25 0 0 1 3.182-1.341l8.684 8.684a2.25 2.25 0 0 1-1.341 3.182L5.25 18.75A2.25 2.25 0 0 1 2.25 15.75ZM16.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z'
                  };
                  const defaultIcon = 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Z';
                  
                  return (
                    <button
                      key={category}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap rounded-lg transition-all flex items-center justify-between shadow-sm hover:shadow-md ${
                        activeCategory === category
                          ? theme === 'dark'
                              ? "bg-gradient-to-r from-theme-purple/30 to-theme-purple/20 border border-theme-purple/50 text-theme-text-light"
                              : "bg-gradient-to-r from-theme-pan-sky/30 to-theme-pan-sky/20 border border-theme-pan-sky/50 text-light-text-dark"
                          : theme === 'dark'
                              ? "bg-theme-layer-lighter border border-theme-layer-lightest text-theme-text-base hover:bg-theme-layer-lightest hover:text-theme-text-light hover:border-theme-purple/50"
                              : "bg-white border border-light-border-dark text-light-text-base hover:bg-light-layer-lighter hover:text-light-text-dark hover:border-theme-pan-sky/50"
                      } ${visibleCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => visibleCount > 0 && setActiveCategory(activeCategory === category ? null : category)}
                      aria-pressed={activeCategory === category}
                      disabled={visibleCount === 0}
                    >
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d={categoryIcons[category] || defaultIcon} />
                        </svg>
                        {category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ml-2 font-semibold ${
                        theme === 'dark' 
                          ? 'bg-theme-layer-dark text-theme-text-light' 
                          : 'bg-light-layer-light text-light-text-dark'
                      }`}>
                        {visibleCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile Horizontal Scrolling Tabs */}
              <div className="md:hidden overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 flex">
                <button
                  className={`mr-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg flex items-center shadow-sm ${
                    activeCategory === null
                      ? theme === 'dark'
                          ? "bg-gradient-to-r from-theme-purple/30 to-theme-purple/20 border border-theme-purple/50 text-theme-text-light"
                          : "bg-gradient-to-r from-theme-pan-sky/30 to-theme-pan-sky/20 border border-theme-pan-sky/50 text-light-text-dark"
                      : theme === 'dark'
                          ? "bg-theme-layer-lighter border border-theme-layer-lightest text-theme-text-base"
                          : "bg-white border border-light-border-dark text-light-text-base"
                  }`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  <span>All</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 font-semibold ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-dark text-theme-text-light' 
                      : 'bg-light-layer-light text-light-text-dark'
                  }`}>
                    {Object.values(groupedTools).reduce((sum, tools) => sum + tools.filter(t => !visibility[t.id]).length, 0)}
                  </span>
                </button>
                
                {Object.keys(groupedTools).sort((a, b) => {
                  const countA = (groupedTools[a] || []).filter(t => !visibility[t.id]).length;
                  const countB = (groupedTools[b] || []).filter(t => !visibility[t.id]).length;
                  if (countB !== countA) return countB - countA;
                  return a.localeCompare(b);
                }).map((category) => {
                  const visibleCount = (groupedTools[category] || []).filter(t => !visibility[t.id]).length;
                  if (visibleCount === 0) return null;
                  
                  return (
                    <button
                      key={category}
                      className={`mr-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg flex items-center shadow-sm ${
                        activeCategory === category
                          ? theme === 'dark'
                              ? "bg-gradient-to-r from-theme-purple/30 to-theme-purple/20 border border-theme-purple/50 text-theme-text-light"
                              : "bg-gradient-to-r from-theme-pan-sky/30 to-theme-pan-sky/20 border border-theme-pan-sky/50 text-light-text-dark"
                          : theme === 'dark'
                              ? "bg-theme-layer-lighter border border-theme-layer-lightest text-theme-text-base"
                              : "bg-white border border-light-border-dark text-light-text-base"
                      }`}
                      onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                      aria-pressed={activeCategory === category}
                    >
                      <span>{category}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ml-2 font-semibold ${
                        theme === 'dark' 
                          ? 'bg-theme-layer-dark text-theme-text-light' 
                          : 'bg-light-layer-light text-light-text-dark'
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
          <div className="text-theme-text-base space-y-10">
            {filteredCategories.map((category) => (
              <div key={category} className="category-transition">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl md:text-2xl font-bold ${
                    theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                  }`}>
                    {category}
                  </h2>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter text-theme-text-base' 
                      : 'bg-light-layer-light text-light-text-base'
                  }`}>
                    {(filteredTools[category] || []).filter(x => !visibility[x.id]).length} apps
                  </span>
                </div>
                
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
