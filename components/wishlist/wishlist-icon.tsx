'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useFavoritesStore } from 'store/favorites';
import WishlistModal from './wishlist-modal';

export default function WishlistIcon() {
  const { getFavoritesCount, isHydrated } = useFavoritesStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const favoritesCount = isHydrated ? getFavoritesCount() : 0;

  return (
    <>
      {/* Wishlist Button */}
      <div className="relative flex flex-col items-center justify-center">
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative flex flex-col items-center justify-center h-16 px-4 transition-all duration-200 hover:bg-white/20 hover:scale-105 focus:scale-105 text-white border-0 focus:outline-none"
          aria-label="Wishlist"
        >
          <Heart className="w-8 h-8 mb-1" />
          <span className="text-xs font-medium">Wishlist</span>
          
          {/* Badge */}
          {favoritesCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-2 bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
            >
              {favoritesCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Wishlist Modal */}
      <WishlistModal 
        isOpen={isModalOpen} 
        onCloseAction={() => setIsModalOpen(false)} 
      />
    </>
  );
}