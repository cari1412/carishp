// app/account/page.tsx
'use client';

import { useCustomer } from '@/lib/shopify/customer-context';
import LoadingDots from 'components/loading-dots';
import { Heart, LogOut, MapPin, Package, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const accountMenuItems = [
  {
    title: 'Personal Information',
    description: 'Manage your account details',
    icon: User,
    href: '/account/profile'
  },
  {
    title: 'Orders',
    description: 'View your order history',
    icon: Package,
    href: '/account/orders'
  },
  {
    title: 'Addresses',
    description: 'Manage your shipping addresses',
    icon: MapPin,
    href: '/account/addresses'
  },
  {
    title: 'Wishlist',
    description: 'View your saved items',
    icon: Heart,
    href: '/account/wishlist'
  },
  {
    title: 'Settings',
    description: 'Account preferences',
    icon: Settings,
    href: '/account/settings'
  }
];

export default function AccountPage() {
  const { customer, isLoading, isAuthenticated, logout } = useCustomer();
  const router = useRouter();

  useEffect(() => {
    // Проверяем, есть ли pending checkout
    if (isAuthenticated && sessionStorage.getItem('pending_checkout') === 'true') {
      sessionStorage.removeItem('pending_checkout');
      router.push('/checkout');
    }
    
    // Проверяем, есть ли redirect URL
    const redirectUrl = sessionStorage.getItem('auth_redirect');
    if (isAuthenticated && redirectUrl) {
      sessionStorage.removeItem('auth_redirect');
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router]);

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots className="bg-black dark:bg-white" />
      </div>
    );
  }

  // Редирект на главную если не авторизован
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {customer?.firstName || 'there'}!
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {customer?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accountMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white dark:bg-black rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Orders</p>
            </div>
          </div>
          <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Wishlist Items</p>
            </div>
          </div>
          <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {customer?.createdAt ? new Date(customer.createdAt).getFullYear() : new Date().getFullYear()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Member Since</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}