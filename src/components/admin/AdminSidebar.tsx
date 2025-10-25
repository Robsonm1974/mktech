'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users, BookOpen, Settings, FileText, Film, HelpCircle, LayoutDashboard } from 'lucide-react'

const menuItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/tenants', icon: Building2, label: 'Escolas (Tenants)' },
  { href: '/admin/blocos', icon: FileText, label: 'Fábrica de Blocos' },
  { href: '/admin/midias', icon: Film, label: 'Mídias' },
  { href: '/admin/quizzes', icon: HelpCircle, label: 'Quizzes' },
  { href: '/admin/aulas', icon: BookOpen, label: 'Aulas' },
  { href: '/admin/usuarios', icon: Users, label: 'Usuários Admin' },
  { href: '/admin/config', icon: Settings, label: 'Configurações' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          MKTECH Admin
        </h1>
        <p className="text-xs text-slate-400 mt-1">Painel Administrativo</p>
      </div>
      
      <nav className="flex-1 px-4 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          © 2025 MKTECH
        </p>
      </div>
    </aside>
  )
}








