'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔍 DEBUG: Iniciando login...')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password ? '***' : 'VAZIO')
    console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('🔑 Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📊 Resultado do login:')
      console.log('✅ Data:', data)
      console.log('❌ Error:', error)

      if (error) {
        console.error('🚨 Erro detalhado:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }

      if (data.user) {
        console.log('👤 Usuário autenticado:', data.user)
        
        // Buscar role do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('auth_id', data.user.id)
          .single()

        console.log('👥 Dados do usuário na tabela:', userData)
        console.log('❌ Erro ao buscar usuário:', userError)

        if (userData) {
          console.log('🎯 Role encontrado:', userData.role)
          
          // Redirecionar baseado no role
          switch (userData.role) {
            case 'admin_mktech':
            case 'superadmin':
              router.push('/admin-mktech')
              break
            case 'admin_escola':
              router.push('/dashboard/admin-escola')
              break
            case 'professor':
              router.push('/dashboard/professor')
              break
            default:
              router.push('/dashboard')
          }
        } else {
          console.error('🚨 Usuário não encontrado na tabela users')
          setError('Usuário não encontrado no sistema')
        }
      }
    } catch (err) {
      console.error('💥 Erro no login:', err)
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const testUserExists = async () => {
    console.log('🔍 Verificando se usuário existe...')
    
    try {
      // Tentar buscar o usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'robsonm1974@gmail.com')
        .single()

      console.log('👤 Dados do usuário na tabela users:', userData)
      console.log('❌ Erro ao buscar usuário:', userError)

      // Tentar buscar na auth.users (se possível)
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      console.log('🔐 Usuário autenticado atual:', authUser)
      console.log('❌ Erro auth:', authError)

    } catch (err) {
      console.error('💥 Erro no teste:', err)
    }
  }

  const createTestUser = async () => {
    console.log('🧪 Criando usuário de teste...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'teste@teste.com',
        password: '123456',
        options: {
          data: {
            full_name: 'Usuário Teste'
          }
        }
      })

      console.log('📊 Resultado da criação:')
      console.log('✅ Data:', data)
      console.log('❌ Error:', error)

      if (error) {
        console.error('🚨 Erro ao criar usuário:', error)
      } else {
        console.log('🎉 Usuário criado! Verifique o email para confirmar.')
      }
    } catch (err) {
      console.error('💥 Erro inesperado:', err)
    }
  }

  const testMagicLink = async () => {
    console.log('🔗 Testando Magic Link...')
    
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: 'robsonm1974@gmail.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback'
        }
      })

      console.log('📊 Resultado do Magic Link:')
      console.log('✅ Data:', data)
      console.log('❌ Error:', error)

      if (error) {
        console.error('🚨 Erro no Magic Link:', error)
      } else {
        console.log('🎉 Magic Link enviado! Verifique o email.')
      }
    } catch (err) {
      console.error('💥 Erro inesperado:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">MKTECH</h1>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Acesse sua conta de professor, admin ou coordenador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Entre em contato com a escola
                </a>
              </p>
            </div>

            {/* Botões de teste temporários */}
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="text-sm text-gray-600 text-center mb-3">
                🔧 Botões de Teste (Temporários)
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={testUserExists}
                className="w-full"
              >
                🔍 Testar Usuário
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={createTestUser}
                className="w-full"
              >
                🧪 Criar Usuário Teste
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={testMagicLink}
                className="w-full"
              >
                🔗 Testar Magic Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Para alunos, acesse{' '}
            <a href="/entrar" className="font-medium text-blue-600 hover:text-blue-500">
              /entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
