"use client"
import { ReactNode, useEffect, useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { ThemeProvider } from '@/contexts/theme-context'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fechar sidebar ao navegar (mobile) para evitar telas presas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ThemeProvider initialTheme="student">
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar responsiva */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <div className="fixed inset-y-0 left-0 z-40 w-64 md:static md:z-auto md:w-64">
            <AdminSidebar />
          </div>
          {/* backdrop mobile */}
          <div
            className={`fixed inset-0 bg-black/40 z-30 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
            onClick={() => setSidebarOpen(false)}
          />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}











