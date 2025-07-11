// components/size-selector-modal.tsx
'use client';

import { ProductVariant } from 'lib/shopify/types';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SizeSelectorModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  variants: ProductVariant[];
  onSizeSelectAction: (variant: ProductVariant) => void;
  productTitle: string;
}

export function SizeSelectorModal({ 
  isOpen, 
  onCloseAction, 
  variants, 
  onSizeSelectAction,
  productTitle 
}: SizeSelectorModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSizeSelect = (variant: ProductVariant) => {
    setSelectedSize(variant.id);
    setTimeout(() => {
      onSizeSelectAction(variant);
      onCloseAction();
      setSelectedSize(null);
    }, 200);
  };

  // Group variants by size
  const sizeOptions = variants.map(variant => {
    const sizeOption = variant.selectedOptions.find(opt => opt.name.toLowerCase() === 'size');
    return {
      variant,
      size: sizeOption?.value || 'One Size',
      available: variant.availableForSale
    };
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onCloseAction}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-xl font-semibold text-center pr-8">Выберите размер</h2>
            <button
              onClick={onCloseAction}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Size Table Header */}
          <div className="px-6 pt-4 pb-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Таблица размеров</p>
          </div>
          
          {/* Size Grid */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-4 gap-3">
              {sizeOptions.map(({ variant, size, available }) => (
                <button
                  key={variant.id}
                  onClick={() => available && handleSizeSelect(variant)}
                  disabled={!available}
                  className={`
                    relative py-3 px-4 rounded-lg font-medium transition-all
                    ${available 
                      ? selectedSize === variant.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-black dark:text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  {size}
                  {!available && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-full h-0.5 bg-neutral-400 dark:bg-neutral-600 rotate-45 absolute" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}