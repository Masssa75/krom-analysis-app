'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/navigation';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Only show navigation for admin pages, dashboard, and analysis
  const showNavigation = pathname.startsWith('/admin') || 
                        pathname === '/dashboard' || 
                        pathname === '/analysis';

  return (
    <>
      {showNavigation && <Navigation />}
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}