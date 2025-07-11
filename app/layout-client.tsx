// app/layout-client.tsx
'use client';

import { CustomerProvider } from '@/lib/shopify/customer-context';

export function LayoutProviders({ children }: { children: React.ReactNode }) {
  return (
    <CustomerProvider>
      {children}
    </CustomerProvider>
  );
}