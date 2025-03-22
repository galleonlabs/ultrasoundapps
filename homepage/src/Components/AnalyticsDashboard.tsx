import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getTopToolsByUsage } from '../utils/firebase';

// Types
interface ToolUsage {
  toolId: string;
  toolName: string;
  clicks: number;
  lastUsed: Date;
}

const AnalyticsDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [topTools, setTopTools] = useState<ToolUsage[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const tools = await getTopToolsByUsage(10);
        setTopTools(tools);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className={`rounded-sm p-4 w-full mx-auto ${
      theme === 'dark' 
        ? 'bg-theme-layer-base' 
        : 'bg-light-layer-base'
    }`}>
      <h2 className={`text-xl font-medium mb-4 ${
        theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
      }`}>Top Tools</h2>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${
            theme === 'dark' ? 'border-theme-purple' : 'border-theme-purple'
          }`}></div>
        </div>
      )}

      {error && (
        <div className={`p-3 rounded-sm mb-3 text-sm ${
          theme === 'dark' ? 'bg-theme-red bg-opacity-20 text-theme-red' : 'bg-theme-red bg-opacity-10 text-theme-red'
        }`}>
          {error}
        </div>
      )}

      {/* Data Display Sections */}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          {/* Top Tools Section */}
          <table className={`min-w-full ${
            theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
          }`}>
            <thead className={`text-xs uppercase ${
              theme === 'dark' ? 'text-theme-text-light opacity-70' : 'text-light-text-dark opacity-70'
            }`}>
              <tr>
                <th className="px-3 py-2 text-left">Tool</th>
                <th className="px-3 py-2 text-left">Usage</th>
                <th className="px-3 py-2 text-left">Last Used</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'divide-theme-layer-lighter' : 'divide-light-border-dark divide-opacity-30'
            }`}>
              {topTools.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-sm opacity-70">No tool usage data available</td>
                </tr>
              ) : (
                topTools.map((tool) => (
                  <tr key={tool.toolId} className="text-sm">
                    <td className="px-3 py-2.5">{tool.toolName}</td>
                    <td className="px-3 py-2.5">{tool.clicks}</td>
                    <td className="px-3 py-2.5">
                      {new Date(tool.lastUsed).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;