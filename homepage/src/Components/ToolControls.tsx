import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ToolControlsProps {
  newTool: { name: string; logo: string; website: string; category: string };
  handleNewToolChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  addNewTool: () => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  addNewCategory: () => void;
  resetLayout: () => void;
  allCategoriesForDropdown: string[];
  saveLayout?: (name: string) => void;
}

const ToolControls: React.FC<ToolControlsProps> = ({ 
  newTool, 
  handleNewToolChange, 
  addNewTool, 
  newCategory, 
  setNewCategory, 
  addNewCategory, 
  allCategoriesForDropdown,
  resetLayout,
  saveLayout 
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'categories' | 'layouts'>('tools');
  const [layoutName, setLayoutName] = useState('');
  const { theme } = useTheme();

  const inputClasses = `w-full text-sm rounded-sm px-2 py-1.5 ${
    theme === "dark"
      ? "border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light"
      : "border-light-border-dark bg-white text-light-text-dark"
  }`;

  const buttonClasses = `text-sm rounded-sm px-3 py-1.5 transition-colors ${
    theme === "dark"
      ? "bg-theme-layer-lightest text-theme-text-light hover:bg-theme-layer-base"
      : "bg-light-layer-lighter text-light-text-dark hover:bg-light-layer-dark hover:text-white"
  }`;

  const disabledButtonClasses = "opacity-50 cursor-not-allowed";

  return (
    <div className={`mt-8 pt-6 pb-4 border-t ${
      theme === "dark" 
        ? "border-theme-border-lighter border-opacity-30" 
        : "border-light-border-dark"
    }`}>
      <h2 className={`text-base md:text-lg mb-4 font-medium ${
        theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
      }`}>Customize Your Dashboard</h2>
      
      {/* Enhanced Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button 
          className={`px-3 py-2 text-sm rounded-md flex items-center ${
            activeTab === 'tools' 
              ? theme === 'dark'
                ? 'bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light' 
                : 'bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark'
              : theme === 'dark'
                ? 'border border-theme-layer-lightest text-theme-text-dark hover:text-theme-text-base hover:border-theme-purple'
                : 'border border-light-border-dark text-light-text-light hover:text-light-text-dark hover:border-theme-pan-sky'
          }`}
          onClick={() => setActiveTab('tools')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Tool
        </button>
        <button 
          className={`px-3 py-2 text-sm rounded-md flex items-center ${
            activeTab === 'categories' 
              ? theme === 'dark'
                ? 'bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light' 
                : 'bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark'
              : theme === 'dark'
                ? 'border border-theme-layer-lightest text-theme-text-dark hover:text-theme-text-base hover:border-theme-purple'
                : 'border border-light-border-dark text-light-text-light hover:text-light-text-dark hover:border-theme-pan-sky'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          </svg>
          Categories
        </button>
        {saveLayout && (
          <button 
            className={`px-3 py-2 text-sm rounded-md flex items-center ${
              activeTab === 'layouts' 
                ? theme === 'dark'
                  ? 'bg-theme-purple bg-opacity-20 border border-theme-purple border-opacity-30 text-theme-text-light' 
                  : 'bg-theme-pan-sky bg-opacity-20 border border-theme-pan-sky border-opacity-30 text-light-text-dark'
                : theme === 'dark'
                  ? 'border border-theme-layer-lightest text-theme-text-dark hover:text-theme-text-base hover:border-theme-purple'
                  : 'border border-light-border-dark text-light-text-light hover:text-light-text-dark hover:border-theme-pan-sky'
            }`}
            onClick={() => setActiveTab('layouts')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Save Layout
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'tools' && (
        <div className="px-1">
          <div className={`mb-4 p-3 rounded-md ${
            theme === 'dark' 
              ? 'bg-theme-layer-dark bg-opacity-50' 
              : 'bg-light-layer-light bg-opacity-50'
          }`}>
            <p className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
            }`}>Add a new tool to your dashboard</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-xs mb-1.5 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>Tool Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Uniswap"
                  value={newTool.name}
                  onChange={handleNewToolChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1.5 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>Website URL</label>
                <input
                  type="text"
                  name="website"
                  placeholder="e.g., https://app.uniswap.org"
                  value={newTool.website}
                  onChange={handleNewToolChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1.5 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>Logo URL</label>
                <input
                  type="text"
                  name="logo"
                  placeholder="e.g., https://example.com/logo.png"
                  value={newTool.logo}
                  onChange={handleNewToolChange}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1.5 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>Category</label>
                <select
                  onChange={handleNewToolChange}
                  className={inputClasses}
                  name="category"
                  value={newTool.category}
                >
                  <option value="" disabled>Select category</option>
                  {allCategoriesForDropdown.map((category: string) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button 
                onClick={addNewTool} 
                disabled={!newTool.name || !newTool.website || !newTool.logo}
                className={`${buttonClasses} py-2.5 w-full sm:w-auto flex items-center justify-center ${(!newTool.name || !newTool.website || !newTool.logo) ? disabledButtonClasses : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Tool
              </button>
              
              <button 
                onClick={resetLayout} 
                className={`${buttonClasses} py-2.5 w-full sm:w-auto flex items-center justify-center ${
                  theme === "dark" ? "text-theme-red" : "text-theme-red"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Reset Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="px-1">
          <div className={`mb-4 p-3 rounded-md ${
            theme === 'dark' 
              ? 'bg-theme-layer-dark bg-opacity-50' 
              : 'bg-light-layer-light bg-opacity-50'
          }`}>
            <p className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
            }`}>Create a new category</p>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., NFT Marketplaces"
                className={`${inputClasses} sm:mr-2 w-full`}
              />
              <button 
                onClick={addNewCategory} 
                disabled={!newCategory.trim()}
                className={`${buttonClasses} py-2.5 flex items-center justify-center whitespace-nowrap ${!newCategory.trim() ? disabledButtonClasses : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Category
              </button>
            </div>
            
            {allCategoriesForDropdown.length > 0 && (
              <div className="mt-5 pt-4 border-t border-opacity-20 border-gray-500">
                <p className={`text-sm font-medium mb-3 ${
                  theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                }`}>
                  Existing Categories ({allCategoriesForDropdown.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {allCategoriesForDropdown.map(category => (
                    <div key={category} className={`px-3 py-1.5 text-sm rounded-md ${
                      theme === 'dark' 
                        ? 'bg-theme-layer-lighter text-theme-text-base' 
                        : 'bg-light-layer-lighter text-light-text-dark'
                    }`}>
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'layouts' && saveLayout && (
        <div className="px-1">
          <div className={`mb-4 p-3 rounded-md ${
            theme === 'dark' 
              ? 'bg-theme-layer-dark bg-opacity-50' 
              : 'bg-light-layer-light bg-opacity-50'
          }`}>
            <p className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
            }`}>Save your current layout</p>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder="Layout name (e.g., Trading Focus)"
                className={`${inputClasses} sm:mr-2 w-full`}
              />
              <button 
                onClick={() => {
                  if (layoutName.trim()) {
                    saveLayout(layoutName);
                    setLayoutName('');
                  }
                }}
                disabled={!layoutName.trim()}
                className={`${buttonClasses} py-2.5 flex items-center justify-center whitespace-nowrap ${!layoutName.trim() ? disabledButtonClasses : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                Save Layout
              </button>
            </div>
            
            <p className={`mt-4 text-xs ${
              theme === 'dark' ? 'text-theme-text-dark' : 'text-light-text-light'
            }`}>
              Saving your layout will store your current tool visibility settings, custom tools, and custom categories for easy access later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolControls;
