import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminPanel from '../Components/AdminPanel';

const AdminPage: React.FC = () => {
  const { currentUser, isAdmin, login } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // If user is not the admin account, show login or unauthorized message
  if (!currentUser) {
    return (
      <div className={`max-w-md mx-auto mt-8 p-6 rounded-sm shadow-md ${
        theme === 'dark' ? 'bg-theme-layer-darker' : 'bg-light-layer-light'
      }`}>
        <h2 className={`text-xl font-medium mb-6 ${
          theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
        }`}>Admin Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label 
              htmlFor="adminEmail" 
              className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
              }`}
            >
              Email
            </label>
            <input
              type="email"
              id="adminEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-sm ${
                theme === 'dark' 
                  ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                  : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
              }`}
              required
            />
          </div>
          
          <div className="mb-6">
            <label 
              htmlFor="adminPassword" 
              className={`block text-sm font-medium mb-1 ${
                theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
              }`}
            >
              Password
            </label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-sm ${
                theme === 'dark' 
                  ? 'bg-theme-layer-lightest border-theme-border-lighter text-theme-text-light' 
                  : 'bg-light-layer-base border-light-border-dark text-light-text-dark'
              }`}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center px-4 py-2 border rounded-sm font-medium ${
              theme === 'dark'
                ? 'bg-theme-layer-lighter border-theme-border-lighter text-theme-text-light hover:bg-theme-layer-lightest'
                : 'bg-light-layer-dark border-light-border-dark text-light-text-light hover:bg-light-layer-darker'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // If user is not the admin account, show unauthorized message
  if (!isAdmin) {
    return (
      <div className={`max-w-md mx-auto mt-8 p-6 rounded-sm shadow-md ${
        theme === 'dark' ? 'bg-theme-layer-darker' : 'bg-light-layer-light'
      }`}>
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-sm mb-4">
          <h2 className="text-lg font-bold mb-2">Access Denied</h2>
          <p>You do not have permission to access the admin area.</p>
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

  // User is admin, show admin panel
  return (
    <div className="container mx-auto px-4 py-6">
      <AdminPanel />
    </div>
  );
};

export default AdminPage;