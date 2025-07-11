'use client';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { createUrl } from 'lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import FilterDropdown from './filter-dropdown';

type FilterBarProps = {
  sorting: Array<{ title: string; slug: string | null; sortKey: string; reverse: boolean }>;
  totalProducts: number;
};

// Создаем event bus для коммуникации между компонентами
const FILTER_SIDEBAR_TOGGLE_EVENT = 'filter-sidebar-toggle';

export default function FilterBar({ 
  sorting, 
  totalProducts
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSticky, setIsSticky] = useState(false);
  
  // Отслеживаем, когда FilterBar становится sticky
  useEffect(() => {
    let lastScrollY = 0;
    const stickyOffset = window.innerWidth < 768 ? 60 : 96; // 60px для мобильной, 96px (h-24) для десктоп версии
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Определяем, когда элемент должен стать sticky
      // Это происходит когда скролл больше чем высота заголовка коллекции
      const headerHeight = 200; // Примерная высота заголовка
      setIsSticky(currentScrollY > headerHeight);
      
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Проверяем начальное состояние

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Функция для открытия sidebar через custom event
  const openFilterSidebar = () => {
    window.dispatchEvent(new CustomEvent(FILTER_SIDEBAR_TOGGLE_EVENT, { detail: { open: true } }));
  };
  
  // Получаем текущую сортировку
  const currentSort = searchParams.get('sort') || 'recommended';
  
  // Получаем все активные фильтры
  const activeFilters: { key: string; value: string; label: string }[] = [];
  
  // Price filters
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  if (minPrice || maxPrice) {
    activeFilters.push({
      key: 'price',
      value: `${minPrice || '0'}-${maxPrice || '∞'}`,
      label: `$${minPrice || '0'} - $${maxPrice || '∞'}`
    });
  }
  
  // Size filters
  const sizes = searchParams.get('size');
  if (sizes) {
    sizes.split(',').forEach(size => {
      activeFilters.push({
        key: 'size',
        value: size,
        label: `Size: ${size}`
      });
    });
  }
  
  // Color filters
  const colors = searchParams.get('color');
  if (colors) {
    colors.split(',').forEach(color => {
      activeFilters.push({
        key: 'color',
        value: color,
        label: `Color: ${color}`
      });
    });
  }
  
  // Availability filter
  if (searchParams.get('available') === 'true') {
    activeFilters.push({
      key: 'available',
      value: 'true',
      label: 'In stock'
    });
  }

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

  // Update filter
  const updateFilter = (key: string, values: string[]) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (values.length > 0) {
      newParams.set(key, values.join(','));
    } else {
      newParams.delete(key);
    }
    router.push(createUrl(pathname, newParams));
  };

  // Update price filter
  const updatePriceFilter = (min: number, max: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (min > 0 || max < 1000) {
      newParams.set('minPrice', min.toString());
      newParams.set('maxPrice', max.toString());
    } else {
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
    }
    router.push(createUrl(pathname, newParams));
  };

  // Remove single filter
  const removeFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (key === 'price') {
      newParams.delete('minPrice');
      newParams.delete('maxPrice');
    } else if (key === 'available') {
      newParams.delete('available');
    } else {
      const currentValues = newParams.get(key)?.split(',') || [];
      const updatedValues = currentValues.filter(v => v !== value);
      if (updatedValues.length > 0) {
        newParams.set(key, updatedValues.join(','));
      } else {
        newParams.delete(key);
      }
    }
    
    router.push(createUrl(pathname, newParams));
  };

  // Clear all filters
  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    // Keep only sort parameter
    const sort = searchParams.get('sort');
    if (sort) newParams.set('sort', sort);
    router.push(createUrl(pathname, newParams));
  };

  const hasActiveFilters = activeFilters.length > 0;

  // Mock data for filters - в реальном приложении это должно приходить из props
  const sizeOptions = [
    { label: 'Small', value: 'S' },
    { label: 'Medium', value: 'M' },
    { label: 'Large', value: 'L' },
    { label: 'X-Large', value: 'XL' }
  ];

  const colorOptions = [
    { label: 'Black', value: 'black' },
    { label: 'White', value: 'white' },
    { label: 'Blue', value: 'blue' },
    { label: 'Red', value: 'red' }
  ];

  return (
    <div 
      id="filter-bar"
      className={`
        bg-white dark:bg-black border-y border-neutral-200 dark:border-neutral-800 
        transition-shadow duration-200
        ${isSticky ? 'shadow-lg' : ''}
      `}
    >
      {/* Main filter bar */}
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex items-center h-14 gap-4">
          {/* Products count */}
          <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-4">
            {totalProducts} products
          </span>
          
          {/* Sort by section */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">Sort by:</span>
            <select
              value={currentSort}
              onChange={(e) => updateSort(e.target.value === 'recommended' ? null : e.target.value)}
              className="text-sm bg-transparent border-none focus:outline-none cursor-pointer hover:text-black dark:hover:text-white"
            >
              {sorting.map((option) => (
                <option key={option.slug || 'default'} value={option.slug || 'recommended'}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          
          {/* Separator */}
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
          
          {/* Basic filter dropdowns - скрываем на мобильных */}
          <div className="hidden md:flex items-center gap-3">
            <FilterDropdown
              label="Price"
              options={[]}
              selectedValues={[]}
              priceRange={true}
              minPrice={minPrice ? parseFloat(minPrice) : 0}
              maxPrice={maxPrice ? parseFloat(maxPrice) : 1000}
              updatePriceFilter={updatePriceFilter}
            />
            <FilterDropdown
              label="Serie"
              options={[]}
              selectedValues={[]}
              updateFilter={(values) => updateFilter('serie', values)}
            />
            <FilterDropdown
              label="Colour"
              options={colorOptions}
              selectedValues={colors ? colors.split(',') : []}
              updateFilter={(values) => updateFilter('color', values)}
            />
            <FilterDropdown
              label="Size"
              options={sizeOptions}
              selectedValues={sizes ? sizes.split(',') : []}
              updateFilter={(values) => updateFilter('size', values)}
            />
          </div>
          
          {/* Separator - скрываем на мобильных */}
          <div className="hidden md:block h-4 w-px bg-neutral-300 dark:bg-neutral-700" />
          
          {/* Filters button */}
          <button
            onClick={openFilterSidebar}
            className="flex items-center gap-2 text-sm hover:text-black dark:hover:text-white transition-colors ml-auto md:ml-0"
          >
            <span>Filters</span>
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Active filters section */}
      {hasActiveFilters && (
        <div className="mx-auto max-w-screen-2xl px-4 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 flex-wrap">
            {activeFilters.map((filter, index) => (
              <button
                key={`${filter.key}-${filter.value}-${index}`}
                onClick={() => removeFilter(filter.key, filter.value)}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <span>{filter.label}</span>
                <XMarkIcon className="h-3 w-3" />
              </button>
            ))}
            
            <button
              onClick={clearAllFilters}
              className="text-sm text-neutral-500 hover:text-black dark:hover:text-white transition-colors underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}