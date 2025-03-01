import React, { useState } from 'react';

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
  saveLayout 
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'categories' | 'layouts'>('tools');
  const [layoutName, setLayoutName] = useState('');

  return (
    <div className='mt-8 pt-4 pb-6 border-t border-b border-theme-border-lighter bg-theme-layer-darker bg-opacity-30 rounded-sm'>
      {/* Tabs */}
      <div className="flex border-b border-theme-border-lighter mb-4">
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'tools' ? 'border-b-2 border-theme-text-light text-theme-text-light' : 'text-theme-text-dark hover:text-theme-text-base'}`}
          onClick={() => setActiveTab('tools')}
        >
          Add Tool
        </button>
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'categories' ? 'border-b-2 border-theme-text-light text-theme-text-light' : 'text-theme-text-dark hover:text-theme-text-base'}`}
          onClick={() => setActiveTab('categories')}
        >
          Manage Categories
        </button>
        {saveLayout && (
          <button 
            className={`px-4 py-2 text-sm ${activeTab === 'layouts' ? 'border-b-2 border-theme-text-light text-theme-text-light' : 'text-theme-text-dark hover:text-theme-text-base'}`}
            onClick={() => setActiveTab('layouts')}
          >
            Save Layout
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'tools' && (
        <div className="px-4">
          <p className='flex leading-tight font-wigrum text-sm pb-4'>Add a new tool to your dashboard</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-theme-text-dark mb-1">Tool Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g., Uniswap"
                value={newTool.name}
                onChange={handleNewToolChange}
                className="border w-full text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-text-dark mb-1">Website URL</label>
              <input
                type="text"
                name="website"
                placeholder="e.g., https://app.uniswap.org"
                value={newTool.website}
                onChange={handleNewToolChange}
                className="border w-full text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-text-dark mb-1">Logo URL</label>
              <input
                type="text"
                name="logo"
                placeholder="e.g., https://example.com/logo.png"
                value={newTool.logo}
                onChange={handleNewToolChange}
                className="border w-full text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-theme-text-dark mb-1">Category</label>
              <select
                onChange={handleNewToolChange}
                className='border w-full text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1'
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
            className={`border text-sm border-theme-layer-lightest rounded-sm px-4 py-1 hover:shadow-[1px_1px_0px_#ffffff] ${(!newTool.name || !newTool.website || !newTool.logo) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Add Tool
          </button>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="px-4">
          <p className='flex leading-tight font-wigrum text-sm pb-4'>Create a new category</p>
          <div className="flex mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., NFT Marketplaces"
              className="border text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2 w-full md:w-64"
            />
            <button 
              onClick={addNewCategory} 
              disabled={!newCategory.trim()}
              className={`border text-sm border-theme-layer-lightest rounded-sm px-4 py-1 hover:shadow-[1px_1px_0px_#ffffff] ${!newCategory.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Add Category
            </button>
          </div>
          
          {allCategoriesForDropdown.length > 0 && (
            <div className="mt-6">
              <p className='flex leading-tight font-wigrum text-sm pb-2'>Existing Categories</p>
              <div className="flex flex-wrap gap-2">
                {allCategoriesForDropdown.map(category => (
                  <div key={category} className="px-3 py-1 text-sm bg-theme-layer-lighter rounded-sm">
                    {category}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'layouts' && saveLayout && (
        <div className="px-4">
          <p className='flex leading-tight font-wigrum text-sm pb-4'>Save your current layout</p>
          <div className="flex mb-4">
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Layout name (e.g., Trading Focus)"
              className="border text-sm border-theme-layer-lightest bg-theme-layer-lightest text-theme-text-light rounded-sm px-2 py-1 mr-2 w-full md:w-64"
            />
            <button 
              onClick={() => {
                if (layoutName.trim()) {
                  saveLayout(layoutName);
                  setLayoutName('');
                }
              }}
              disabled={!layoutName.trim()}
              className={`border text-sm border-theme-layer-lightest rounded-sm px-4 py-1 hover:shadow-[1px_1px_0px_#ffffff] ${!layoutName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Save Layout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolControls;
