// components/product-section.tsx
'use client';

import { Product } from 'lib/shopify/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import WishlistButton from '../components/wishlist/wishlist-button';
import { GridTileImage } from './grid/tile';
import { ProductCardButton } from './product-card-button';

interface ProductSectionProps {
  title: string;
  products: Product[];
  badge?: {
    text: string;
    className: string;
  };
}

export function ProductSection({ title, products, badge }: ProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products?.length) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-4 pb-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="relative flex-none w-[250px] md:w-[280px] lg:w-[300px]"
            >
              <div className="group">
                {/* Favorite Button - Top Right */}
                <div className="absolute top-2 right-2 z-20">
                  <WishlistButton product={product} />
                </div>

                {/* Badge - Top Left */}
                {badge && (
                  <div className={`absolute top-2 left-2 z-10 px-3 py-1 text-xs font-bold text-white rounded-full ${badge.className}`}>
                    {badge.text}
                  </div>
                )}
                
                {/* Product Link */}
                <Link href={`/product/${product.handle}`} className="block">
                  {/* Product Image */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900 mb-3">
                    <GridTileImage
                      alt={product.title}
                      src={product.featuredImage?.url}
                      fill
                      sizes="(min-width: 1024px) 300px, (min-width: 768px) 280px, 250px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2 mb-3">
                    <h3 className="text-sm font-medium text-black dark:text-white line-clamp-2 group-hover:underline">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-black dark:text-white">
                        {product.priceRange.minVariantPrice.currencyCode} {product.priceRange.minVariantPrice.amount}
                      </span>
                      {/* Show compare price if exists */}
                      {product.compareAtPriceRange && product.compareAtPriceRange.minVariantPrice.amount > product.priceRange.minVariantPrice.amount && (
                        <span className="text-sm text-neutral-500 line-through">
                          {product.compareAtPriceRange.minVariantPrice.amount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Add to Cart Button - Centered below product info */}
                <div className="w-full">
                  <ProductCardButton product={product} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}