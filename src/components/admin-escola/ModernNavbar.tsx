'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Home, 
  Users, 
  GraduationCap, 
  User as UserIcon, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Início', href: '/dashboard/admin-escola', icon: <Home className="h-5 w-5" /> },
  { label: 'Professores', href: '/dashboard/admin-escola/professores', icon: <Users className="h-5 w-5" /> },
  { label: 'Turmas', href: '/dashboard/admin-escola/turmas', icon: <GraduationCap className="h-5 w-5" /> },
  { label: 'Alunos', href: '/dashboard/admin-escola/alunos', icon: <UserIcon className="h-5 w-5" /> },
  { label: 'Relatórios', href: '/dashboard/admin-escola/relatorios', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Configurações', href: '/dashboard/admin-escola/configuracoes', icon: <Settings className="h-5 w-5" /> },
]

export default function ModernNavbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/admin-escola') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] sticky top-0 z-50 shadow-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard/admin-escola" className="text-2xl font-black text-white flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="text-3xl">🚀</span>
            <span>MK-SMART</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-white/20 text-white shadow-md'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Menu + Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 font-semibold flex items-center gap-2"
                >
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <span className="hidden sm:inline">{user?.full_name || user?.email || 'Usuário'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{user?.full_name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/admin-escola/configuracoes" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-white/20 mt-2 pt-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all',
                    isActive(item.href)
                      ? 'bg-white/20 text-white'
                      : 'text-white/90 hover:bg-white/10'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

