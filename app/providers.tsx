// app/providers.tsx
'use client'

import { NotificationContainer } from '@/components/notification'
import { HeroUIProvider } from '@heroui/react'

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
      <NotificationContainer />
    </HeroUIProvider>
  )
}