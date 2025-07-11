'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { createUrl } from 'lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

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

export default function AdvancedFilters({ 
  filters,
  priceRange 
}: { 
  filters: FilterSection[];
  priceRange?: { min: number; max: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [minPrice, setMinPrice] = useState(
    searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : priceRange?.min || 0
  );
  const [maxPrice, setMaxPrice] = useState(
    searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : priceRange?.max || 1000
  );
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    price: true,
    size: true,
    color: true,
    availability: true
  });

  // Получаем текущие активные фильтры из URL
  const getActiveFilters = (filterId: string): string[] => {
    const param = searchParams.get(filterId);
    return param ? param.split(',') : [];
  };

  // Toggle section open/close
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Обновляем URL с новыми фильтрами
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

  // Обновляем фильтр цены
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

  // Очистить все фильтры
  const clearAllFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = Array.from(searchParams.entries()).some(
    ([key]) => !['sort', 'q'].includes(key)
  );

  return (
    <div className="space-y-6">
      {/* Заголовок с кнопкой очистки */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-black dark:text-white">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Фильтр по цене */}
      {priceRange && (
        <div className="border-b border-neutral-200 dark:border-neutral-700 pb-6">
          <button
            className="flex w-full items-center justify-between py-2 text-sm text-black dark:text-white"
            onClick={() => toggleSection('price')}
          >
            <span>Price</span>
            <ChevronDownIcon
              className={clsx('h-4 w-4 transition-transform', {
                'rotate-180': openSections.price
              })}
            />
          </button>
          {openSections.price && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    onBlur={updatePriceFilter}
                    className="w-full rounded border border-neutral-300 pl-6 pr-2 py-1 text-sm dark:border-neutral-600 dark:bg-black"
                    placeholder="Min"
                    min={priceRange.min}
                    max={priceRange.max}
                  />
                </div>
                <span className="text-sm">-</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    onBlur={updatePriceFilter}
                    className="w-full rounded border border-neutral-300 pl-6 pr-2 py-1 text-sm dark:border-neutral-600 dark:bg-black"
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
            </div>
          )}
        </div>
      )}

      {/* Остальные фильтры */}
      {filters.map((section) => {
        const activeFilters = getActiveFilters(section.id);
        
        return (
          <div key={section.id} className="border-b border-neutral-200 dark:border-neutral-700 pb-6">
            <button
              className="flex w-full items-center justify-between py-2 text-sm text-black dark:text-white"
              onClick={() => toggleSection(section.id)}
            >
              <span>
                {section.name}
                {activeFilters.length > 0 && (
                  <span className="ml-1 text-xs text-neutral-500">
                    ({activeFilters.length})
                  </span>
                )}
              </span>
              <ChevronDownIcon
                className={clsx('h-4 w-4 transition-transform', {
                  'rotate-180': openSections[section.id]
                })}
              />
            </button>
            {openSections[section.id] && (
              <div className="pt-4 space-y-2">
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
                        className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600 dark:bg-black dark:focus:ring-white"
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
            )}
          </div>
        );
      })}

      {/* Фильтр наличия */}
      <div className="pb-6">
        <button
          className="flex w-full items-center justify-between py-2 text-sm text-black dark:text-white"
          onClick={() => toggleSection('availability')}
        >
          <span>Availability</span>
          <ChevronDownIcon
            className={clsx('h-4 w-4 transition-transform', {
              'rotate-180': openSections.availability
            })}
          />
        </button>
        {openSections.availability && (
          <div className="pt-4 space-y-2">
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
                className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-600 dark:bg-black dark:focus:ring-white"
              />
              <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                In stock
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}