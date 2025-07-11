import BannerCarousel from 'components/banner-carousel';
import Footer from 'components/layout/footer';
import { ProductSections } from 'components/product-sections';
import { getCollectionProducts } from 'lib/shopify';

export const metadata = {
  description:
    'High-performance ecommerce store built with Next.js, Vercel, and Shopify.',
  openGraph: {
    type: 'website'
  }
};

export default async function HomePage() {
  // Fetch products for different sections
  // You can adjust collection handles based on your Shopify setup
  const [bestSellersData, specialOffersData, newArrivalsData] = await Promise.all([
    getCollectionProducts({ collection: 'best-sellers' }).catch(() => []),
    getCollectionProducts({ collection: 'sale' }).catch(() => []),
    getCollectionProducts({ collection: 'new-arrivals' }).catch(() => [])
  ]);

  // If specific collections don't exist, fall back to featured items
  const fallbackProducts = await getCollectionProducts({ 
    collection: 'hidden-homepage-featured-items' 
  }).catch(() => []);

  const bestSellers = bestSellersData.length > 0 ? bestSellersData : fallbackProducts.slice(0, 8);
  const specialOffers = specialOffersData.length > 0 ? specialOffersData : fallbackProducts.slice(0, 8);
  const newArrivals = newArrivalsData.length > 0 ? newArrivalsData : fallbackProducts.slice(0, 8);

  return (
    <>
      {/* Banner Carousel Section */}
      <BannerCarousel />

      {/* Product Sections */}
      <ProductSections
        bestSellers={bestSellers}
        specialOffers={specialOffers}
        newArrivals={newArrivals}
      />

      <Footer />
    </>
  );
}