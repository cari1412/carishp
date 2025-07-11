'use client';

import { useState } from 'react';
import MobileFiltersModal from './mobile-filters-modal';

type FilterSection = {
  id: string;
  name: string;
  options: Array<{
    name: string;
    value: string;
    count?: number;
  }>;
};

export default function MobileFiltersWrapper({
  filters,
  priceRange
}: {
  filters: FilterSection[];
  priceRange?: { min: number; max: number };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="fixed bottom-4 left-4 right-4 md:hidden">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-black text-white dark:bg-white dark:text-black py-3 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Mobile Filters Modal */}
      <MobileFiltersModal
        filters={filters}
        priceRange={priceRange}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}