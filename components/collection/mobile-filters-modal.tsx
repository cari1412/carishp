'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';
import AdvancedFilters from './advanced-filters';

type FilterSection = {
  id: string;
  name: string;
  options: Array<{
    name: string;
    value: string;
    count?: number;
  }>;
};

export default function MobileFiltersModal({
  filters,
  priceRange,
  isOpen,
  onClose
}: {
  filters: FilterSection[];
  priceRange?: { min: number; max: number };
  isOpen: boolean;
  onClose: () => void;
}) {
  // Блокируем скролл body когда модалка открыта
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-black z-50 md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-medium">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Filters Content */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-140px)]">
          <AdvancedFilters filters={filters} priceRange={priceRange} />
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="w-full bg-black text-white dark:bg-white dark:text-black py-3 px-4 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}