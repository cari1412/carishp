import CollectionClientWrapper from 'components/collection/collection-client-wrapper';
import MobileFiltersWrapper from 'components/collection/mobile-filters-wrapper';
import { GridTileImage } from 'components/grid/tile';
import Footer from 'components/layout/footer';
import { defaultSort, sorting } from 'lib/constants';
import { getCollection, getCollectionFilters, getCollectionProducts } from 'lib/shopify';
import { Product } from 'lib/shopify/types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.handle);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description: collection.seo?.description || collection.description || `${collection.title} products`,
  };
}

export default async function CollectionPage(props: { 
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort, minPrice, maxPrice, available, size, color } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;
  
  const collection = await getCollection(params.handle);

  if (!collection) return notFound();

  // Получаем данные для фильтров
  const filterData = await getCollectionFilters(params.handle);

  // Подготавливаем фильтры
  const filters = {
    ...(minPrice && { minPrice: parseFloat(minPrice) }),
    ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
    ...(available && { available: available === 'true' }),
    ...(size && { size: size.split(',') }),
    ...(color && { color: color.split(',') })
  };

  const products = await getCollectionProducts({
    collection: params.handle,
    sortKey,
    reverse,
    filters
  });

  // Преобразуем данные фильтров в формат для компонента
  const filterSections = filterData.options
    .filter(option => ['size', 'color'].includes(option.name.toLowerCase()))
    .map(option => ({
      id: option.name.toLowerCase(),
      name: option.name,
      options: option.values.map(value => ({
        name: value,
        value: value
      }))
    }));

  return (
    <>
      <div className="min-h-screen">
        <CollectionClientWrapper
          filters={filterSections}
          priceRange={filterData.priceRange}
          sorting={sorting}
          totalProducts={products.length}
          collectionTitle={collection.title}
          collectionDescription={collection.description}
        >
          {/* Products Grid */}
          <div className="mx-auto max-w-screen-2xl px-4">
            {products.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-neutral-500">No products found in this collection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product: Product) => (
                  <Link
                    key={product.handle}
                    href={`/product/${product.handle}`}
                    className="group"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                      <GridTileImage
                        alt={product.title}
                        label={{
                          title: product.title,
                          amount: product.priceRange.maxVariantPrice.amount,
                          currencyCode: product.priceRange.maxVariantPrice.currencyCode
                        }}
                        src={product.featuredImage?.url}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        product={product}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </CollectionClientWrapper>

        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <MobileFiltersWrapper 
            filters={filterSections}
            priceRange={filterData.priceRange}
          />
        </div>
      </div>
      
      <Footer />
    </>
  );
}