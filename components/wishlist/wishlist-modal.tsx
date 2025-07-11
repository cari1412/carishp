'use client';

import { Dialog, Transition } from '@headlessui/react';
import Price from 'components/price';
import { motion } from 'framer-motion';
import { Heart, LogIn, ShoppingCart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Fragment } from 'react';
import { useFavoritesStore } from 'store/favorites';

interface WishlistModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
}

// Mock auth check - замените на вашу реальную проверку авторизации
const useAuth = () => {
  // TODO: Implement real auth check
  return { isAuthenticated: false, user: null };
};

export default function WishlistModal({ isOpen, onCloseAction }: WishlistModalProps) {
  const { favorites, removeFromFavorites, clearFavorites, isHydrated } = useFavoritesStore();
  const { isAuthenticated } = useAuth();
  
  // Используем локальное состояние для избранных товаров после гидратации
  const displayFavorites = isHydrated ? favorites : [];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onCloseAction} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-black shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                    <Dialog.Title className="text-xl font-semibold">
                      My Wishlist ({displayFavorites.length})
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onCloseAction}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {!isAuthenticated ? (
                    // Not Authenticated View
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <Heart className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-2">Sign in to view your wishlist</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
                        Create an account or sign in to save and sync your favorite items across all your devices
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                          href="/login"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          onClick={onCloseAction}
                        >
                          <LogIn className="w-5 h-5" />
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          onClick={onCloseAction}
                        >
                          Create Account
                        </Link>
                      </div>
                      {displayFavorites.length > 0 && (
                        <p className="mt-6 text-sm text-neutral-500">
                          You have {displayFavorites.length} items waiting in your wishlist
                        </p>
                      )}
                    </div>
                  ) : displayFavorites.length === 0 ? (
                    // Empty Wishlist
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center">
                        <Heart className="w-10 h-10 text-neutral-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        Start adding items you love to your wishlist
                      </p>
                      <button
                        onClick={onCloseAction}
                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  ) : (
                    // Wishlist Items
                    <>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {displayFavorites.map((product) => (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="flex gap-4 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-shadow"
                          >
                            {/* Product Image */}
                            <Link 
                              href={`/product/${product.handle}`}
                              className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
                              onClick={onCloseAction}
                            >
                              {product.featuredImage && (
                                <Image
                                  src={product.featuredImage.url}
                                  alt={product.featuredImage.altText || product.title}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </Link>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/product/${product.handle}`}
                                onClick={onCloseAction}
                              >
                                <h4 className="font-medium hover:underline line-clamp-1">
                                  {product.title}
                                </h4>
                              </Link>
                              {product.description && (
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
                                  {product.description}
                                </p>
                              )}
                              <div className="mt-2">
                                <Price
                                  amount={product.priceRange.minVariantPrice.amount}
                                  currencyCode={product.priceRange.minVariantPrice.currencyCode}
                                  className="text-lg font-medium"
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Link
                                href={`/product/${product.handle}`}
                                className="p-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-90 transition-opacity"
                                onClick={onCloseAction}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => removeFromFavorites(product.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                aria-label="Remove from wishlist"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between">
                        <button
                          onClick={clearFavorites}
                          className="text-sm text-red-500 hover:text-red-600 transition-colors"
                        >
                          Clear Wishlist
                        </button>
                        <button
                          onClick={onCloseAction}
                          className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}