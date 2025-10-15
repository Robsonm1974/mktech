'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { UserResponse } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'

type SessionUser = { id: string; email: string | null }
type AuthContextType = { user: SessionUser | null; loading: boolean }

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then((response: UserResponse) => {
      const u = response.data.user
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
      setLoading(false)
    })
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
