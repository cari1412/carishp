'use client';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Product } from 'lib/shopify/types';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFavoritesStore } from 'store/favorites';
import { useNotificationStore } from 'store/notification';

interface WishlistButtonProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ 
  product, 
  className,
  size = 'md' 
}: WishlistButtonProps) {
  const { isFavorite, toggleFavorite, isHydrated } = useFavoritesStore();
  const { addNotification } = useNotificationStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // Проверяем состояние избранного при монтировании и изменениях
  useEffect(() => {
    if (isHydrated) {
      setIsFav(isFavorite(product.id));
    }
  }, [product.id, isFavorite, isHydrated]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAnimating(true);
    const newState = toggleFavorite(product);
    setIsFav(newState);
    
    // Показываем уведомление
    addNotification({
      type: 'success',
      title: newState ? 'Added to Wishlist' : 'Removed from Wishlist',
      message: newState 
        ? `${product.title} has been added to your wishlist`
        : `${product.title} has been removed from your wishlist`,
      duration: 3000
    });
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={handleClick}
      className={clsx(
        'relative group flex items-center justify-center rounded-full',
        'bg-white/80 backdrop-blur-sm',
        'border-2 border-transparent',
        'transition-all duration-200',
        'hover:bg-white hover:scale-110',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
        'active:scale-95',
        sizeClasses[size],
        className
      )}
      aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFav ? 'filled' : 'empty'}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ duration: 0.2 }}
        >
          <Heart
            className={clsx(
              iconSizes[size],
              'transition-colors duration-200',
              isFav 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-600 group-hover:text-red-500'
            )}
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Ripple effect on click */}
      {isAnimating && (
        <motion.span
          className="absolute inset-0 rounded-full bg-red-500/20"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </button>
  );
}