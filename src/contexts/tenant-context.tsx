'use client'
import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type TenantContextType = { tenantId: string | null; setTenantId: (id: string | null) => void }
const TenantContext = createContext<TenantContextType | null>(null)

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null)
  return <TenantContext.Provider value={{ tenantId, setTenantId }}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}



