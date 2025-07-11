// components/product-sections.tsx
'use client';

import { Product } from 'lib/shopify/types';
import { ProductSection } from './product-section';

interface ProductSectionsProps {
  bestSellers: Product[];
  specialOffers: Product[];
  newArrivals: Product[];
}

export function ProductSections({ bestSellers, specialOffers, newArrivals }: ProductSectionsProps) {
  return (
    <>
      {/* Best Sellers Section */}
      <ProductSection
        title="Best Sellers"
        products={bestSellers}
        badge={{
          text: "HOT",
          className: "bg-red-500"
        }}
      />

      {/* Special Offers Section */}
      <ProductSection
        title="Special Offers"
        products={specialOffers}
        badge={{
          text: "SALE",
          className: "bg-purple-600"
        }}
      />

      {/* New Arrivals Section */}
      <ProductSection
        title="New Arrivals"
        products={newArrivals}
        badge={{
          text: "NEW",
          className: "bg-green-600"
        }}
      />
    </>
  );
}