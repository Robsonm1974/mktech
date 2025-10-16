'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings } from 'lucide-react'

export function Navbar() {
  const { user, signOut, isAdmin, isSchoolAdmin, isProfessor } = useAuth()

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

  if (!user) {
    return (
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                MKTECH
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <a href="/entrar">Entrar (Aluno)</a>
              </Button>
              <Button asChild>
                <a href="/auth/login">Login</a>
              </Button>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <a href={getDashboardUrl(user.role)} className="text-xl font-bold text-blue-600">
              MKTECH
            </a>
            
            <div className="flex items-center space-x-4">
              {isProfessor() && (
                <a href="/dashboard/professor" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </a>
              )}
              
              {isSchoolAdmin() && (
                <a href="/dashboard/admin-escola" className="text-sm text-gray-600 hover:text-gray-900">
                  Administração
                </a>
              )}
              
              {isAdmin() && (
                <a href="/admin-mktech" className="text-sm text-gray-600 hover:text-gray-900">
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
