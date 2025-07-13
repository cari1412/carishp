// app/account/addresses/page.tsx
'use client';

import { useCustomer } from '@/lib/shopify/customer-context';
import LoadingDots from 'components/loading-dots';
import { ArrowLeft, Edit2, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type CustomerAddress = {
  id: string;
  formatted: string[];
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  country?: string;
  countryCode?: string;
  zip?: string;
  phone?: string;
  isDefault: boolean;
};

export default function AddressesPage() {
  const { isAuthenticated, isLoading: authLoading } = useCustomer();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [defaultAddressId, setDefaultAddressId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    fetchAddresses();
  }, [isAuthenticated]);

  async function fetchAddresses() {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/customer/addresses', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        setDefaultAddressId(data.defaultAddressId);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchAddresses();
      } else {
        alert('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  }

  async function handleSetDefault(addressId: string) {
    try {
      const response = await fetch(`/api/customer/addresses/${addressId}/default`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchAddresses();
      } else {
        alert('Failed to set default address');
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address');
    }
  }

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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Shipping Addresses
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Address
            </button>
          </div>
        </div>

        {addresses.length === 0 && !showAddForm ? (
          // Empty State
          <div className="bg-white dark:bg-black rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No addresses saved</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add a shipping address to make checkout faster.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Add Your First Address
            </button>
          </div>
        ) : (
          // Addresses Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white dark:bg-black rounded-lg shadow-sm p-6 relative"
              >
                {/* Default Badge */}
                {address.id === defaultAddressId && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded">
                      <Star className="w-3 h-3" />
                      Default
                    </span>
                  </div>
                )}

                {/* Address Details */}
                <div className="space-y-1 mb-6">
                  <p className="font-semibold">
                    {address.firstName} {address.lastName}
                  </p>
                  {address.company && (
                    <p className="text-gray-600 dark:text-gray-400">{address.company}</p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">{address.address1}</p>
                  {address.address2 && (
                    <p className="text-gray-600 dark:text-gray-400">{address.address2}</p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">
                    {address.city}, {address.province} {address.zip}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{address.country}</p>
                  {address.phone && (
                    <p className="text-gray-600 dark:text-gray-400">{address.phone}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {address.id !== defaultAddressId && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => setEditingAddress(address)}
                    className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAddress(address.id)}
                    className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form Modal would go here */}
        {(showAddForm || editingAddress) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-black rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              {/* Form fields would go here */}
              <p className="text-gray-600 dark:text-gray-400">
                Address form implementation needed
              </p>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAddress(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-90">
                  Save Address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}