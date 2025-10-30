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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-5xl animate-bounce">🚀</div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              MK-SMART
            </h1>
          </div>
          <p className="mt-2 text-lg text-white/90 font-semibold">
            Faça login para acessar sua conta
          </p>
        </div>

        <Card className="rounded-3xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
              Entrar
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Acesse sua conta de professor, admin ou coordenador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  📧 Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#667eea] transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  🔒 Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#667eea] transition-all"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl border-2">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#653d8e] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  '✨ Entrar'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-medium">
                Não tem uma conta?{' '}
                <a href="#" className="font-bold text-[#667eea] hover:text-[#764ba2] transition-colors">
                  Entre em contato com a escola
                </a>
              </p>
            </div>

            {/* Botões de teste temporários - apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 space-y-2 border-t border-gray-200 pt-4">
                <div className="text-xs text-gray-500 text-center mb-3 font-semibold">
                  🔧 Botões de Teste (Apenas Desenvolvimento)
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={testUserExists}
                  className="w-full rounded-xl border-2 hover:bg-gray-50"
                >
                  🔍 Testar Usuário
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={createTestUser}
                  className="w-full rounded-xl border-2 hover:bg-gray-50"
                >
                  🧪 Criar Usuário Teste
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={testMagicLink}
                  className="w-full rounded-xl border-2 hover:bg-gray-50"
                >
                  🔗 Testar Magic Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-white/80 font-medium">
            Para alunos, acesse{' '}
            <a href="/entrar" className="font-bold text-white hover:text-purple-200 transition-colors underline">
              /entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
