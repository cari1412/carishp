'use client';

import FilterBar from './filter-bar';
import FilterSidebar from './filter-sidebar';

type FilterSection = {
  id: string;
  name: string;
  options: Array<{
    name: string;
    value: string;
  }>;
};

type CollectionClientWrapperProps = {
  filters: FilterSection[];
  priceRange: { min: number; max: number };
  sorting: Array<{ title: string; slug: string | null; sortKey: string; reverse: boolean }>;
  totalProducts: number;
  collectionTitle: string;
  collectionDescription?: string;
  children: React.ReactNode;
};

export default function CollectionClientWrapper({ 
  filters,
  priceRange,
  sorting,
  totalProducts,
  collectionTitle,
  collectionDescription,
  children
}: CollectionClientWrapperProps) {
  return (
    <>
      {/* Collection Header - не sticky, скроллится */}
      <div className="mx-auto max-w-screen-2xl px-4 pt-4 pb-4 md:pt-6 md:pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
          {collectionTitle}
        </h1>
        {collectionDescription && (
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {collectionDescription}
          </p>
        )}
      </div>
      
      {/* Sticky container для FilterBar */}
      <div className="sticky top-[60px] md:top-24 z-40 bg-white dark:bg-black">
        <FilterBar 
          sorting={sorting}
          totalProducts={totalProducts}
        />
      </div>
      
      {/* Filter Sidebar */}
      <FilterSidebar
        filters={filters}
        priceRange={priceRange}
        sorting={sorting}
      />
      
      {/* Products */}
      <div className="pt-4">
        {children}
      </div>
    </>
  );
}