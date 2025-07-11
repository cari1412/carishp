// components/layout/navbar/mobile-bottom-nav.tsx
'use client';

import AuthModal from '@/app/auth/auth-modal';
import { useCustomer } from '@/lib/shopify/customer-context';
import {
  HeartIcon,
  HomeIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  HomeIcon as HomeIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';
import { useCart } from 'components/cart/cart-context';
import WishlistModal from 'components/wishlist/wishlist-modal';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useFavoritesStore } from 'store/favorites';

const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Catalog',
    href: '/catalog',
    icon: Squares2X2Icon,
    activeIcon: Squares2X2IconSolid,
  },
  {
    name: 'Wishlist',
    href: '/wishlist',
    icon: HeartIcon,
    activeIcon: HeartIconSolid,
    showFavoritesBadge: true,
    isModal: true,
    requiresAuth: true,
  },
  {
    name: 'Cart',
    href: '/cart',
    icon: ShoppingCartIcon,
    activeIcon: ShoppingCartIconSolid,
    showCartBadge: true,
  },
  {
    name: 'Profile',
    href: '/account',
    icon: UserIcon,
    activeIcon: UserIconSolid,
    requiresAuth: true,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const { getFavoritesCount, isHydrated } = useFavoritesStore();
  const { isAuthenticated } = useCustomer();
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalProps, setAuthModalProps] = useState({
    title: "Sign in to continue",
    description: "Create an account or sign in to access this feature"
  });
  
  const totalQuantity = cart?.lines.reduce((total, line) => total + line.quantity, 0) || 0;
  const favoritesCount = isHydrated ? getFavoritesCount() : 0;

  const handleNavClick = (e: React.MouseEvent, item: typeof navigationItems[0]) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault();
      
      // Customize auth modal based on which item was clicked
      if (item.name === 'Wishlist') {
        setAuthModalProps({
          title: "Sign in to view your wishlist",
          description: "Create an account or sign in to save and sync your favorite items across all your devices"
        });
      } else if (item.name === 'Profile') {
        setAuthModalProps({
          title: "Sign in to your account",
          description: "Access your orders, settings, and personal information"
        });
      }
      
      setShowAuthModal(true);
    } else if (item.isModal) {
      e.preventDefault();
      setIsWishlistModalOpen(true);
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 z-50">
        <nav className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = isActive ? item.activeIcon : item.icon;
            
            const linkContent = (
              <>
                <div className="relative">
                  <Icon 
                    className={`h-6 w-6 ${
                      isActive || (item.isModal && isWishlistModalOpen)
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`} 
                  />
                  {/* Cart Badge */}
                  {item.showCartBadge && totalQuantity > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                      {totalQuantity > 99 ? '99+' : totalQuantity}
                    </span>
                  )}
                  {/* Favorites Badge - только для авторизованных */}
                  {item.showFavoritesBadge && isAuthenticated && favoritesCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-medium">
                      {favoritesCount > 99 ? '99+' : favoritesCount}
                    </span>
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 ${
                    isActive || (item.isModal && isWishlistModalOpen)
                      ? 'text-purple-600 dark:text-purple-400 font-medium' 
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {item.name}
                </span>
              </>
            );

            if (item.isModal || item.requiresAuth) {
              return (
                <button
                  key={item.name}
                  onClick={(e) => handleNavClick(e, item)}
                  className="flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 relative"
                >
                  {linkContent}
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 relative"
              >
                {linkContent}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Wishlist Modal */}
      <WishlistModal 
        isOpen={isWishlistModalOpen} 
        onCloseAction={() => setIsWishlistModalOpen(false)} 
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        title={authModalProps.title}
        description={authModalProps.description}
      />
    </>
  );
}