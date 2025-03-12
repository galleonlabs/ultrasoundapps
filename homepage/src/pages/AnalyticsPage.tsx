import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AnalyticsDashboard from '../Components/AnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { theme } = useTheme();

  // If not authenticated, redirect to admin page for login
  if (!currentUser) {
    return <Navigate to="/admin" />;
  }

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className={`max-w-md mx-auto mt-8 p-6 rounded-sm shadow-md ${
        theme === 'dark' ? 'bg-theme-layer-darker' : 'bg-light-layer-light'
      }`}>
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-sm mb-4">
          <h2 className="text-lg font-bold mb-2">Access Denied</h2>
          <p>You do not have permission to access the analytics dashboard.</p>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className={`px-4 py-2 border rounded-sm font-medium ${
              theme === 'dark'
                ? 'bg-theme-layer-lighter border-theme-border-lighter text-theme-text-light'
                : 'bg-light-layer-dark border-light-border-dark text-light-text-light'
            }`}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // User is admin, show analytics dashboard
  return (
    <div className="container mx-auto px-4 py-6">
      <AnalyticsDashboard />
    </div>
  );
};

export default AnalyticsPage;