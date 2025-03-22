import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db, analytics } from '../firebase.config';
import './ToolsList.css'
import { logEvent } from "firebase/analytics";
import { ArrowDownCircleIcon, ArrowUpCircleIcon, AdjustmentsHorizontalIcon, BookmarkIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import ToolItem from './ToolItem';
import ToolControls from './ToolControls';
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
  
  useEffect(() => {
    // Track page view
    if (analytics) {
      logEvent(analytics, 'page_view', { page_path: '/' });
    }

    const fetchData = async () => {
      setIsLoading(true);
      
      // Placeholder data removed for production
      
      // Get custom tools from localStorage
      const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
      
      try {
        // Check if Firestore is properly initialized
        if (!db) {
          console.error('Firestore is not initialized');
          throw new Error('Firestore is not initialized');
        }
        
        // Attempt to fetch from Firestore
        console.log('Fetching data from Firestore collection "tools"');
        const querySnapshot = await getDocs(collection(db, 'tools'));
        console.log('Firestore query successful, documents count:', querySnapshot.docs.length);
        
        const toolsArray = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Combine fetched tools with custom tools
        const combinedTools = [...toolsArray, ...customTools];
        processTools(combinedTools);
        
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        
        // Use custom tools if available
        if (customTools.length > 0) {
          // Use custom tools only
          console.log('Using custom tools from localStorage');
          processTools(customTools);
        } else {
          // Show empty state
          console.log('No data available - showing empty state');
          processTools([]);
        }
      } finally {
        // Load saved settings from localStorage
        try {
          const savedVisibility = localStorage.getItem('visibility');
          if (savedVisibility) {
            setVisibility(JSON.parse(savedVisibility));
          }
          
          const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
          setCustomCategories(savedCustomCategories);
        } catch (e) {
          console.error('Error loading saved settings:', e);
        }
        
        setIsLoading(false);
      }
    };

    fetchData();
  }, [processTools]);

  useEffect(() => {
    const fetchData = async () => {
      const grouped: Record<string, Tool[]> = {};
      tools.forEach((tool: Tool) => {
        const { category = 'Uncategorized' } = tool;
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(tool);
        grouped[category].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      });
      setGroupedTools(grouped);
    };

    fetchData();
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
  
  const handleFavorite = async (toolId: string) => {
    try {
      // Toggle favorite status
      const isFavorited = favorites[toolId];
      const newFavorites = { ...favorites, [toolId]: !isFavorited };
      setFavorites(newFavorites);
      
      // Update local state first
      setTools(prevTools => 
        prevTools.map(tool => 
          tool.id === toolId 
            ? { ...tool, upvotes: (tool.upvotes || 0) + (isFavorited ? -1 : 1) } 
            : tool
        )
      );
      
      // Log the favorite action if analytics is available
      if (analytics) {
        logEvent(analytics, isFavorited ? 'unfavorite_tool' : 'favorite_tool', { tool_id: toolId });
      }
      
      // Skip Firestore updates for custom tools
      if (toolId.startsWith('custom-')) {
        return; // Exit early for custom tools
      }
      
      // Only attempt Firestore update if db is available
      if (db) {
        try {
          console.log(`Updating Firestore for tool ${toolId}`);
          const toolRef = doc(db, 'tools', toolId);
          
          // Increment or decrement upvotes in Firestore
          await updateDoc(toolRef, {
            upvotes: increment(isFavorited ? -1 : 1)
          });
          console.log(`Firestore update successful for tool ${toolId}`);
        } catch (firestoreError) {
          console.error('Firestore update error:', firestoreError);
          // We don't revert the local state here because we want the app to work offline
        }
      } else {
        console.log('Skipping Firestore update - Firestore not available');
      }
    } catch (error) {
      console.error('Error in handleFavorite:', error);
      // Revert the change in favorites if there's an error in the main function
      setFavorites(prev => ({ ...prev, [toolId]: prev[toolId] }));
    }
  };

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

  const saveSettings = (layoutName?: string) => {
    const customTools = tools.filter(tool => tool.id.startsWith('custom-'));
    const settings = {
      visibility,
      customTools,
      customCategories
    };
    const data = JSON.stringify(settings);
    
    // Save to local storage with name if provided
    if (layoutName) {
      const newLayout = { name: layoutName, data: data };
      const updatedLayouts = [...savedLayouts, newLayout];
      setSavedLayouts(updatedLayouts);
      localStorage.setItem('savedLayouts', JSON.stringify(updatedLayouts));
      return;
    }
    
    // Download file to users computer
    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "tools_layout_settings.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href); // Clean up
  };

  const loadLayout = (layoutData: string) => {
    try {
      const data = JSON.parse(layoutData);
      if (data.visibility) {
        setVisibility(data.visibility);
      }
      if (data.customTools) {
        const combinedTools = [...tools.filter(tool => !tool.id.startsWith('custom-')), ...data.customTools];
        setTools(combinedTools);
      }
      if (data.customCategories) {
        setCustomCategories(data.customCategories);
      }

      localStorage.setItem('customTools', JSON.stringify(data.customTools || []));
      localStorage.setItem('customCategories', JSON.stringify(data.customCategories || []));
    } catch (error) {
      console.error("Error loading layout:", error);
    }
  };

  const loadSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const layoutData = e.target?.result as string;
          loadLayout(layoutData);
        } catch (error) {
          console.error("Error reading file:", error);
        }
      };
      reader.readAsText(file);
    }
  };
  
  const deleteLayout = (index: number) => {
    const updatedLayouts = [...savedLayouts];
    updatedLayouts.splice(index, 1);
    setSavedLayouts(updatedLayouts);
    localStorage.setItem('savedLayouts', JSON.stringify(updatedLayouts));
  };

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
  
  // Filter tools based on search term and active category
  const filteredTools = useMemo(() => {
    let result = {...groupedTools};
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      Object.keys(result).forEach(category => {
        result[category] = result[category].filter(tool => 
          tool.name.toLowerCase().includes(lowerSearchTerm) 
        );
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
    return Object.keys(filteredTools).filter(category => filteredTools[category].length > 0);
  }, [filteredTools]);

  return (
    <div className="pt-4">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse flex space-x-4">
            <div className={`h-12 w-12 rounded-full ${
              theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-darker'
            }`}></div>
            <div className="space-y-4 flex-1">
              <div className={`h-4 rounded w-3/4 ${
                theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-darker'
              }`}></div>
              <div className={`h-4 rounded w-1/2 ${
                theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-darker'
              }`}></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Control Bar */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 p-3 rounded-sm ${
            theme === 'dark' 
              ? 'border border-theme-text-dark/30' 
              : 'border border-light-text-dark/30'
          }`}>
            {/* Search Bar */}
            <div className="flex items-center mb-3 sm:mb-0 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`text-sm rounded-sm px-2 py-1.5 w-full sm:w-60 ${
                  theme === 'dark' 
                    ? 'border-theme-layer-lightest bg-theme-layer-lighter text-theme-text-light' 
                    : 'border-light-border-dark bg-white text-light-text-dark'
                }`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className={`ml-2 ${
                  theme === 'dark' 
                    ? 'text-theme-text-dark hover:text-theme-text-light' 
                    : 'text-light-text-light hover:text-light-text-dark'
                }`}>
                  <span className="sr-only">Clear</span>×
                </button>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-sm px-2 py-1.5 text-sm flex items-center ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                    : 'bg-light-layer-lighter hover:bg-light-layer-dark hover:text-white'
                }`}
                onClick={() => setShowControls(!showControls)}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                <span>Edit</span>
              </button>

              <button
                className={`rounded-sm px-2 py-1.5 text-sm flex items-center ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                    : 'bg-light-layer-lighter hover:bg-light-layer-dark hover:text-white'
                }`}
                onClick={() => saveSettings()}
              >
                <BookmarkIcon className="w-4 h-4 mr-1" />
                <span>Export</span>
              </button>

              <div className="relative inline-block">
                <span className={`flex rounded-sm px-2 py-1.5 text-sm ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest' 
                    : 'bg-light-layer-lighter hover:bg-light-layer-dark hover:text-white'
                }`}>
                  <span className="flex items-center mr-2">Import</span>
                  <input className="cursor-pointer w-20" type="file" onChange={loadSettings} />
                </span>
              </div>

              <button
                className={`rounded-sm px-2 py-1.5 text-sm flex items-center ${
                  theme === 'dark' 
                    ? 'bg-theme-layer-lighter hover:bg-theme-layer-lightest text-theme-red' 
                    : 'bg-light-layer-lighter hover:bg-light-layer-dark text-theme-red hover:text-white'
                }`}
                onClick={resetLayout}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Saved Layouts */}
          {savedLayouts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm mb-2 opacity-80">Saved Layouts</h3>
              <div className="flex flex-wrap gap-2">
                {savedLayouts.map((layout, index) => (
                  <div
                    key={index}
                    className={`rounded-sm px-2 py-1 flex items-center ${
                      theme === 'dark'
                        ? 'bg-theme-layer-darker'
                        : 'bg-light-layer-light'
                    }`}
                  >
                    <button
                      onClick={() => loadLayout(layout.data)}
                      className="text-sm hover:opacity-80 mr-2"
                    >
                      {layout.name}
                    </button>
                    <button
                      onClick={() => deleteLayout(index)}
                      className="text-xs opacity-60 hover:text-theme-red"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs - Optimized for touch and better scrolling */}
          {filteredCategories.length > 0 && (
            <div className="mb-4">
              <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
                <button
                  className={`mr-2 px-3 py-1.5 text-sm whitespace-nowrap rounded-sm ${
                    activeCategory === null
                      ? theme === 'dark'
                          ? "bg-theme-layer-lighter text-theme-text-light"
                          : "bg-light-layer-lighter text-light-text-dark"
                      : theme === 'dark'
                          ? "text-theme-text-dark hover:text-theme-text-base hover:bg-theme-layer-darker"
                          : "text-light-text-light hover:text-light-text-base hover:bg-light-layer-light"
                  }`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  All Categories
                </button>
                {filteredCategories.map((category) => (
                  <button
                    key={category}
                    className={`mr-2 px-3 py-1.5 text-sm whitespace-nowrap rounded-sm ${
                      activeCategory === category
                        ? theme === 'dark'
                            ? "bg-theme-layer-lighter text-theme-text-light"
                            : "bg-light-layer-lighter text-light-text-dark"
                        : theme === 'dark'
                            ? "text-theme-text-dark hover:text-theme-text-base hover:bg-theme-layer-darker"
                            : "text-light-text-light hover:text-light-text-base hover:bg-light-layer-light"
                    }`}
                    onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                    aria-pressed={activeCategory === category}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid - optimized for all screen sizes */}
          <div className="text-theme-text-base gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:hidden">
            {filteredCategories.map((category) => (
              <div key={category} className="mb-5">
                <h2 className={`text-sm mb-2 font-medium ${
                theme === 'dark' ? 'text-theme-text-light opacity-80' : 'text-light-text-dark opacity-80'
              }`}>{category}</h2>
                <div className="space-y-2">
                  {(filteredTools[category] || [])
                    .filter((x) => !visibility[x.id])
                    .map((tool) => (
                      <ToolItem
                        key={tool.id}
                        tool={tool}
                        toggleVisibility={toggleVisibility}
                        isVisible={!visibility[tool.id]}
                        handleToolClick={handleToolClick}
                        handleFavorite={handleFavorite}
                        isFavorited={favorites[tool.id]}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fixed width layout for large screens */}
          <div className="hidden lg:flex lg:flex-wrap gap-3">
            {filteredCategories.map((category) => (
              <div key={category} className="mb-5 w-64">
                <h2 className={`text-sm mb-2 font-medium ${
                theme === 'dark' ? 'text-theme-text-light opacity-80' : 'text-light-text-dark opacity-80'
              }`}>{category}</h2>
                <div className="space-y-2">
                  {(filteredTools[category] || [])
                    .filter((x) => !visibility[x.id])
                    .map((tool) => (
                      <ToolItem
                        key={tool.id}
                        tool={tool}
                        toggleVisibility={toggleVisibility}
                        isVisible={!visibility[tool.id]}
                        handleToolClick={handleToolClick}
                        handleFavorite={handleFavorite}
                        isFavorited={favorites[tool.id]}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Hidden Apps Section */}
          <div>
            <p className={`text-sm flex items-center pt-4 pb-2 ${
              theme === 'dark' ? 'text-theme-text-light opacity-70' : 'text-light-text-dark opacity-70'
            }`}>
              Hidden apps
              <button 
                onClick={() => setHiddens(!hiddens)}
                className="ml-2 focus:outline-none"
                aria-label={hiddens ? "Hide hidden apps" : "Show hidden apps"}
              >
                {hiddens ? (
                  <ArrowUpCircleIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownCircleIcon className="w-4 h-4" />
                )}
              </button>
            </p>

            {hiddens && (
              <>
                {/* Responsive grid for smaller screens */}
                <div className="text-theme-text-base pt-3 gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:hidden">
                  {filteredCategories.map((category) => (
                    <div key={category} className="mb-4">
                      <h2 className={`text-sm mb-4 lowercase ${
                        theme === 'dark' ? 'text-theme-text-light opacity-80' : 'text-light-text-dark opacity-80'
                      }`}>{category}</h2>
                      <div className="space-y-2">
                        {(filteredTools[category] || [])
                          .filter((x) => visibility[x.id])
                          .map((tool) => (
                            <ToolItem
                              key={tool.id}
                              tool={tool}
                              toggleVisibility={toggleVisibility}
                              isVisible={!visibility[tool.id]}
                              handleToolClick={handleToolClick}
                              handleFavorite={handleFavorite}
                              isFavorited={favorites[tool.id]}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fixed width layout for large screens */}
                <div className="hidden lg:flex lg:flex-wrap gap-3 pt-3">
                  {filteredCategories.map((category) => (
                    <div key={category} className="mb-4 w-64">
                      <h2 className={`text-sm mb-4 lowercase ${
                        theme === 'dark' ? 'text-theme-text-light opacity-80' : 'text-light-text-dark opacity-80'
                      }`}>{category}</h2>
                      <div className="space-y-2">
                        {(filteredTools[category] || [])
                          .filter((x) => visibility[x.id])
                          .map((tool) => (
                            <ToolItem
                              key={tool.id}
                              tool={tool}
                              toggleVisibility={toggleVisibility}
                              isVisible={!visibility[tool.id]}
                              handleToolClick={handleToolClick}
                              handleFavorite={handleFavorite}
                              isFavorited={favorites[tool.id]}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
