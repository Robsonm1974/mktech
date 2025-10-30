'use client'

import { ReactNode } from 'react'
import ModernNavbar from '@/components/admin-escola/ModernNavbar'
import { ThemeProvider } from '@/contexts/theme-context'

export default function AdminEscolaLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider initialTheme="student">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}



