'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

function AdminLoginContent() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        setError('Credenciais inválidas')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erro ao autenticar')
        setLoading(false)
        return
      }

      // Verificar role superadmin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', authData.user.id)
        .single()

      if (!userData || userData.role !== 'superadmin') {
        setError('Acesso não autorizado')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      const redirect = searchParams?.get('redirect') || '/admin/dashboard'
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Erro ao fazer login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-96">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Admin MKTECH</h1>
          <p className="text-sm text-slate-600 mt-2">Painel Administrativo</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="mk-admin@mktech.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}

