'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface Banner {
  id: number;
  image: string;
  alt: string;
  link?: string;
  title?: string;
  subtitle?: string;
}

const banners: Banner[] = [
  {
    id: 1,
    image: '/banners/1.jpg',
    alt: 'Summer Collection',
    title: 'Summer Collection',
    subtitle: 'Up to 50% off',
    link: '/collections/summer'
  },
  {
    id: 2,
    image: '/banners/2.jpg',
    alt: 'New Arrivals',
    title: 'New Arrivals',
    subtitle: 'Check out the latest trends',
    link: '/collections/new-arrivals'
  },
  {
    id: 3,
    image: '/banners/3.jpg',
    alt: 'Special Offers',
    title: 'Special Offers',
    subtitle: 'Limited time deals',
    link: '/collections/sale'
  },
  {
    id: 4,
    image: '/banners/4.jpeg',
    alt: 'Premium Collection',
    title: 'Premium Collection',
    subtitle: 'Luxury items for you',
    link: '/collections/premium'
  }
];

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function BannerCarousel() {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);

  const currentIndex = ((page % banners.length) + banners.length) % banners.length;
  const currentBanner = banners[currentIndex];

  const paginate = useCallback((newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  }, [page]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPaused) {
      const timer = setTimeout(() => {
        paginate(1);
      }, 5000); // Change slide every 5 seconds

      return () => clearTimeout(timer);
    }
  }, [page, isPaused, paginate]);

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => paginate(1),
    onSwipedRight: () => paginate(-1),
    trackMouse: true,
    preventScrollOnSwipe: true
  });

  if (!currentBanner) {
    return null; // Safety check
  }

  return (
    // Wrapper with padding to match navbar content width
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-6 md:mt-8">
      <div 
        className="relative w-full h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden bg-neutral-100 dark:bg-neutral-900 rounded-xl md:rounded-2xl shadow-lg"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        {...handlers}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute w-full h-full"
          >
            <a 
              href={currentBanner.link || '#'}
              className="block w-full h-full relative"
            >
              <Image
                src={currentBanner.image}
                alt={currentBanner.alt}
                fill
                priority
                className="object-cover rounded-xl md:rounded-2xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
              
              {/* Overlay content */}
              {(currentBanner.title || currentBanner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end rounded-xl md:rounded-2xl">
                  <div className="p-6 md:p-8 lg:p-10 text-white">
                    {currentBanner.title && (
                      <motion.h2 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2"
                      >
                        {currentBanner.title}
                      </motion.h2>
                    )}
                    {currentBanner.subtitle && (
                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-base md:text-lg lg:text-xl"
                      >
                        {currentBanner.subtitle}
                      </motion.p>
                    )}
                  </div>
                </div>
              )}
            </a>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black text-black dark:text-white p-2 md:p-3 rounded-full transition-all duration-200 opacity-0 hover:opacity-100 md:opacity-70 md:hover:opacity-100 shadow-lg"
          onClick={() => paginate(-1)}
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-black/90 hover:bg-white dark:hover:bg-black text-black dark:text-white p-2 md:p-3 rounded-full transition-all duration-200 opacity-0 hover:opacity-100 md:opacity-70 md:hover:opacity-100 shadow-lg"
          onClick={() => paginate(1)}
          aria-label="Next banner"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {/* Dots indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/75 w-2'
              }`}
              onClick={() => {
                const newDirection = index > currentIndex ? 1 : -1;
                setPage([index, newDirection]);
              }}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}