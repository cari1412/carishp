import {
  HIDDEN_PRODUCT_TAG,
  SHOPIFY_GRAPHQL_API_ENDPOINT,
  TAGS
} from 'lib/constants';
import { isShopifyError } from 'lib/type-guards';
import { ensureStartsWith } from 'lib/utils';
import {
  revalidateTag
} from 'next/cache';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation
} from './mutations/cart';
import { getCartQuery } from './queries/cart';
import {
  getCollectionFiltersQuery,
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery
} from './queries/collection';
import { getMenuQuery } from './queries/menu';
import { getPageQuery, getPagesQuery } from './queries/page';
import {
  getProductQuery,
  getProductRecommendationsQuery,
  getProductsQuery
} from './queries/product';
import {
  Cart,
  Collection,
  CollectionFilters,
  Connection,
  Image,
  Menu,
  Page,
  Product,
  ProductFilter,
  ShopifyAddToCartOperation,
  ShopifyCart,
  ShopifyCartOperation,
  ShopifyCollection,
  ShopifyCollectionFiltersOperation,
  ShopifyCollectionOperation,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyCreateCartOperation,
  ShopifyMenuOperation,
  ShopifyPageOperation,
  ShopifyPagesOperation,
  ShopifyProduct,
  ShopifyProductOperation,
  ShopifyProductRecommendationsOperation,
  ShopifyProductsOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation
} from './types';

const domain = process.env.SHOPIFY_STORE_DOMAIN
  ? ensureStartsWith(process.env.SHOPIFY_STORE_DOMAIN, 'https://')
  : '';
const endpoint = `${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;
const key = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

type ExtractVariables<T> = T extends { variables: object }
  ? T['variables']
  : never;

export async function shopifyFetch<T>({
  headers,
  query,
  variables
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
    console.log('Shopify request to:', endpoint);
    console.log('Variables:', variables);
    
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
        ...headers
      },
      body: JSON.stringify({
        ...(query && { query }),
        ...(variables && { variables })
      })
    });

    const body = await result.json();
    console.log('Shopify response:', JSON.stringify(body, null, 2));

    if (body.errors) {
      console.error('Shopify GraphQL errors:', body.errors);
      throw body.errors[0];
    }

    return {
      status: result.status,
      body
    };
  } catch (e) {
    console.error('Shopify fetch error:', e);
    
    if (isShopifyError(e)) {
      throw {
        cause: e.cause?.toString() || 'unknown',
        status: e.status || 500,
        message: e.message,
        query
      };
    }

    throw {
      error: e,
      query
    };
  }
}

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines)
  };
};

const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`
  };
};

const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
};

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) => {
  if (!product) {
    console.log('❌ Product is null or undefined');
    return undefined;
  }

  // Детальная отладка
  console.log('🔍 Processing product:', {
    title: product.title,
    handle: product.handle,
    availableForSale: product.availableForSale,
    variantsCount: product.variants?.edges?.length || 0,
    availableVariants: product.variants?.edges?.filter(
      (v) => v.node.availableForSale
    ).length || 0,
    tags: product.tags,
    hasHiddenTag: product.tags?.includes(HIDDEN_PRODUCT_TAG) || false
  });

  // Проверка на скрытый тег
  if (filterHiddenProducts && product.tags?.includes(HIDDEN_PRODUCT_TAG)) {
    console.log(`❌ Product "${product.title}" hidden by tag`);
    return undefined;
  }

  // ВРЕМЕННО ОТКЛЮЧАЕМ проверку availableForSale для отладки
  // Раскомментируйте эти строки после решения проблемы
  /*
  if (!product.availableForSale) {
    console.log(`❌ Product "${product.title}" not available for sale`);
    return undefined;
  }

  // Проверка наличия доступных вариантов
  const availableVariants = product.variants?.edges?.filter(
    (v) => v.node.availableForSale
  );
  
  if (!availableVariants || availableVariants.length === 0) {
    console.log(`❌ Product "${product.title}" has no available variants`);
    return undefined;
  }
  */

  const { images, variants, ...rest } = product;

  console.log(`✅ Product "${product.title}" passed all checks`);
  
  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants)
  };
};

