// lib/shopify/customer-context.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Customer } from './customer-account';

interface CustomerContextType {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (redirectTo?: string) => void;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    console.log('Checking auth status...');
    try {
      const response = await fetch('/api/customer/me', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      console.log('Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Customer data received:', !!data.customer);
        
        if (data.customer) {
          setCustomer(data.customer);
          console.log('Customer set:', data.customer.email);
        } else {
          setCustomer(null);
        }
      } else {
        console.log('Auth check failed with status:', response.status);
        setCustomer(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    checkAuth();

    // Проверяем URL параметры без useSearchParams
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        console.log('Auth success detected in URL');
        
        // Убираем параметр из URL
        urlParams.delete('auth');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
        
        // Обновляем данные и редиректим
        checkAuth().then(() => {
          const redirectPath = sessionStorage.getItem('auth_redirect');
          console.log('Redirect path from session:', redirectPath);
          
          if (redirectPath && redirectPath !== '/') {
            sessionStorage.removeItem('auth_redirect');
            router.push(redirectPath);
          } else {
            router.push('/account');
          }
        });
      }
    }
  }, [checkAuth, router]);

  const refreshCustomer = async () => {
    setIsLoading(true);
    await checkAuth();
  };

  const login = (redirectTo?: string) => {
    if (typeof window !== 'undefined') {
      const redirectUrl = redirectTo || window.location.pathname;
      sessionStorage.setItem('auth_redirect', redirectUrl);
      console.log('Saved redirect path:', redirectUrl);
    }
    
    window.location.href = '/auth/login';
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setCustomer(null);
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
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