
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
        <div className="py-4 md:py-6">
          <main>
            <div className={`mx-auto px-4 sm:px-6 lg:px-8 mb-6`}>
              <div className={`rounded-2xl shadow-lg p-6 md:p-8 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-r from-theme-layer-dark/90 to-theme-layer-darker/90 backdrop-blur-sm border border-theme-layer-lighter/20' 
                  : 'bg-white/90 backdrop-blur-sm border border-light-border-dark/20'
              }`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        theme === 'dark'
                          ? 'bg-gradient-to-br from-theme-purple to-theme-purple/70 shadow-lg shadow-theme-purple/20'
                          : 'bg-gradient-to-br from-theme-pan-sky to-theme-pan-sky/70 shadow-lg shadow-theme-pan-sky/20'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Z" />
                        </svg>
                      </div>
                      <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${
                        theme === 'dark' ? 'text-theme-text-light' : 'text-light-text-dark'
                      }`}>Ultra Sound Apps</h1>
                    </div>
                    <p className={`text-base md:text-lg leading-relaxed max-w-2xl ${
                      theme === 'dark' ? 'text-theme-text-base' : 'text-light-text-base'
                    }`}>
                      Your gateway to the best trading, investing, portfolio management & analytics applications in the crypto ecosystem.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      theme === 'dark' 
                        ? 'bg-theme-layer-lighter text-theme-text-light border border-theme-layer-lightest' 
                        : 'bg-light-layer-light text-light-text-dark border border-light-border-dark'
                    }`}>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <Outlet />
            </div>
            

            <div className={`mx-auto px-4 sm:px-6 lg:px-8 mt-8`}>
              <div className={`rounded-xl p-4 ${
                theme === 'dark' 
                  ? 'bg-theme-layer-dark/50 border border-theme-layer-lighter/20' 
                  : 'bg-light-layer-lighter/50 border border-light-border-dark/20'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 flex-wrap">
                    <a
                      href="https://twitter.com/davyjones0x"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                        theme === 'dark' 
                          ? 'text-theme-text-base hover:text-theme-purple' 
                          : 'text-light-text-base hover:text-theme-pan-sky'
                      }`}
                      aria-label="Twitter profile of creator davyjones0x"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>Created by @davyjones0x</span>
                    </a>
                    {isAdmin && (
                      <>
                        <div className={`w-px h-4 ${
                          theme === 'dark' ? 'bg-theme-layer-lighter' : 'bg-light-border-dark'
                        }`}></div>
                        <Link
                          to="/admin"
                          className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                            theme === 'dark' 
                              ? 'text-theme-text-base hover:text-theme-purple' 
                              : 'text-light-text-base hover:text-theme-pan-sky'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a8.932 8.932 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          Admin
                        </Link>
                        <Link
                          to="/analytics"
                          className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                            theme === 'dark' 
                              ? 'text-theme-text-base hover:text-theme-purple' 
                              : 'text-light-text-base hover:text-theme-pan-sky'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                          </svg>
                          Analytics
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {currentUser && (
                    <button
                      onClick={() => logout()}
                      className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                        theme === 'dark' 
                          ? 'text-theme-text-base hover:text-theme-red' 
                          : 'text-light-text-base hover:text-theme-red'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
                      </svg>
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
