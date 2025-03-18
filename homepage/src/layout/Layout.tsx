
import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import './Layout.css';
import ThemeToggle from "../Components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Format date as 1st March 2025
function formatDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  
  const suffix = getDaySuffix(day);
  return `${day}${suffix} ${month} ${year}`;
}

// Get appropriate suffix for day
function getDaySuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export default function Layout() {
  // Memoize the date to prevent unnecessary re-renders
  const formattedDate = useMemo(() => formatDate(new Date()), []);
  const { theme } = useTheme();
  const { currentUser, isAdmin, logout } = useAuth();

  return (
    <>
      <div className={`min-h-full ${theme === 'dark' ? 'bg-[url("./assets/dots.svg")]' : ''}`}>
        <div className="py-6 md:py-8">
          <main>
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 leading-tight tracking-normal font-wigrum ${
              theme === 'dark' 
                ? 'bg-theme-layer-base bg-opacity-50 text-theme-text-base' 
                : 'bg-light-layer-base bg-opacity-50 text-light-text-base'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3">
                <div>
                  <h1 className={`text-lg font-semibold ${
                    theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                  }`}>ultra sound apps</h1>
                  <p className={`text-md leading-tight font-wigrum ${
                    theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                  }`}>
                    a browser homepage for navigating trading, investing, portfolio management & analytics apps.
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                  <span className={`inline-block px-2 py-1 rounded-sm text-xs ${
                    theme === 'dark' 
                      ? 'bg-theme-layer-lighter bg-opacity-30 border border-theme-border-lighter text-theme-text-dark' 
                      : 'bg-light-layer-darker bg-opacity-30 border border-light-border-dark text-light-text-light'
                  }`}>
                    {formattedDate}
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <Outlet />
            </div>
            

            <div className={`mx-auto px-4 sm:px-6 lg:px-8 leading-tight tracking-normal font-wigrum py-3 ${
              theme === 'dark' 
                ? 'bg-theme-layer-base bg-opacity-50' 
                : 'bg-light-layer-base'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <a
                    href="https://twitter.com/davyjones0x"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm leading-tight font-wigrum flex items-center ${
                      theme === 'dark' 
                        ? 'hover:text-theme-text-light' 
                        : 'hover:text-light-text-dark'
                    }`}
                    aria-label="Twitter profile of creator davyjones0x"
                  >
                    <span>created by @davyjones0x</span>
                  </a>
                  {isAdmin && (
                    <>
                      <div className="text-theme-text-dark">•</div>
                      <Link
                        to="/admin"
                        className={`text-sm leading-tight font-wigrum ${
                          theme === 'dark' 
                            ? 'hover:text-theme-text-light' 
                            : 'hover:text-light-text-dark'
                        }`}
                      >
                        Admin
                      </Link>
                      <div className="text-theme-text-dark">•</div>
                      <Link
                        to="/analytics"
                        className={`text-sm leading-tight font-wigrum ${
                          theme === 'dark' 
                            ? 'hover:text-theme-text-light' 
                            : 'hover:text-light-text-dark'
                        }`}
                      >
                        Analytics
                      </Link>
                    </>
                  )}
                </div>
                
                {currentUser && (
                  <button
                    onClick={() => logout()}
                    className={`text-sm leading-tight font-wigrum ${
                      theme === 'dark' 
                        ? 'hover:text-theme-text-light' 
                        : 'hover:text-light-text-dark'
                    }`}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