const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation
  });

  return reshapeCart(res.body.data.cartCreate.cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines
    }
  });
  return reshapeCart(res.body.data.cartLinesAdd.cart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds
    }
  });

  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!;
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines
    }
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getCart(): Promise<Cart | undefined> {
  const cartId = (await cookies()).get('cartId')?.value;

  if (!cartId) {
    return undefined;
  }

  try {
    const res = await shopifyFetch<ShopifyCartOperation>({
      query: getCartQuery,
      variables: { cartId }
    });

    // Old carts becomes `null` when you checkout.
    if (!res.body.data.cart) {
      return undefined;
    }

    return reshapeCart(res.body.data.cart);
  } catch (error) {
    console.error('Error getting cart:', error);
    return undefined;
  }
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  try {
    const res = await shopifyFetch<ShopifyCollectionOperation>({
      query: getCollectionQuery,
      variables: {
        handle
      }
    });

    return reshapeCollection(res.body.data.collection);
  } catch (error) {
    console.error(`Error getting collection ${handle}:`, error);
    return undefined;
  }
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey,
  filters
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
  filters?: CollectionFilters;
}): Promise<Product[]> {
  try {
    console.log(`📦 Getting products for collection: ${collection}`);
    
    // Строим массив фильтров для GraphQL
    const productFilters: ProductFilter[] = [];
    
    if (filters) {
      // Фильтр по цене
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        productFilters.push({
          price: {
            ...(filters.minPrice && { min: filters.minPrice }),
            ...(filters.maxPrice && { max: filters.maxPrice })
          }
        });
      }
      
      // Фильтр по наличию
      if (filters.available) {
        productFilters.push({
          available: true
        });
      }
      
      // Фильтры по вариантам (размер, цвет и т.д.)
      if (filters.size && filters.size.length > 0) {
        productFilters.push({
          variantOption: {
            name: 'Size',
            value: filters.size
          }
        });
      }
      
      if (filters.color && filters.color.length > 0) {
        productFilters.push({
          variantOption: {
            name: 'Color',
            value: filters.color
          }
        });
      }
    }
    
    const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
      query: getCollectionProductsQuery,
      variables: {
        handle: collection,
        reverse,
        sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey,
        ...(productFilters.length > 0 && { filters: productFilters })
      }
    });

    if (!res.body.data.collection) {
      console.log(`No collection found for \`${collection}\``);
      return [];
    }

    const rawProducts = removeEdgesAndNodes(res.body.data.collection.products);
    console.log(`📊 Found ${rawProducts.length} raw products in collection "${collection}"`);
    
    const reshapedProducts = reshapeProducts(rawProducts);
    console.log(`✅ Reshaped ${reshapedProducts.length} products for display`);
    
    return reshapedProducts;
  } catch (error) {
    console.error(`Error getting collection products for ${collection}:`, error);
    return [];
  }
}

