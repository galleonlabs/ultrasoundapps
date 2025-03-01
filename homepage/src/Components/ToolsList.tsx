import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db, analytics } from '../main.tsx';
import './ToolsList.css'
import { logEvent } from "firebase/analytics";
import { classNames } from '../utils/index.tsx';
import { ArrowDownCircleIcon, ArrowUpCircleIcon, AdjustmentsHorizontalIcon, BookmarkIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import ToolItem from './ToolItem';
import ToolControls from './ToolControls';

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
    logEvent(analytics, 'page_view', { page_path: '/' });

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'tools'));
        const toolsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
        const combinedTools = [...toolsArray, ...customTools];
        processTools(combinedTools);
        
        const savedVisibility = localStorage.getItem('visibility');
        if (savedVisibility) {
          setVisibility(JSON.parse(savedVisibility));
        }

        const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
        setCustomCategories(savedCustomCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Fallback to local data only if Firestore fails
        const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
        if (customTools.length > 0) {
          processTools(customTools);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [processTools]);

  useEffect(() => {
    const fetchData = async () => {
      const grouped: Record<string, any[]> = {};
      tools.forEach((tool: any) => {
        const { category = 'Uncategorized' } = tool;
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(tool);
        grouped[category].sort((a, b) => b.upvotes - a.upvotes);
      });
      setGroupedTools(grouped);
    };

    fetchData();
  }, [tools]);

  useEffect(() => {
    localStorage.setItem('visibility', JSON.stringify(visibility));
  }, [visibility]);

  const handleToolClick = (toolName: string) => {
    logEvent(analytics, 'select_tool', { name: toolName });
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
      
      // Only update Firestore for non-custom tools
      if (!toolId.startsWith('custom-')) {
        // Get the current tool
        const toolRef = doc(db, 'tools', toolId);
        
        // Increment or decrement upvotes in Firestore
        await updateDoc(toolRef, {
          upvotes: increment(isFavorited ? -1 : 1)
        });
        
        // Update local state
        setTools(prevTools => 
          prevTools.map(tool => 
            tool.id === toolId 
              ? { ...tool, upvotes: (tool.upvotes || 0) + (isFavorited ? -1 : 1) } 
              : tool
          )
        );
      } else {
        // For custom tools, just update local state
        setTools(prevTools => 
          prevTools.map(tool => 
            tool.id === toolId 
              ? { ...tool, upvotes: (tool.upvotes || 0) + (isFavorited ? -1 : 1) } 
              : tool
          )
        );
      }
      
      // Log the favorite action
      logEvent(analytics, isFavorited ? 'unfavorite_tool' : 'favorite_tool', { tool_id: toolId });
    } catch (error) {
      console.error('Error updating favorites:', error);
      // Revert the change in favorites if there's an error
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

  const loadSettings = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const layoutData = e.target.result;
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

  const handleNewToolChange = (e: any) => {
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
            <div className="h-12 w-12 bg-theme-layer-lighter rounded-full"></div>
            <div className="space-y-4 flex-1">
              <div className="h-4 bg-theme-layer-lighter rounded w-3/4"></div>
              <div className="h-4 bg-theme-layer-lighter rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-theme-layer-darker bg-opacity-30 p-4 rounded-sm border border-theme-border-lighter">
            {/* Search Bar */}
            <div className="flex items-center mb-4 sm:mb-0 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border text-sm border-theme-layer-lightest bg-theme-layer-lighter bg-opacity-50 text-theme-text-light rounded-sm px-2 py-1 mr-2 w-full sm:w-64"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-theme-text-dark hover:text-theme-text-light">
                  <span className="sr-only">Clear</span>×
                </button>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                className="border hover:shadow-[1px_1px_0px_#ffffff] border-theme-layer-lightest rounded-sm px-2 py-1 text-sm flex items-center"
                onClick={() => setShowControls(!showControls)}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                <span>Edit</span>
              </button>

              <button
                className="border hover:shadow-[1px_1px_0px_#ffffff] border-theme-layer-lightest rounded-sm px-2 py-1 text-sm flex items-center"
                onClick={() => saveSettings()}
              >
                <BookmarkIcon className="w-4 h-4 mr-1" />
                <span>Export</span>
              </button>

              <div className="relative inline-block">
                <span className="flex border hover:shadow-[1px_1px_0px_#ffffff] border-theme-layer-lightest rounded-sm px-2 py-1 text-sm">
                  <span className="flex items-center mr-2">Import</span>
                  <input className="cursor-pointer w-24" type="file" onChange={loadSettings} />
                </span>
              </div>

              <button
                className="border hover:shadow-[1px_1px_0px_#ffffff] border-theme-layer-lightest rounded-sm px-2 py-1 text-sm flex items-center text-theme-red"
                onClick={resetLayout}
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Saved Layouts */}
          {savedLayouts.length > 0 && (
            <div className="mb-6 border-b border-theme-border-lighter pb-4">
              <h3 className="text-md mb-3 font-medium">Saved Layouts</h3>
              <div className="flex flex-wrap gap-2">
                {savedLayouts.map((layout, index) => (
                  <div
                    key={index}
                    className="border border-theme-border-lighter rounded-sm px-3 py-1 flex items-center bg-theme-layer-darker"
                  >
                    <button
                      onClick={() => loadLayout(layout.data)}
                      className="text-sm hover:text-theme-text-light mr-2"
                    >
                      {layout.name}
                    </button>
                    <button
                      onClick={() => deleteLayout(index)}
                      className="text-xs text-theme-text-dark hover:text-theme-red"
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
            <div className="mb-4 sm:mb-6 border-b border-theme-border-lighter">
              <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button
                  className={`mr-3 px-3 py-2 text-sm whitespace-nowrap rounded-t-sm ${
                    activeCategory === null
                      ? "text-theme-text-light border-b-2 border-theme-text-light font-medium"
                      : "text-theme-text-dark hover:text-theme-text-base"
                  }`}
                  onClick={() => setActiveCategory(null)}
                  aria-pressed={activeCategory === null}
                >
                  All Categories
                </button>
                {filteredCategories.map((category) => (
                  <button
                    key={category}
                    className={`mr-3 px-3 py-2 text-sm whitespace-nowrap rounded-t-sm ${
                      activeCategory === category
                        ? "text-theme-text-light border-b-2 border-theme-text-light font-medium"
                        : "text-theme-text-dark hover:text-theme-text-base"
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
          <div className="text-theme-text-base gap-3 sm:gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredCategories.map((category) => (
              <div key={category} className="mb-6 border-l border-theme-border-lighter pl-3 sm:pl-4">
                <h2 className="text-md mb-3 sm:mb-4 lowercase font-medium">{category}</h2>
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
            <p className="text-md flex leading-tight font-wigrum pt-6 pb-2 border-t border-theme-border-lighter">
              hidden apps
              {hiddens ? (
                <ArrowUpCircleIcon
                  onClick={() => setHiddens(!hiddens)}
                  className={classNames(
                    "group ml-2 translate-y-1 flex w-4 h-4 border-0 hover:text-gray-400 hover:cursor-pointer items-center justify-center text-theme-white"
                  )}
                />
              ) : (
                <ArrowDownCircleIcon
                  onClick={() => setHiddens(!hiddens)}
                  className={classNames(
                    "group ml-2 translate-y-1 flex w-4 h-4 border-0 hover:text-gray-400 hover:cursor-pointer items-center justify-center text-theme-white"
                  )}
                />
              )}
            </p>

            {hiddens && (
              <div className="text-theme-text-base pt-4 gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {filteredCategories.map((category) => (
                  <div key={category} className="mb-4 border-l border-theme-border-lighter pl-4">
                    <h2 className="text-md mb-4 lowercase">{category}</h2>
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
                          />
                        ))}
                    </div>
                  </div>
                ))}
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
