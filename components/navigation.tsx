'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-green-600 dark:text-green-400">
                KROM Analysis
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  pathname === '/' 
                    ? 'text-gray-900 dark:text-white border-b-2 border-blue-500' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Analysis
              </Link>
              <Link
                href="/dashboard"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  pathname === '/dashboard' 
                    ? 'text-gray-900 dark:text-white border-b-2 border-blue-500' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <a
              href="https://krom.one"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium"
            >
              KROM ↗
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}