// Новая функция для получения доступных фильтров коллекции
export async function getCollectionFilters(handle: string): Promise<{
  priceRange: { min: number; max: number };
  sizes: string[];
  colors: string[];
  options: { name: string; values: string[] }[];
}> {
  try {
    const res = await shopifyFetch<ShopifyCollectionFiltersOperation>({
      query: getCollectionFiltersQuery,
      variables: { handle }
    });

    if (!res.body.data.collection) {
      return {
        priceRange: { min: 0, max: 1000 },
        sizes: [],
        colors: [],
        options: []
      };
    }

    const products = removeEdgesAndNodes(res.body.data.collection.products);
    
    // Вычисляем диапазон цен
    let minPrice = Infinity;
    let maxPrice = 0;
    const allOptions: { [key: string]: Set<string> } = {};
    
    products.forEach((product: any) => {
      // Цены
      const productMinPrice = parseFloat(product.priceRange.minVariantPrice.amount);
      const productMaxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
      
      if (productMinPrice < minPrice) minPrice = productMinPrice;
      if (productMaxPrice > maxPrice) maxPrice = productMaxPrice;
      
      // Опции (размеры, цвета и т.д.)
      if (product.options && Array.isArray(product.options)) {
        product.options.forEach((option: any) => {
          if (option && option.name && option.values) {
            if (!allOptions[option.name]) {
              allOptions[option.name] = new Set();
            }
            if (Array.isArray(option.values)) {
              option.values.forEach((value: string) => {
                if (value) {
                  const optionSet = allOptions[option.name];
                  if (optionSet) {
                    optionSet.add(value);
                  }
                }
              });
            }
          }
        });
      }
    });
    
    // Преобразуем опции в массивы
    const options = Object.entries(allOptions).map(([name, values]) => ({
      name,
      values: Array.from(values).sort()
    }));
    
    // Извлекаем размеры и цвета
    const sizeOption = options.find(o => o.name.toLowerCase() === 'size');
    const colorOption = options.find(o => o.name.toLowerCase() === 'color');
    
    return {
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: maxPrice === 0 ? 1000 : Math.ceil(maxPrice)
      },
      sizes: sizeOption?.values || [],
      colors: colorOption?.values || [],
      options
    };
  } catch (error) {
    console.error(`Error getting collection filters for ${handle}:`, error);
    return {
      priceRange: { min: 0, max: 1000 },
      sizes: [],
      colors: [],
      options: []
    };
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const res = await shopifyFetch<ShopifyCollectionsOperation>({
      query: getCollectionsQuery
    });
    
    const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections);
    const collections = [
      {
        handle: '',
        title: 'All',
        description: 'All products',
        seo: {
          title: 'All',
          description: 'All products'
        },
        path: '/search',
        updatedAt: new Date().toISOString()
      },
      // Filter out the `hidden` collections.
      // Collections that start with `hidden-*` need to be hidden on the search page.
      ...reshapeCollections(shopifyCollections).filter(
        (collection) => !collection.handle.startsWith('hidden')
      )
    ];

    return collections;
  } catch (error) {
    console.error('Error getting collections:', error);
    return [
      {
        handle: '',
        title: 'All',
        description: 'All products',
        seo: {
          title: 'All',
          description: 'All products'
        },
        path: '/search',
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export async function getMenu(handle: string): Promise<Menu[]> {
  try {
    const res = await shopifyFetch<ShopifyMenuOperation>({
      query: getMenuQuery,
      variables: {
        handle
      }
    });

    return (
      res.body?.data?.menu?.items.map((item: { title: string; url: string }) => ({
        title: item.title,
        path: item.url
          .replace(domain, '')
          .replace('/collections', '/search')
          .replace('/pages', '')
      })) || []
    );
  } catch (error) {
    console.error(`Error getting menu ${handle}:`, error);
    return [];
  }
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    variables: { handle }
  });

  return res.body.data.pageByHandle;
}

export async function getPages(): Promise<Page[]> {
  try {
    const res = await shopifyFetch<ShopifyPagesOperation>({
      query: getPagesQuery
    });

    return removeEdgesAndNodes(res.body.data.pages);
  } catch (error) {
    console.error('Error getting pages:', error);
    return [];
  }
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  try {
    const res = await shopifyFetch<ShopifyProductOperation>({
      query: getProductQuery,
      variables: {
        handle
      }
    });

    return reshapeProduct(res.body.data.product, false);
  } catch (error) {
    console.error(`Error getting product ${handle}:`, error);
    return undefined;
  }
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  try {
    const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
      query: getProductRecommendationsQuery,
      variables: {
        productId
      }
    });

    return reshapeProducts(res.body.data.productRecommendations);
  } catch (error) {
    console.error(`Error getting product recommendations for ${productId}:`, error);
    return [];
  }
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  try {
    const res = await shopifyFetch<ShopifyProductsOperation>({
      query: getProductsQuery,
      variables: {
        query,
        reverse,
        sortKey
      }
    });

    return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'collections/create',
    'collections/delete',
    'collections/update'
  ];
  const productWebhooks = [
    'products/create',
    'products/delete',
    'products/update'
  ];
  const topic = (await headers()).get('x-shopify-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections);
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products);
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}