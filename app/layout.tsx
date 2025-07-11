// app/layout.tsx - обновленный файл
import { CartProvider } from 'components/cart/cart-context';
import { BreadcrumbNav } from 'components/layout/breadcrumbs';
import { Navbar } from 'components/layout/navbar';
import MobileBottomNav from 'components/layout/navbar/mobile-bottom-nav';
import NotificationContainer from 'components/notifications/notification-container';
import { WelcomeToast } from 'components/welcome-toast';
import { GeistSans } from 'geist/font/sans';
import { getCart } from 'lib/shopify';
import { baseUrl } from 'lib/utils';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from './providers';

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`
  },
  robots: {
    follow: true,
    index: true
  }
};

export default async function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="bg-neutral-50 text-black selection:bg-teal-300 dark:bg-neutral-900 dark:text-white dark:selection:bg-pink-500 dark:selection:text-white">
        <Providers>
          <CartProvider cartPromise={cart}>
            <Navbar />
            <BreadcrumbNav />
            <main className="pb-20 md:pb-0">
              {children}
              <Toaster closeButton />
              <WelcomeToast />
            </main>
            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
            {/* Notification Container for wishlist notifications */}
            <NotificationContainer />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}