// app/account/orders/page.tsx
'use client';

import { useCustomer } from '@/lib/shopify/customer-context';
import LoadingDots from 'components/loading-dots';
import Price from 'components/price';
import { ArrowLeft, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CustomerOrder = {
  id: string;
  name: string;
  processedAt: string;
  fulfillmentStatus: 'FULFILLED' | 'UNFULFILLED' | 'PARTIALLY_FULFILLED';
  financialStatus: 'PAID' | 'PENDING' | 'PARTIALLY_PAID' | 'REFUNDED' | 'VOIDED';
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    edges: Array<{
      node: {
        title: string;
        quantity: number;
        image?: {
          url: string;
          altText: string;
        };
        variant?: {
          price: {
            amount: string;
            currencyCode: string;
          };
        };
      };
    }>;
  };
};

const statusColors = {
  FULFILLED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  UNFULFILLED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  PARTIALLY_FULFILLED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  PARTIALLY_PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  REFUNDED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  VOIDED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
};

const statusLabels = {
  FULFILLED: 'Fulfilled',
  UNFULFILLED: 'Processing',
  PARTIALLY_FULFILLED: 'Partially Fulfilled',
  PAID: 'Paid',
  PENDING: 'Payment Pending',
  PARTIALLY_PAID: 'Partially Paid',
  REFUNDED: 'Refunded',
  VOIDED: 'Cancelled'
};

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useCustomer();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/customer/orders', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
          setHasNextPage(data.hasNextPage || false);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingDots className="bg-black dark:bg-white" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Order History
          </h1>
        </div>

        {orders.length === 0 ? (
          // Empty State
          <div className="bg-white dark:bg-black rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              When you place an order, it will appear here.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          // Orders List
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Order {order.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.processedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.fulfillmentStatus]}`}>
                        {statusLabels[order.fulfillmentStatus]}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.financialStatus]}`}>
                        {statusLabels[order.financialStatus]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.lineItems.edges.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex gap-4">
                        {item.node.image && (
                          <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded overflow-hidden">
                            <Image
                              src={item.node.image.url}
                              alt={item.node.image.altText || item.node.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.node.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantity: {item.node.quantity}
                          </p>
                        </div>
                        {item.node.variant?.price && (
                          <Price
                            amount={item.node.variant.price.amount}
                            currencyCode={item.node.variant.price.currencyCode}
                            className="text-sm"
                          />
                        )}
                      </div>
                    ))}
                    {order.lineItems.edges.length > 3 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        + {order.lineItems.edges.length - 3} more items
                      </p>
                    )}
                  </div>

                  {/* Order Total */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <Price
                      amount={order.totalPrice.amount}
                      currencyCode={order.totalPrice.currencyCode}
                      className="text-lg font-semibold"
                    />
                  </div>
                </div>
              </div>
            ))}

            {hasNextPage && (
              <div className="text-center py-8">
                <button className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90">
                  Load More Orders
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}