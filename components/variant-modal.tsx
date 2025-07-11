// components/variant-modal.tsx
'use client';

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';
import clsx from 'clsx';
import { Product, ProductVariant } from 'lib/shopify/types';
import { useCallback, useState } from 'react';

interface VariantModalProps {
  isOpen: boolean;
  product: Product;
  onCloseAction: () => void;
  onVariantSelectAction: (variant: ProductVariant) => void;
}

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

export function VariantModal({ isOpen, product, onCloseAction, onVariantSelectAction }: VariantModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  
  const { options, variants } = product;
  
  // Create combinations for availability checking
  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({ ...accumulator, [option.name.toLowerCase()]: option.value }),
      {}
    )
  }));

  const updateOption = useCallback((optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName.toLowerCase()]: value }));
  }, []);

  const getSelectedVariant = useCallback(() => {
    return variants.find((variant: ProductVariant) =>
      variant.selectedOptions.every(
        (option) => selectedOptions[option.name.toLowerCase()] === option.value
      )
    );
  }, [variants, selectedOptions]);

  const isSelectionComplete = useCallback(() => {
    return options.every(option => selectedOptions[option.name.toLowerCase()]);
  }, [options, selectedOptions]);

  const handleAddToCart = useCallback(() => {
    const selectedVariant = getSelectedVariant();
    if (selectedVariant) {
      onVariantSelectAction(selectedVariant);
      onCloseAction();
      // Reset selections for next time
      setSelectedOptions({});
    }
  }, [getSelectedVariant, onVariantSelectAction, onCloseAction]);

  const handleClose = useCallback(() => {
    setSelectedOptions({});
    onCloseAction();
  }, [onCloseAction]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      placement="center"
      backdrop="blur"
      size="md"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold">Select Options</h3>
              <p className="text-sm text-gray-500">{product.title}</p>
            </ModalHeader>
            <ModalBody>
              {options.map((option) => (
                <div key={option.id} className="mb-6">
                  <h4 className="mb-3 text-sm font-medium uppercase tracking-wide">
                    {option.name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const optionNameLowerCase = option.name.toLowerCase();
                      const optionParams = { ...selectedOptions, [optionNameLowerCase]: value };
                      
                      // Check if this option combination is available
                      const filtered = Object.entries(optionParams).filter(([key, value]) =>
                        options.find(
                          (option) => option.name.toLowerCase() === key && option.values.includes(value)
                        )
                      );
                      
                      const isAvailableForSale = combinations.find((combination) =>
                        filtered.every(
                          ([key, value]) => combination[key] === value && combination.availableForSale
                        )
                      );

                      const isActive = selectedOptions[optionNameLowerCase] === value;

                      return (
                        <button
                          key={value}
                          onClick={() => updateOption(option.name, value)}
                          disabled={!isAvailableForSale}
                          className={clsx(
                            'min-w-[48px] px-4 py-2 text-sm rounded-lg border transition-all duration-200',
                            {
                              'bg-blue-600 text-white border-blue-600': isActive && isAvailableForSale,
                              'bg-white text-gray-900 border-gray-300 hover:border-blue-600': !isActive && isAvailableForSale,
                              'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed relative overflow-hidden': !isAvailableForSale,
                            }
                          )}
                        >
                          {value}
                          {!isAvailableForSale && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-px bg-gray-400 rotate-45"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleAddToCart}
                disabled={!isSelectionComplete() || !getSelectedVariant()?.availableForSale}
              >
                Add to Cart
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}