// lib/shopify/customer-context.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
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

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    checkAuth();
    
    // Проверяем cookie auth_completed
    const checkAuthCompleted = setInterval(() => {
      const authCompleted = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_completed='))
        ?.split('=')[1];
        
      if (authCompleted === 'true') {
        // Удаляем cookie
        document.cookie = 'auth_completed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Обновляем состояние
        checkAuth();
        
        // Получаем сохраненный путь для редиректа
        const redirectPath = sessionStorage.getItem('auth_redirect');
        if (redirectPath) {
          sessionStorage.removeItem('auth_redirect');
          router.push(redirectPath);
        }
      }
    }, 500);
    
    // Очищаем интервал через 10 секунд
    setTimeout(() => clearInterval(checkAuthCompleted), 10000);
    
    return () => clearInterval(checkAuthCompleted);
  }, [router]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/customer/me', {
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.customer) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCustomer = async () => {
    setIsLoading(true);
    await checkAuth();
  };

  const login = (redirectTo?: string) => {
    // Сохраняем текущий URL для редиректа после входа
    if (typeof window !== 'undefined') {
      const redirectUrl = redirectTo || window.location.pathname;
      sessionStorage.setItem('auth_redirect', redirectUrl);
    }
    
    // Редирект на страницу входа
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