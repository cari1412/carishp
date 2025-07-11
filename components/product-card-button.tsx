// components/product-card-button.tsx
'use client';

import { CheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { addItem } from 'components/cart/actions';
import { useCart } from 'components/cart/cart-context';
import { Product, ProductVariant } from 'lib/shopify/types';
import { useCallback, useState, useTransition } from 'react';
import { useNotificationStore } from 'store/notification';
import { VariantModal } from './variant-modal';

interface ProductCardButtonProps {
  product: Product;
}

export function ProductCardButton({ product }: ProductCardButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { cart } = useCart();
  const { addNotification } = useNotificationStore();

  // Check if product has variants that need selection
  const hasMultipleVariants = product.variants.length > 1;
  const hasOptions = product.options.some(option => option.values.length > 1);
  const needsVariantSelection = hasMultipleVariants || hasOptions;

  // Get default variant if only one exists
  const defaultVariant = product.variants.length === 1 ? product.variants[0] : null;
  
  // Check if any variant is in cart
  const isProductInCart = cart?.lines.some(item => 
    product.variants.some(variant => variant.id === item.merchandise.id)
  ) ?? false;

  const handleAddToCart = useCallback(async (selectedVariant?: ProductVariant) => {
    const variantToAdd = selectedVariant || defaultVariant;
    
    if (!variantToAdd) return;

    startTransition(async () => {
      try {
        // Call the server action to add to Shopify cart
        const error = await addItem(null, variantToAdd.id);
        
        if (error) {
          addNotification({
            type: 'error',
            title: 'Error',
            message: error,
            duration: 3000
          });
        } else {
          addNotification({
            type: 'success',
            title: 'Added to cart!',
            message: `${product.title} has been added to your cart.`,
            duration: 2000
          });
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to add item to cart. Please try again.',
          duration: 3000
        });
      }
    });
  }, [defaultVariant, product, addNotification]);

  const handleButtonClick = useCallback(() => {
    if (!product.availableForSale) {
      // Handle notify me functionality
      addNotification({
        type: 'info',
        title: 'Notification set!',
        message: "We'll notify you when this item is back in stock.",
        duration: 2000
      });
      return;
    }

    if (needsVariantSelection) {
      setIsModalOpen(true);
    } else {
      handleAddToCart();
    }
  }, [product.availableForSale, needsVariantSelection, addNotification, handleAddToCart]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    handleAddToCart(variant);
    setIsModalOpen(false);
  }, [handleAddToCart]);

  const getButtonText = () => {
    if (!product.availableForSale) return 'Notify Me';
    if (isPending) return 'Adding...';
    if (isProductInCart) return 'Added';
    return 'Add to Cart';
  };

  const getButtonIcon = () => {
    if (!product.availableForSale) return <EnvelopeIcon className="w-4 h-4" />;
    if (isProductInCart) return <CheckIcon className="w-4 h-4" />;
    return null;
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isPending}
        className={clsx(
          'w-full py-2.5 px-4 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
          {
            // Out of stock - black background
            'bg-black text-white hover:bg-gray-800': !product.availableForSale,
            // Adding state
            'bg-blue-600 text-white cursor-wait': isPending && product.availableForSale,
            // Added state - green
            'bg-green-600 text-white': isProductInCart && !isPending && product.availableForSale,
            // Default state - blue
            'bg-blue-600 text-white hover:bg-blue-700': !isProductInCart && !isPending && product.availableForSale
          }
        )}
      >
        {getButtonIcon()}
        {getButtonText()}
      </button>

      {/* Variant Selection Modal */}
      <VariantModal
        isOpen={isModalOpen}
        onCloseAction={handleModalClose}
        product={product}
        onVariantSelectAction={handleVariantSelect}
      />
    </>
  );
}