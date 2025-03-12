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

  // Helper function for conditional classNames
  const classNames = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
  };

  return (
    <div className={classNames(
      'rounded-lg shadow p-6 w-full mx-auto',
      theme === 'dark' 
        ? 'bg-theme-layer-base text-theme-text-base' 
        : 'bg-light-layer-base text-light-text-base'
    )}>
      <h2 className={classNames(
        'text-2xl font-semibold mb-6',
        theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
      )}>Top Tools Dashboard</h2>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className={classNames(
            'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2',
            theme === 'dark' ? 'border-theme-purple' : 'border-theme-purple'
          )}></div>
        </div>
      )}

      {error && (
        <div className={classNames(
          'p-4 rounded-sm mb-4',
          theme === 'dark' ? 'bg-theme-red bg-opacity-20 text-theme-red' : 'bg-theme-red bg-opacity-10 text-theme-red'
        )}>
          {error}
        </div>
      )}

      {/* Data Display Sections */}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          {/* Top Tools Section */}
          <table className={classNames(
            'min-w-full divide-y',
            theme === 'dark' ? 'divide-theme-border-grey' : 'divide-light-border-dark'
          )}>
            <thead className={theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tool</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Last Used</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-y divide-theme-border-grey' : 'divide-y divide-light-border-dark'}>
              {topTools.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center">No tool usage data available</td>
                </tr>
              ) : (
                topTools.map((tool) => (
                  <tr key={tool.toolId}>
                    <td className="px-6 py-4 whitespace-nowrap">{tool.toolName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tool.clicks}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
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