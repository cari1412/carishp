import productFragment from '../fragments/product';
import seoFragment from '../fragments/seo';

const collectionFragment = /* GraphQL */ `
  fragment collection on Collection {
    handle
    title
    description
    seo {
      ...seo
    }
    updatedAt
  }
  ${seoFragment}
`;

export const getCollectionQuery = /* GraphQL */ `
  query getCollection($handle: String!) {
    collection(handle: $handle) {
      ...collection
    }
  }
  ${collectionFragment}
`;

export const getCollectionsQuery = /* GraphQL */ `
  query getCollections {
    collections(first: 100, sortKey: TITLE) {
      edges {
        node {
          ...collection
        }
      }
    }
  }
  ${collectionFragment}
`;

export const getCollectionProductsQuery = /* GraphQL */ `
  query getCollectionProducts(
    $handle: String!
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) {
    collection(handle: $handle) {
      products(
        sortKey: $sortKey
        reverse: $reverse
        first: 100
        filters: $filters
      ) {
        edges {
          node {
            ...product
          }
        }
      }
    }
  }
  ${productFragment}
`;

// Запрос для получения доступных фильтров коллекции
export const getCollectionFiltersQuery = /* GraphQL */ `
  query getCollectionFilters($handle: String!) {
    collection(handle: $handle) {
      products(first: 250) {
        edges {
          node {
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
            options {
              name
              values
            }
            availableForSale
            variants(first: 250) {
              edges {
                node {
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;