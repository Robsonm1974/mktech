'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, ChevronDown, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const { user, signOut, isAdmin, isSchoolAdmin, isProfessor } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Não renderizar Navbar nas páginas do admin-escola e professor (elas têm o ModernNavbar próprio)
  if (pathname?.startsWith('/dashboard/admin-escola') || pathname?.startsWith('/dashboard/professor')) {
    return null
  }

  // Verificar se está em páginas do escopo do aluno (entrar, sessão, perfil)
  const isStudentScope = pathname === '/entrar' || 
                         pathname?.startsWith('/sessao/') || 
                         pathname === '/meu-perfil'

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin_mktech':
        return 'Admin MKTECH'
      case 'admin_escola':
        return 'Admin Escola'
      case 'professor':
        return 'Professor'
      default:
        return 'Usuário'
    }
  }

  const getDashboardUrl = (role: string) => {
    switch (role) {
      case 'superadmin':
      case 'admin_mktech':
        return '/admin-mktech'
      case 'admin_escola':
        return '/dashboard/admin-escola'
      case 'professor':
        return '/dashboard/professor'
      default:
        return '/dashboard'
    }
  }

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault()
    const target = document.querySelector(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setMobileMenuOpen(false) // Fecha o menu após clicar
  }

  if (!user) {
    return (
      <header className="bg-gradient-to-r from-[#667eea] to-[#764ba2] sticky top-0 z-50 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-extrabold text-white flex items-center gap-2">
                <span className="text-3xl">🚀</span>
                MK-SMART
              </Link>
            </div>
            
            {!isStudentScope && (
              <>
                <div className="hidden md:flex items-center space-x-8">
                  <a 
                    href="#recursos" 
                    onClick={(e) => handleSmoothScroll(e, '#recursos')}
                    className="text-white font-semibold hover:opacity-80 transition-opacity"
                  >
                    Recursos
                  </a>
                  <a 
                    href="#como-funciona" 
                    onClick={(e) => handleSmoothScroll(e, '#como-funciona')}
                    className="text-white font-semibold hover:opacity-80 transition-opacity"
                  >
                    Como Funciona
                  </a>
                  <a 
                    href="#precos" 
                    onClick={(e) => handleSmoothScroll(e, '#precos')}
                    className="text-white font-semibold hover:opacity-80 transition-opacity"
                  >
                    Preços
                  </a>
                  <a 
                    href="#faq" 
                    onClick={(e) => handleSmoothScroll(e, '#faq')}
                    className="text-white font-semibold hover:opacity-80 transition-opacity"
                  >
                    FAQ
                  </a>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-white font-semibold hover:opacity-80 transition-opacity flex items-center gap-1">
                        Logins
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <a href="/admin/login" className="cursor-pointer">
                          Admin MKTECH
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href="/auth/login" className="cursor-pointer">
                          Escola
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href="/auth/login" className="cursor-pointer">
                          Professor
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href="/entrar" className="cursor-pointer">
                          Aluno
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <a 
                  href="https://wa.me/5541995999648" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:block bg-white text-[#667eea] px-6 py-2 rounded-full font-bold hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Teste Grátis
                </a>
              </>
            )}

            {/* Botão Hambúrguer Mobile - só mostrar se não for escopo de aluno */}
            {!isStudentScope && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Menu"
                type="button"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>

          {/* Menu Mobile - Dropdown - só mostrar se não for escopo de aluno */}
          {!isStudentScope && mobileMenuOpen && (
            <div className="md:hidden pb-4 pt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
              <a 
                href="#recursos" 
                onClick={(e) => handleSmoothScroll(e, '#recursos')}
                className="block text-white font-semibold hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                Recursos
              </a>
              <a 
                href="#como-funciona" 
                onClick={(e) => handleSmoothScroll(e, '#como-funciona')}
                className="block text-white font-semibold hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                Como Funciona
              </a>
              <a 
                href="#precos" 
                onClick={(e) => handleSmoothScroll(e, '#precos')}
                className="block text-white font-semibold hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                Preços
              </a>
              <a 
                href="#faq" 
                onClick={(e) => handleSmoothScroll(e, '#faq')}
                className="block text-white font-semibold hover:bg-white/10 px-4 py-2 rounded-lg transition-colors"
              >
                FAQ
              </a>
              
              {/* Separador */}
              <div className="border-t border-white/20 my-2"></div>
              
              {/* Logins Mobile */}
              <div className="px-4 py-2">
                <p className="text-white/70 text-sm font-semibold mb-2">Logins</p>
                <div className="space-y-2 pl-2">
                  <a 
                    href="/admin/login" 
                    className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    Admin MKTECH
                  </a>
                  <a 
                    href="/auth/login" 
                    className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    Escola
                  </a>
                  <a 
                    href="/auth/login" 
                    className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    Professor
                  </a>
                  <a 
                    href="/entrar" 
                    className="block text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    Aluno
                  </a>
                </div>
              </div>
              
              {/* Botão CTA Mobile */}
              <a 
                href="https://wa.me/5541995999648" 
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white text-[#667eea] px-6 py-3 rounded-full font-bold text-center mx-4 hover:shadow-xl transition-all"
              >
                Teste Grátis
              </a>
            </div>
          )}
        </nav>
      </header>
    )
  }

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href={getDashboardUrl(user.role)} className="text-xl font-bold text-[#667eea]">
              MK-SMART
            </a>
            
            <div className="flex items-center space-x-4">
              {isProfessor() && (
                <a href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard Professor
                </a>
              )}
              
              {isSchoolAdmin() && (
                <a href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Admin Escola
                </a>
              )}
              
              {isAdmin() && (
                <a href="/admin/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Admin MKTECH
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.full_name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.full_name || user.email}</span>
                    <span className="text-xs text-gray-500">{getRoleLabel(user.role)}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/dashboard/perfil">
                    <Settings className="mr-2 h-4 w-4" />
                    Perfil
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
