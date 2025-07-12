// lib/shopify/customer-context.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();

  // Проверяем авторизацию при загрузке и при изменении параметров
  useEffect(() => {
    checkAuth();
  }, []);

  // Проверяем параметр auth_success после редиректа
  useEffect(() => {
    if (searchParams.get('auth_success') === 'true') {
      // Обновляем данные пользователя после успешной авторизации
      checkAuth().then(() => {
        // Убираем параметр из URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('auth_success');
        window.history.replaceState({}, '', newUrl.toString());
      });
    }
  }, [searchParams]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/customer/me', {
        credentials: 'include',
        cache: 'no-store' // Важно для получения актуальных данных
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
        // Редирект на главную после выхода
        router.push('/');
        router.refresh(); // Обновляем серверные компоненты
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