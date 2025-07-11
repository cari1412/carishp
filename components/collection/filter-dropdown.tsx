'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

type FilterDropdownProps = {
  label: string;
  options: Array<{ label: string; value: string; count?: number }>;
  selectedValues: string[];
  priceRange?: boolean;
  minPrice?: number;
  maxPrice?: number;
  updateFilter?: (values: string[]) => void;
  updatePriceFilter?: (min: number, max: number) => void;
};

export default function FilterDropdown({ 
  label, 
  options, 
  selectedValues, 
  priceRange = false,
  minPrice,
  maxPrice,
  updateFilter,
  updatePriceFilter
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice || 0);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice || 1000);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = (value: string) => {
    if (!updateFilter) return;
    
    if (selectedValues.includes(value)) {
      updateFilter(selectedValues.filter(v => v !== value));
    } else {
      updateFilter([...selectedValues, value]);
    }
  };

  const handlePriceUpdate = () => {
    if (updatePriceFilter) {
      updatePriceFilter(localMinPrice, localMaxPrice);
    }
  };

  const hasSelection = selectedValues.length > 0 || (priceRange && (localMinPrice > 0 || localMaxPrice < 1000));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-1 text-sm transition-colors',
          hasSelection ? 'text-black dark:text-white font-medium' : 'hover:text-black dark:hover:text-white'
        )}
      >
        <span>{label}</span>
        <ChevronDownIcon className={clsx('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg z-50">
          {priceRange ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <input
                    type="number"
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(Number(e.target.value))}
                    onBlur={handlePriceUpdate}
                    className="w-full rounded border border-neutral-300 pl-6 pr-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="Min"
                  />
                </div>
                <span className="text-sm">-</span>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <input
                    type="number"
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                    onBlur={handlePriceUpdate}
                    className="w-full rounded border border-neutral-300 pl-6 pr-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="Max"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  handlePriceUpdate();
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded hover:opacity-90 transition-opacity text-sm"
              >
                Apply
              </button>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto py-2">
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleCheckboxChange(option.value)}
                    className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700 dark:text-white dark:focus:ring-white"
                  />
                  <span className="text-sm">
                    {option.label}
                    {option.count !== undefined && (
                      <span className="ml-1 text-xs text-neutral-500">({option.count})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}