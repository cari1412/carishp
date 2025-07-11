'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { createUrl } from 'lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type FilterOption = {
  name: string;
  value: string;
  count?: number;
};

type FilterSection = {
  id: string;
  name: string;
  options: FilterOption[];
};

type FilterSidebarProps = {
  filters: FilterSection[];
  priceRange?: { min: number; max: number };
  sorting: Array<{ title: string; slug: string | null; sortKey: string; reverse: boolean }>;
};

// Event name для коммуникации с FilterBar
const FILTER_SIDEBAR_TOGGLE_EVENT = 'filter-sidebar-toggle';

export default function FilterSidebar({ 
  filters, 
  priceRange,
  sorting 
}: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Локальное состояние для открытия/закрытия
  const [isOpen, setIsOpen] = useState(false);
  
  const [minPrice, setMinPrice] = useState(
    searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : priceRange?.min || 0
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : priceRange?.max || 1000
  );

  // Слушаем события от FilterBar
  useEffect(() => {
    const handleToggle = (event: CustomEvent) => {
      if (event.detail?.open) {
        setIsOpen(true);
      }
    };

    window.addEventListener(FILTER_SIDEBAR_TOGGLE_EVENT as any, handleToggle);
    return () => {
      window.removeEventListener(FILTER_SIDEBAR_TOGGLE_EVENT as any, handleToggle);
    };
  }, []);

  // Update price states when URL changes
  useEffect(() => {
    setMinPrice(
      searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : priceRange?.min || 0
    );
    setMaxPrice(
      searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : priceRange?.max || 1000
    );
  }, [searchParams, priceRange]);

  // Get active filters
  const getActiveFilters = (filterId: string): string[] => {
    const param = searchParams.get(filterId);
    return param ? param.split(',') : [];
  };

  // Update filters
  const updateFilters = (filterId: string, value: string, isActive: boolean) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const currentValues = getActiveFilters(filterId);
    
    if (isActive) {
      const updatedValues = currentValues.filter(v => v !== value);
      if (updatedValues.length > 0) {
        newParams.set(filterId, updatedValues.join(','));
      } else {
        newParams.delete(filterId);
      }
    } else {
      newParams.set(filterId, [...currentValues, value].join(','));
    }
    
    router.push(createUrl(pathname, newParams));
  };

  // Update price filter
  const updatePriceFilter = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (minPrice > (priceRange?.min || 0) || maxPrice < (priceRange?.max || 1000)) {
      newParams.set('minPrice', minPrice.toString());
      newParams.set('maxPrice', maxPrice.toString());
    } else {
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
    }
    
    router.push(createUrl(pathname, newParams));
  };

  // Update sort
  const updateSort = (slug: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (slug) {
      newParams.set('sort', slug);
    } else {
      newParams.delete('sort');
    }
    router.push(createUrl(pathname, newParams));
  };

  // Clear all filters
  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = Array.from(searchParams.entries()).some(
    ([key]) => !['sort', 'q'].includes(key)
  );

  const currentSort = searchParams.get('sort') || 'recommended';

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sidebar */}
      <div
        className={clsx(
          'fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-black z-50 shadow-xl transition-transform',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold">Filters</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-180px)]">
          <div className="p-6 space-y-8">
            {/* Sort section */}
            <div>
              <h3 className="text-sm font-medium mb-4">Sort by: Recommended</h3>
              <div className="space-y-2">
                {sorting.map((option) => (
                  <label
                    key={option.slug || 'default'}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="sort"
                      checked={currentSort === (option.slug || 'recommended')}
                      onChange={() => updateSort(option.slug)}
                      className="h-4 w-4 text-black focus:ring-black dark:text-white dark:focus:ring-white"
                    />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                      {option.title}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price filter */}
            {priceRange && (
              <div>
                <h3 className="text-sm font-medium mb-4">Price</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        onBlur={updatePriceFilter}
                        className="w-full rounded-lg border border-neutral-300 pl-8 pr-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="Min"
                        min={priceRange.min}
                        max={priceRange.max}
                      />
                    </div>
                    <span className="text-sm text-neutral-500">-</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        onBlur={updatePriceFilter}
                        className="w-full rounded-lg border border-neutral-300 pl-8 pr-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        placeholder="Max"
                        min={priceRange.min}
                        max={priceRange.max}
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    onMouseUp={updatePriceFilter}
                    onTouchEnd={updatePriceFilter}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>${priceRange.min}</span>
                    <span>${priceRange.max}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Other filters */}
            {filters.map((section) => {
              const activeFilters = getActiveFilters(section.id);
              
              return (
                <div key={section.id}>
                  <h3 className="text-sm font-medium mb-4">
                    {section.name}
                    {activeFilters.length > 0 && (
                      <span className="ml-2 text-xs text-neutral-500">
                        ({activeFilters.length})
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {section.options.map((option) => {
                      const isActive = activeFilters.includes(option.value);
                      
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => updateFilters(section.id, option.value, isActive)}
                            className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700 dark:text-white dark:focus:ring-white"
                          />
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                            {option.name}
                            {option.count !== undefined && (
                              <span className="ml-1 text-xs">({option.count})</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Availability filter */}
            <div>
              <h3 className="text-sm font-medium mb-4">Availability</h3>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={searchParams.get('available') === 'true'}
                  onChange={(e) => {
                    const newParams = new URLSearchParams(searchParams.toString());
                    if (e.target.checked) {
                      newParams.set('available', 'true');
                    } else {
                      newParams.delete('available');
                    }
                    router.push(createUrl(pathname, newParams));
                  }}
                  className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700 dark:text-white dark:focus:ring-white"
                />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                  Currently in stock
                </span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
          <div className="flex items-center justify-between">
            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset filters
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
            >
              View {searchParams.get('q') ? 'results' : 'products'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}