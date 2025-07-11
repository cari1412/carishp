// components/layout/navbar/index.tsx
'use client';

import AuthModal from '@/app/auth/auth-modal';
import { useCustomer } from '@/lib/shopify/customer-context';
import { useCart } from 'components/cart/cart-context';
import CartModal from 'components/cart/modal';
import LogoSquare from 'components/logo-square';
import WishlistIcon from 'components/wishlist/wishlist-icon';
import { AnimatePresence, motion } from 'framer-motion';
import { Collection } from 'lib/shopify/types';
import {
  Folder,
  Home,
  Info,
  LogOut,
  Menu,
  Package,
  Phone,
  Settings,
  User
} from 'lucide-react';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import MobileTopBar from './mobile-top-bar';
import Search, { SearchSkeleton } from './search';

const { SITE_NAME } = process.env;

// Mock menu items for navigation (without products)
interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> },
  { label: 'About', href: '/about', icon: <Info className="w-4 h-4" /> },
  { label: 'Contact', href: '/contact', icon: <Phone className="w-4 h-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoadingCollections, setIsLoadingCollections] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { cart } = useCart();
  const { customer, isAuthenticated, logout } = useCustomer();
  const cartItemsCount = cart?.lines.reduce((total, line) => total + line.quantity, 0) || 0;

  // Load collections when menu opens
  useEffect(() => {
    if (isMenuOpen && collections.length === 0) {
      loadCollections();
    }
  }, [isMenuOpen]);

  const loadCollections = async () => {
    try {
      setIsLoadingCollections(true);
      const response = await fetch('/api/collections');
      const data = await response.json();
      
      if (data.collections) {
        setCollections(data.collections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleMenuItemClick = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <MobileTopBar />
      
      {/* Desktop Navbar */}
      <nav className="hidden md:flex sticky top-0 z-50 w-full bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Left Section: Logo + Catalog Menu */}
            <div className="flex items-center space-x-4">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <Link
                  href="/"
                  prefetch={true}
                  className="flex items-center space-x-2"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <LogoSquare />
                  </div>
                  <span className="hidden sm:block text-2xl font-bold text-white">
                    {SITE_NAME}
                  </span>
                </Link>
              </motion.div>

              {/* Catalog Menu */}
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className="relative h-12 px-4 transition-all duration-200 hover:bg-white/20 hover:scale-105 focus:scale-105 border-2 border-white text-white flex items-center gap-2"
                    aria-label="Open catalog menu"
                  >
                    <motion.div
                      animate={{ rotate: isMenuOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                    <span className="font-medium">Catalog</span>
                  </Button>
                </DropdownMenuTrigger>
                <AnimatePresence>
                  {isMenuOpen && (
                    <DropdownMenuContent 
                      align="start" 
                      className="w-64"
                      asChild
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Navigation Items */}
                        <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {menuItems.map((item) => (
                          <DropdownMenuItem
                            key={item.href}
                            onClick={handleMenuItemClick}
                            className="cursor-pointer"
                          >
                            <Link href={item.href} className="flex items-center w-full">
                              {item.icon}
                              <span className="ml-2">{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        ))}
                        
                        {/* Collections Section */}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Collections
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        {isLoadingCollections ? (
                          <div className="px-2 py-4 text-center text-sm text-neutral-500">
                            Loading collections...
                          </div>
                        ) : collections.length > 0 ? (
                          <>
                            {collections.map((collection) => (
                              <DropdownMenuItem
                                key={collection.handle}
                                onClick={handleMenuItemClick}
                                className="cursor-pointer"
                              >
                                <Link href={`/collections/${collection.handle}`} className="flex items-center w-full">
                                  <Folder className="w-4 h-4" />
                                  <span className="ml-2">{collection.title}</span>
                                </Link>
                              </DropdownMenuItem>
                            ))}
                          </>
                        ) : (
                          <div className="px-2 py-4 text-center text-sm text-neutral-500">
                            No collections available
                          </div>
                        )}
                        
                        {isAuthenticated && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
                              onClick={handleLogout}
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="ml-2">Logout</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </motion.div>
                    </DropdownMenuContent>
                  )}
                </AnimatePresence>
              </DropdownMenu>
            </div>

            {/* Center Section: Search */}
            <div className="flex-1 max-w-2xl mx-4 sm:mx-8">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>

            {/* Right Section: User, Wishlist & Cart Icons with Labels */}
            <div className="flex items-center space-x-4">
              {/* User Profile Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative flex flex-col items-center justify-center h-16 px-4 transition-all duration-200 hover:bg-white/20 hover:scale-105 focus:scale-105 text-white border-0"
                    aria-label="User profile"
                  >
                    <User className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">
                      {isAuthenticated ? customer?.firstName || 'Account' : 'Login'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isAuthenticated ? (
                      <>
                        <DropdownMenuLabel>
                          {customer?.email}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href="/account" className="flex items-center w-full">
                            <User className="w-4 h-4 mr-2" />
                            My Account
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href="/account/orders" className="flex items-center w-full">
                            <Package className="w-4 h-4 mr-2" />
                            Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href="/account/settings" className="flex items-center w-full">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-destructive hover:text-destructive focus:text-destructive"
                          onClick={logout}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => setShowAuthModal(true)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Sign In / Sign Up
                        </DropdownMenuItem>
                      </>
                    )}
                  </motion.div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Wishlist Icon */}
              <WishlistIcon />

              {/* Shopping Cart Button with existing CartModal */}
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative">
                  <CartModal />
                  {/* Cart Badge */}
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </div>
                <span className="text-xs font-medium mt-1 text-white">Cart</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}