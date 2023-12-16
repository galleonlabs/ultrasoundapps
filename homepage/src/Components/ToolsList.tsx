import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, analytics } from '../main.tsx';
import './ToolsList.css'
import { logEvent } from "firebase/analytics";
import { classNames } from '../utils/index.tsx';
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from '@heroicons/react/20/solid';
import ToolItem from './ToolItem';
import ToolControls from './ToolControls';

const ToolsList: React.FC = () => {
  // state declarations
  const [tools, setTools] = useState<any[]>([]);
  const initialVisibility = JSON.parse(localStorage.getItem('visibility') || '{}');
  const [visibility, setVisibility] = useState<Record<string, boolean>>(initialVisibility);
  const [groupedTools, setGroupedTools] = useState<Record<string, any[]>>({});
  const [hiddens, setHiddens] = useState<boolean>(false);
  const [newTool, setNewTool] = useState({ name: '', logo: '', website: '', category: '' });
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // combining categories
  const allCategories = [...Object.keys(groupedTools), ...customCategories.filter(cat => !groupedTools.hasOwnProperty(cat))];
  const allCategoriesForDropdown = [...new Set([...Object.keys(groupedTools), ...customCategories])];

  useEffect(() => {
    logEvent(analytics, 'page_view', { page_path: '/' });

    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'tools'));
      const toolsArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const customTools = JSON.parse(localStorage.getItem('customTools') || '[]');
      const combinedTools = [...toolsArray, ...customTools];
      processTools(combinedTools);;
      const savedVisibility = localStorage.getItem('visibility');

      if (savedVisibility) {
        setVisibility(JSON.parse(savedVisibility));
      }

      const savedCustomCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
      setCustomCategories(savedCustomCategories);
    };

    fetchData()
  }, []);

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

  const processTools = (toolsArray: any[]) => {
    const grouped = toolsArray.reduce((acc, tool) => {
      const category = tool.category || 'Uncategorized';
      acc[category] = acc[category] || [];
      acc[category].push(tool);
      return acc;
    }, {});

    for (let category in grouped) {
      grouped[category].sort((a: any, b: any) => b.upvotes - a.upvotes);
    }

    setTools(toolsArray);
    setGroupedTools(grouped);
  };

  const handleToolClick = (toolName: string) => {
    logEvent(analytics, 'select_tool', { name: toolName });
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

  const saveSettings = () => {
    const customTools = tools.filter(tool => tool.id.startsWith('custom-'));
    const settings = {
      visibility,
      customTools,
      customCategories
    };
    const data = JSON.stringify(settings);
    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "tools_layout_settings.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadSettings = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = JSON.parse(e.target.result);
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
      };
      reader.readAsText(file);
    }
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
    localStorage.removeItem('visibility');
    localStorage.removeItem('customTools');
    localStorage.removeItem('customCategories');

    setTools([]);
    setVisibility({});
    setGroupedTools({});
    setCustomCategories([]);
    window.location.reload();
  };

  return (
    <div className='pt-4 '>
      <div className='sm:flex text-sm mb-8 hidden'>
        <button className='border hover:shadow-[1px_1px_0px_#ffffff]  border-theme-layer-lightest rounded-sm px-2 py-1 mr-4' onClick={saveSettings}>download layout</button>
        <span className='flex border hover:shadow-[1px_1px_0px_#ffffff]  border-theme-layer-lightest rounded-sm px-2 py-1'>    <span className="flex select-none items-center ml-1.5 mr-3">upload layout</span>
          <input className='cursor-pointer' type="file" onChange={loadSettings} />
        </span>
      </div>
      <div className="text-theme-text-base pt-8 gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {allCategories.map(category => (
          <div key={category} className="mb-4 border-l border-theme-border-lighter pl-4">
            <h2 className="text-md mb-4 lowercase">{category}</h2>
            <div>
              {(groupedTools[category] || []).filter(x => !visibility[x.id]).map(tool => (
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
      <div>
        <p className=' text-md flex leading-tight font-wigrum pt-8'>hidden apps

          {hiddens ? <ArrowUpCircleIcon
            onClick={() => setHiddens(!hiddens)}
            className={
              classNames('group  ml-2 translate-y-1 flex w-4 h-4 border-0 hover:text-theme-layer-lighter hover:cursor-pointer  items-center justify-center text-theme-white ')
            }
          ></ArrowUpCircleIcon> : <ArrowDownCircleIcon
            onClick={() => setHiddens(!hiddens)}
            className={
              classNames('group  ml-2 translate-y-1 flex w-4 h-4 border-0 hover:text-theme-layer-lighter hover:cursor-pointer  items-center justify-center text-theme-white ')
            }
          ></ArrowDownCircleIcon>}
        </p>
        {hiddens ? <div className="   text-theme-text-base pt-8 gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {allCategories.map(category => (
            <div key={category} className="mb-4 border-l border-theme-border-lighter pl-4">
              <h2 className="text-md mb-4 lowercase">{category}</h2>
              <div>
                {(groupedTools[category] || []).filter(x => visibility[x.id]).map(tool => (
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
        </div> : <></>}
      </div>
      <ToolControls
        newTool={newTool}
        handleNewToolChange={handleNewToolChange}
        addNewTool={addNewTool}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        addNewCategory={addNewCategory}
        resetLayout={resetLayout}
        allCategoriesForDropdown={allCategoriesForDropdown}
      />
    </div>
  );
};

export default ToolsList;
