import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'

export interface User {
  id: string
  email: string
  role: 'admin_escola' | 'professor' | 'admin_mktech' | 'superadmin'
  tenant_id?: string
  full_name?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.log('🔍 Usuário não autenticado:', authError.message)
          setUser(null)
          setLoading(false)
          return
        }
        
        if (authUser) {
          console.log('👤 Usuário autenticado encontrado:', authUser.email)
          
          // Buscar dados do usuário na tabela users
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, role, tenant_id, full_name')
            .eq('auth_id', authUser.id)
            .single()

          if (error) {
            console.error('❌ Erro ao buscar dados do usuário:', error)
            console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2))
            console.log('🔍 Auth ID usado na busca:', authUser.id)
            setUser(null)
          } else {
            console.log('✅ Dados do usuário carregados:', userData)
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role,
              tenant_id: userData.tenant_id,
              full_name: userData.full_name
            })
          }
        } else {
          console.log('🔍 Nenhum usuário autenticado')
          setUser(null)
        }
      } catch (error) {
        console.error('💥 Erro na autenticação:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const hasRole = (roles: string | string[]) => {
    if (!user) return false
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    return allowedRoles.includes(user.role)
  }

  const isAdmin = () => hasRole(['admin_mktech', 'superadmin'])
  const isSchoolAdmin = () => hasRole(['admin_escola', 'admin_mktech', 'superadmin'])
  const isProfessor = () => hasRole(['professor', 'admin_escola', 'admin_mktech', 'superadmin'])

  return {
    user,
    loading,
    signOut,
    hasRole,
    isAdmin,
    isSchoolAdmin,
    isProfessor
  }
}
