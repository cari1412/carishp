// components/layout/navbar/mobile-top-bar.tsx
'use client';

import LogoSquare from 'components/logo-square';
import Link from 'next/link';
import { Suspense } from 'react';
import Search, { SearchSkeleton } from './search';

const { SITE_NAME } = process.env;

export default function MobileTopBar() {
  return (
    <div className="md:hidden bg-gradient-to-r from-purple-600 to-indigo-600">
      {/* Single row with logo and search */}
      <div className="flex items-center gap-3 p-3">
        {/* Logo section */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <div className="bg-white rounded-lg p-1">
            <LogoSquare />
          </div>
          <div className="ml-2 text-sm font-medium uppercase text-white">
            {SITE_NAME}
          </div>
        </Link>
        
        {/* Search section - takes remaining space */}
        <div className="flex-1">
          <Suspense fallback={<SearchSkeleton />}>
            <Search />
          </Suspense>
        </div>
      </div>
    </div>
  );
}