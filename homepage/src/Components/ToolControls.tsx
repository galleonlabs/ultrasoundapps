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
    <div className={`mt-6 pt-3 pb-4 border-t ${
      theme === "dark" 
        ? "border-theme-border-lighter" 
        : "border-light-border-dark"
    }`}>
      {/* Tabs */}
      <div className="flex mb-4">
        <button 
          className={`px-3 py-1.5 text-sm rounded-sm mr-2 ${
            activeTab === 'tools' 
              ? theme === 'dark'
                ? 'bg-theme-layer-lightest text-theme-text-light' 
                : 'bg-light-layer-lighter text-light-text-dark'
              : theme === 'dark'
                ? 'text-theme-text-dark hover:text-theme-text-base'
                : 'text-light-text-light hover:text-light-text-dark'
          }`}
          onClick={() => setActiveTab('tools')}
        >
          Add Tool
        </button>
        <button 
          className={`px-3 py-1.5 text-sm rounded-sm mr-2 ${
            activeTab === 'categories' 
              ? theme === 'dark'
                ? 'bg-theme-layer-lightest text-theme-text-light' 
                : 'bg-light-layer-lighter text-light-text-dark'
              : theme === 'dark'
                ? 'text-theme-text-dark hover:text-theme-text-base'
                : 'text-light-text-light hover:text-light-text-dark'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        {saveLayout && (
          <button 
            className={`px-3 py-1.5 text-sm rounded-sm ${
              activeTab === 'layouts' 
                ? theme === 'dark'
                  ? 'bg-theme-layer-lightest text-theme-text-light' 
                  : 'bg-light-layer-lighter text-light-text-dark'
                : theme === 'dark'
                  ? 'text-theme-text-dark hover:text-theme-text-base'
                  : 'text-light-text-light hover:text-light-text-dark'
            }`}
            onClick={() => setActiveTab('layouts')}
          >
            Save Layout
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'tools' && (
        <div className="px-1">
          <p className='text-sm mb-3'>Add a new tool to your dashboard</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs mb-1 opacity-70">Tool Name</label>
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
              <label className="block text-xs mb-1 opacity-70">Website URL</label>
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
              <label className="block text-xs mb-1 opacity-70">Logo URL</label>
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
              <label className="block text-xs mb-1 opacity-70">Category</label>
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
          <button 
            onClick={addNewTool} 
            disabled={!newTool.name || !newTool.website || !newTool.logo}
            className={`${buttonClasses} ${(!newTool.name || !newTool.website || !newTool.logo) ? disabledButtonClasses : ''}`}
          >
            Add Tool
          </button>
          <button 
            onClick={resetLayout} 
            className={`${buttonClasses} ml-2 ${
              theme === "dark" ? "text-theme-red" : "text-theme-red"
            }`}
          >
            Reset Layout
          </button>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="px-1">
          <p className='text-sm mb-3'>Create a new category</p>
          <div className="flex mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., NFT Marketplaces"
              className={`${inputClasses} mr-2 w-full md:w-64`}
            />
            <button 
              onClick={addNewCategory} 
              disabled={!newCategory.trim()}
              className={`${buttonClasses} ${!newCategory.trim() ? disabledButtonClasses : ''}`}
            >
              Add
            </button>
          </div>
          
          {allCategoriesForDropdown.length > 0 && (
            <div className="mt-4">
              <p className='text-sm mb-2 opacity-80'>Existing Categories</p>
              <div className="flex flex-wrap gap-2">
                {allCategoriesForDropdown.map(category => (
                  <div key={category} className={`px-2 py-1 text-xs rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter' 
                      : 'bg-light-layer-lighter'
                  }`}>
                    {category}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'layouts' && saveLayout && (
        <div className="px-1">
          <p className='text-sm mb-3'>Save your current layout</p>
          <div className="flex mb-4">
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Layout name (e.g., Trading Focus)"
              className={`${inputClasses} mr-2 w-full md:w-64`}
            />
            <button 
              onClick={() => {
                if (layoutName.trim()) {
                  saveLayout(layoutName);
                  setLayoutName('');
                }
              }}
              disabled={!layoutName.trim()}
              className={`${buttonClasses} ${!layoutName.trim() ? disabledButtonClasses : ''}`}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolControls;
