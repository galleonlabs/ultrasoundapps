
import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import './Layout.css';

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

  return (
    <>
      <div className="min-h-full bg-[url('./assets/dots.svg')]">
        <div className="py-6 md:py-8">
          <main>
            <div className="mx-auto px-4 sm:px-6 lg:px-8 leading-tight tracking-normal font-wigrum bg-theme-layer-base bg-opacity-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3">
                <div>
                  <h1 className="text-lg font-semibold text-theme-text-light">ultra sound apps</h1>
                  <p className="text-md leading-tight font-wigrum text-theme-text-base">
                    a browser homepage for navigating trading, investing, portfolio management & analytics apps.
                  </p>
                </div>
                <div className="mt-3 sm:mt-0 text-xs text-theme-text-dark">
                  <span className="inline-block px-2 py-1 rounded-sm bg-theme-layer-lighter bg-opacity-30 border border-theme-border-lighter">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            <div className="mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <Outlet />
            </div>

            <div className="mx-auto px-4 sm:px-6 lg:px-8 leading-tight tracking-normal font-wigrum bg-theme-layer-base bg-opacity-50 py-3">
              <div className="flex justify-between items-center">
                <a
                  href="https://twitter.com/davyjones0x"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-theme-text-light leading-tight font-wigrum flex items-center"
                  aria-label="Twitter profile of creator davyjones0x"
                >
                  <span>created by @davyjones0x</span>
                </a>
                {/* Footer right area if needed in the future */}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
