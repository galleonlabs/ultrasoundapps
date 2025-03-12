import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../utils/firebase';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  ChartBarIcon, 
  CheckIcon
} from '@heroicons/react/20/solid';

// Define types
interface Tool {
  id: string;
  name: string;
  logo: string;
  affiliateLink?: string;
  website: string;
  upvotes?: number;
  category: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  toolCount?: number;
}

interface UsageReport {
  toolId: string;
  toolName: string;
  clicks: number;
  lastUsed: Date;
}

// Admin Panel Component
const AdminPanel: React.FC = () => {
  const { theme } = useTheme();
  
  // UI state
  const [activeTab, setActiveTab] = useState<'tools' | 'categories' | 'reports'>('tools');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data state
  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usageReports, setUsageReports] = useState<UsageReport[]>([]);
  
  // Form state for tool management
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [toolForm, setToolForm] = useState<Omit<Tool, 'id'>>({
    name: '',
    logo: '',
    website: '',
    category: '',
    affiliateLink: ''
  });
  
  // Form state for category management
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryEditMode, setCategoryEditMode] = useState<boolean>(false);
  const [categoryForm, setCategoryForm] = useState<Omit<Category, 'id' | 'toolCount'>>({
    name: '',
    description: ''
  });


  // Fetch real data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch tools data
        const toolsSnapshot = await getDocs(collection(db, COLLECTIONS.TOOLS));
        const toolsData = toolsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Tool));
        
        // Extract unique categories from tools
        const uniqueCategories: { [key: string]: Category } = {};
        toolsData.forEach(tool => {
          if (tool.category && !uniqueCategories[tool.category]) {
            uniqueCategories[tool.category] = {
              id: tool.category.toLowerCase().replace(/\s+/g, '-'),
              name: tool.category,
              description: `Category for ${tool.category} tools`
            };
          }
        });
        
        // Create categories array from unique categories
        const categoriesData = Object.values(uniqueCategories);
        
        // Create usage reports from tools data
        const usageReportsData = toolsData.map(tool => ({
          toolId: tool.id,
          toolName: tool.name,
          clicks: tool.upvotes || 0,
          lastUsed: new Date() // In a real implementation, this would come from analytics data
        })).sort((a, b) => b.clicks - a.clicks);
        
        setTools(toolsData);
        setCategories(categoriesData);
        setUsageReports(usageReportsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        // If Firestore fetch fails, fallback to empty arrays
        setTools([]);
        setCategories([]);
        setUsageReports([]);
        setError('Failed to load data from Firestore');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate category tool counts
  const categoriesWithCounts = useMemo(() => {
    return categories.map(category => {
      const toolCount = tools.filter(tool => tool.category === category.name).length;
      return { ...category, toolCount };
    });
  }, [categories, tools]);

  // Tool management functions
  const handleToolFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setToolForm(prev => ({ ...prev, [name]: value }));
  };

  const resetToolForm = () => {
    setToolForm({
      name: '',
      logo: '',
      website: '',
      category: '',
      affiliateLink: ''
    });
    setSelectedTool(null);
    setEditMode(false);
  };

  const handleEditTool = (tool: Tool) => {
    setToolForm({
      name: tool.name,
      logo: tool.logo,
      website: tool.website,
      category: tool.category,
      affiliateLink: tool.affiliateLink || ''
    });
    setSelectedTool(tool);
    setEditMode(true);
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Add new tool to Firestore
      const toolRef = await addDoc(collection(db, COLLECTIONS.TOOLS), {
        ...toolForm,
        upvotes: 0
      });
      
      // Add to local state with ID from Firestore
      const newTool: Tool = {
        id: toolRef.id,
        ...toolForm,
        upvotes: 0
      };
      
      setTools(prev => [...prev, newTool]);
      setSuccess('Tool added successfully');
      resetToolForm();
      
      // Update categories in memory
      if (toolForm.category && !categories.some(cat => cat.name === toolForm.category)) {
        const newCategory: Category = {
          id: toolForm.category.toLowerCase().replace(/\s+/g, '-'),
          name: toolForm.category,
          description: `Category for ${toolForm.category} tools`
        };
        setCategories(prev => [...prev, newCategory]);
      }
      
    } catch (err) {
      console.error('Error adding tool:', err);
      setError('Failed to add tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Update tool in Firestore
      const toolRef = doc(db, COLLECTIONS.TOOLS, selectedTool.id);
      await updateDoc(toolRef, toolForm);
      
      // Update local state
      setTools(prev => 
        prev.map(tool => 
          tool.id === selectedTool.id 
            ? { ...tool, ...toolForm } 
            : tool
        )
      );
      
      setSuccess('Tool updated successfully');
      resetToolForm();
      
      // Update categories in memory
      if (toolForm.category && !categories.some(cat => cat.name === toolForm.category)) {
        const newCategory: Category = {
          id: toolForm.category.toLowerCase().replace(/\s+/g, '-'),
          name: toolForm.category,
          description: `Category for ${toolForm.category} tools`
        };
        setCategories(prev => [...prev, newCategory]);
      }
      
    } catch (err) {
      console.error('Error updating tool:', err);
      setError('Failed to update tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete tool from Firestore
      const toolRef = doc(db, COLLECTIONS.TOOLS, toolId);
      await deleteDoc(toolRef);
      
      // Remove from local state
      setTools(prev => prev.filter(tool => tool.id !== toolId));
      
      setSuccess('Tool deleted successfully');
      if (selectedTool?.id === toolId) {
        resetToolForm();
      }
    } catch (err) {
      console.error('Error deleting tool:', err);
      setError('Failed to delete tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Category management functions
  const handleCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: value }));
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: ''
    });
    setSelectedCategory(null);
    setCategoryEditMode(false);
  };

  const handleEditCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setSelectedCategory(category);
    setCategoryEditMode(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a new category in memory only (no Firestore collection for categories)
      const newCategory: Category = {
        id: categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        ...categoryForm
      };
      
      setCategories(prev => [...prev, newCategory]);
      setSuccess('Category added successfully');
      resetCategoryForm();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const oldName = selectedCategory.name;
      const newName = categoryForm.name;
      
      // Update category in local state
      setCategories(prev => 
        prev.map(category => 
          category.id === selectedCategory.id 
            ? { 
                ...category, 
                ...categoryForm,
                id: categoryForm.name.toLowerCase().replace(/\s+/g, '-')
              } 
            : category
        )
      );
      
      // If name changed, update all tools with this category
      if (oldName !== newName) {
        // Get all tools with this category
        const toolsToUpdate = tools.filter(tool => tool.category === oldName);
        
        // Update each tool in Firestore
        for (const tool of toolsToUpdate) {
          const toolRef = doc(db, COLLECTIONS.TOOLS, tool.id);
          await updateDoc(toolRef, { category: newName });
        }
        
        // Update tools in local state
        setTools(prev => 
          prev.map(tool => 
            tool.category === oldName 
              ? { ...tool, category: newName } 
              : tool
          )
        );
      }
      
      setSuccess('Category updated successfully');
      resetCategoryForm();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!window.confirm('Are you sure you want to delete this category? All tools in this category will be set to "Uncategorized".')) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all tools with this category
      const toolsToUpdate = tools.filter(tool => tool.category === categoryName);
      
      // Make sure we have an Uncategorized category
      const uncategorizedExists = categories.some(cat => cat.name === 'Uncategorized');
      if (!uncategorizedExists) {
        setCategories(prev => [
          ...prev, 
          {
            id: 'uncategorized',
            name: 'Uncategorized',
            description: 'Default category for uncategorized tools'
          }
        ]);
      }
      
      // Update each tool in Firestore to use "Uncategorized" category
      for (const tool of toolsToUpdate) {
        const toolRef = doc(db, COLLECTIONS.TOOLS, tool.id);
        await updateDoc(toolRef, { category: 'Uncategorized' });
      }
      
      // Update tools in local state
      setTools(prev => 
        prev.map(tool => 
          tool.category === categoryName 
            ? { ...tool, category: 'Uncategorized' } 
            : tool
        )
      );
      
      // Remove category from local state
      setCategories(prev => prev.filter(category => category.id !== categoryId));
      
      setSuccess('Category deleted successfully and tools updated');
      if (selectedCategory?.id === categoryId) {
        resetCategoryForm();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);


  // Login form is now handled by the AdminPage component

  return (
    <div className={`container mx-auto px-4 py-8 ${
      theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
    }`}>
      <div className={`flex justify-between items-center mb-6 pb-4 border-b ${
        theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
      }`}>
        <h1 className={`text-2xl font-semibold ${
          theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
        }`}>Admin Panel</h1>
        
      </div>

      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-sm mb-4 flex justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="font-bold">×</button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-sm mb-4 flex justify-between">
          {error}
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === 'tools'
              ? theme === 'dark'
                ? 'border-b-2 border-theme-text-light text-theme-text-light'
                : 'border-b-2 border-light-text-dark text-light-text-dark'
              : theme === 'dark'
                ? 'text-theme-text-dark hover:text-theme-text-base'
                : 'text-light-text-light hover:text-light-text-base'
          }`}
          onClick={() => setActiveTab('tools')}
        >
          Tools
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'categories'
              ? theme === 'dark'
                ? 'border-b-2 border-theme-text-light text-theme-text-light'
                : 'border-b-2 border-light-text-dark text-light-text-dark'
              : theme === 'dark'
                ? 'text-theme-text-dark hover:text-theme-text-base'
                : 'text-light-text-light hover:text-light-text-base'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'reports'
              ? theme === 'dark'
                ? 'border-b-2 border-theme-text-light text-theme-text-light'
                : 'border-b-2 border-light-text-dark text-light-text-dark'
              : theme === 'dark'
                ? 'text-theme-text-dark hover:text-theme-text-base'
                : 'text-light-text-light hover:text-light-text-base'
          }`}
          onClick={() => setActiveTab('reports')}
        >
          Usage Reports
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
            theme === 'dark' ? 'border-theme-text-light' : 'border-light-text-dark'
          }`}></div>
        </div>
      )}

      {/* Tools Tab Content */}
      {!isLoading && activeTab === 'tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tool List Section */}
          <div className={`lg:col-span-2 overflow-x-auto rounded-sm border ${
            theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
          }`}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className={`text-lg font-medium ${
                theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
              }`}>Tools List</h2>
              
              <button
                onClick={() => {
                  resetToolForm();
                  setEditMode(false);
                }}
                className={`px-3 py-1 border rounded-sm text-sm flex items-center ${
                  theme === 'dark'
                    ? 'border-theme-border-lighter hover:bg-theme-layer-lighter'
                    : 'border-light-border-dark hover:bg-light-layer-dark'
                }`}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add New Tool
              </button>
            </div>
            
            <table className="min-w-full divide-y">
              <thead className={`${
                theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-dark'
              }`}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Upvotes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'dark' ? 'divide-theme-border-lighter' : 'divide-light-border-dark'
              }`}>
                {tools.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      No tools found. Add some tools to get started.
                    </td>
                  </tr>
                ) : (
                  tools.map((tool) => (
                    <tr key={tool.id} className={
                      selectedTool?.id === tool.id
                        ? theme === 'dark' ? 'bg-theme-layer-dark' : 'bg-light-layer-darker'
                        : ''
                    }>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {tool.logo ? (
                            <img 
                              src={tool.logo} 
                              alt={`${tool.name} logo`} 
                              className="h-8 w-8 mr-3 border rounded-sm"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://via.placeholder.com/40?text=' + tool.name.charAt(0);
                              }}
                            />
                          ) : (
                            <div className="h-8 w-8 mr-3 flex items-center justify-center rounded-sm bg-gray-200 text-gray-600">
                              {tool.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{tool.name}</div>
                            <div className={`text-xs ${
                              theme === 'dark' ? 'text-theme-text-dark' : 'text-light-text-light'
                            }`}>
                              {tool.website.replace(/^https?:\/\//, '').split('/')[0]}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          theme === 'dark' 
                            ? 'bg-theme-layer-lightest text-theme-text-base' 
                            : 'bg-light-layer-dark text-light-text-light'
                        }`}>
                          {tool.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tool.upvotes || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTool(tool)}
                            className={`p-1 rounded-sm ${
                              theme === 'dark' ? 'hover:bg-theme-layer-lighter' : 'hover:bg-light-layer-dark'
                            }`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTool(tool.id)}
                            className={`p-1 rounded-sm ${
                              theme === 'dark' ? 'hover:bg-theme-layer-lighter text-theme-red' : 'hover:bg-light-layer-dark text-red-500'
                            }`}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tool Form Section */}
          <div className={`rounded-sm border p-4 ${
            theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
          }`}>
            <h2 className={`text-lg font-medium mb-4 ${
              theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
            }`}>
              {editMode ? 'Edit Tool' : 'Add New Tool'}
            </h2>
            
            <form onSubmit={editMode ? handleUpdateTool : handleAddTool}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Tool Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={toolForm.name}
                  onChange={handleToolFormChange}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logo"
                  value={toolForm.logo}
                  onChange={handleToolFormChange}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Website URL
                </label>
                <input
                  type="url"
                  name="website"
                  value={toolForm.website}
                  onChange={handleToolFormChange}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Affiliate Link (optional)
                </label>
                <input
                  type="url"
                  name="affiliateLink"
                  value={toolForm.affiliateLink || ''}
                  onChange={handleToolFormChange}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                />
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Category
                </label>
                <select
                  name="category"
                  value={toolForm.category}
                  onChange={handleToolFormChange}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={resetToolForm}
                  className={`px-4 py-2 border rounded-sm text-sm ${
                    theme === 'dark'
                      ? 'border-theme-border-lighter hover:bg-theme-layer-lighter'
                      : 'border-light-border-dark hover:bg-light-layer-dark'
                  }`}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className={`px-4 py-2 border rounded-sm text-sm flex items-center ${
                    theme === 'dark'
                      ? 'bg-theme-layer-lighter border-theme-border-lighter hover:bg-theme-layer-lightest'
                      : 'bg-light-layer-dark border-light-border-dark hover:bg-light-layer-darker'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                  ) : editMode ? (
                    <CheckIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-1" />
                  )}
                  {editMode ? 'Update Tool' : 'Add Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tab Content */}
      {!isLoading && activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Categories List Section */}
          <div className={`lg:col-span-2 overflow-x-auto rounded-sm border ${
            theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
          }`}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className={`text-lg font-medium ${
                theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
              }`}>Categories List</h2>
              
              <button
                onClick={() => {
                  resetCategoryForm();
                  setCategoryEditMode(false);
                }}
                className={`px-3 py-1 border rounded-sm text-sm flex items-center ${
                  theme === 'dark'
                    ? 'border-theme-border-lighter hover:bg-theme-layer-lighter'
                    : 'border-light-border-dark hover:bg-light-layer-dark'
                }`}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add New Category
              </button>
            </div>
            
            <table className="min-w-full divide-y">
              <thead className={`${
                theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-dark'
              }`}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Tool Count
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'dark' ? 'divide-theme-border-lighter' : 'divide-light-border-dark'
              }`}>
                {categoriesWithCounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      No categories found. Add some categories to get started.
                    </td>
                  </tr>
                ) : (
                  categoriesWithCounts.map((category) => (
                    <tr key={category.id} className={
                      selectedCategory?.id === category.id
                        ? theme === 'dark' ? 'bg-theme-layer-dark' : 'bg-light-layer-darker'
                        : ''
                    }>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {category.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm truncate max-w-xs">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          theme === 'dark' 
                            ? 'bg-theme-layer-lightest text-theme-text-base' 
                            : 'bg-light-layer-dark text-light-text-light'
                        }`}>
                          {category.toolCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className={`p-1 rounded-sm ${
                              theme === 'dark' ? 'hover:bg-theme-layer-lighter' : 'hover:bg-light-layer-dark'
                            }`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className={`p-1 rounded-sm ${
                              theme === 'dark' ? 'hover:bg-theme-layer-lighter text-theme-red' : 'hover:bg-light-layer-dark text-red-500'
                            }`}
                            disabled={category.name === 'Uncategorized'}
                          >
                            <TrashIcon className={`h-4 w-4 ${category.name === 'Uncategorized' ? 'opacity-50' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Category Form Section */}
          <div className={`rounded-sm border p-4 ${
            theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
          }`}>
            <h2 className={`text-lg font-medium mb-4 ${
              theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
            }`}>
              {categoryEditMode ? 'Edit Category' : 'Add New Category'}
            </h2>
            
            <form onSubmit={categoryEditMode ? handleUpdateCategory : handleAddCategory}>
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryFormChange}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                  required
                  disabled={categoryEditMode && selectedCategory?.name === 'Uncategorized'}
                />
              </div>
              
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-1 ${
                  theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                }`}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={categoryForm.description || ''}
                  onChange={handleCategoryFormChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-sm ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                      : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
                  }`}
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className={`px-4 py-2 border rounded-sm text-sm ${
                    theme === 'dark'
                      ? 'border-theme-border-lighter hover:bg-theme-layer-lighter'
                      : 'border-light-border-dark hover:bg-light-layer-dark'
                  }`}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className={`px-4 py-2 border rounded-sm text-sm flex items-center ${
                    theme === 'dark'
                      ? 'bg-theme-layer-lighter border-theme-border-lighter hover:bg-theme-layer-lightest'
                      : 'bg-light-layer-dark border-light-border-dark hover:bg-light-layer-darker'
                  }`}
                  disabled={isLoading || (categoryEditMode && selectedCategory?.name === 'Uncategorized')}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                  ) : categoryEditMode ? (
                    <CheckIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-1" />
                  )}
                  {categoryEditMode ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {!isLoading && activeTab === 'reports' && (
        <div className={`rounded-sm border overflow-hidden ${
          theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
        }`}>
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className={`text-lg font-medium ${
              theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
            }`}>
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Tool Usage Reports
              </div>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className={`${
                theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-layer-dark'
              }`}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Tool
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Clicks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Last Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Usage Trend
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                theme === 'dark' ? 'divide-theme-border-lighter' : 'divide-light-border-dark'
              }`}>
                {usageReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      No usage data available yet. This will populate as users interact with tools.
                    </td>
                  </tr>
                ) : (
                  usageReports.map((report, index) => (
                    <tr key={report.toolId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs ${
                          index < 3
                            ? theme === 'dark' ? 'bg-theme-yellow text-black' : 'bg-yellow-500 text-white'
                            : theme === 'dark' ? 'bg-theme-layer-lightest' : 'bg-light-layer-dark'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {report.toolName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.lastUsed.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24 h-6 bg-opacity-20 rounded-sm overflow-hidden relative">
                          <div
                            className={`absolute top-0 left-0 h-full ${
                              theme === 'dark' ? 'bg-theme-purple' : 'bg-purple-500'
                            }`}
                            style={{ width: `${Math.min(100, (report.clicks / usageReports[0]?.clicks || 1) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-theme-border-lighter' : 'border-light-border-dark'
          }`}>
            <p className="text-sm italic">
              Note: Tool usage data is updated daily. Click counts represent total clicks since tracking began.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;