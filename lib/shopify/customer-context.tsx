// lib/shopify/customer-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Customer } from './customer-account';

interface CustomerContextType {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/customer/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setCustomer(data.customer);
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCustomer = async () => {
    await checkAuth();
  };

  const login = () => {
    // Редирект на страницу входа
    window.location.href = '/auth/login';
  };

  const logout = async () => {
    try {
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setCustomer(null);
        // Опционально: редирект на главную
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: CustomerContextType = {
    customer,
    isLoading,
    isAuthenticated: !!customer,
    login,
    logout,
    refreshCustomer
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within CustomerProvider');
  }
  return context;
}