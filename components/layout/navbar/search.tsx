'use client';

import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import Form from 'next/form';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';

export default function Search() {
  const searchParams = useSearchParams();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Form action="/search" className="relative w-full">
      <motion.div
        animate={{ scale: isFocused ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <input
          key={searchParams?.get('q')}
          type="text"
          name="q"
          placeholder="Search products..."
          autoComplete="off"
          defaultValue={searchParams?.get('q') || ''}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full pl-4 pr-12 py-3 bg-white/95 backdrop-blur rounded-full',
            'transition-all duration-200',
            'focus:ring-2 focus:ring-white/50 focus:bg-white',
            'hover:bg-white',
            'text-sm placeholder:text-gray-500 text-gray-900',
            'border-0 shadow-lg'
          )}
          aria-label="Search products"
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full transition-all duration-200 hover:bg-purple-100 hover:scale-105 focus:scale-105 text-purple-600 hover:text-purple-700"
          aria-label="Submit search"
        >
          <SearchIcon className="w-5 h-5" />
        </Button>
      </motion.div>
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <div className="relative w-full">
      <div className="w-full rounded-full bg-white/95 px-4 py-3 pr-12 shadow-lg">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 p-1">
        <SearchIcon className="h-5 w-5 text-purple-600" />
      </div>
    </div>
  );
}