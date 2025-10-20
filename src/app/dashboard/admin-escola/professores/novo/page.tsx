'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Save, User, Mail, Lock } from 'lucide-react'
import { useState, FormEvent } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function NovoProfessorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const supabase = createSupabaseBrowserClient()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user?.tenant_id) {
      toast.error('Erro: Tenant não identificado')
      return
    }

    // Validações
    if (!form.full_name.trim()) {
      toast.error('Nome completo é obrigatório')
      return
    }

    if (!form.email.trim()) {
      toast.error('Email é obrigatório')
      return
    }

    if (form.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (form.password !== form.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    try {
      setSaving(true)

      console.log('🚀 Criando professor...', { email: form.email, nome: form.full_name })

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role: 'professor',
            tenant_id: user.tenant_id
          }
        }
      })

      if (authError) {
        console.error('❌ Erro ao criar usuário no Auth:', authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado no Auth')
      }

      console.log('✅ Usuário criado no Auth:', authData.user.id)

      // 2. Criar registro na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: authData.user.id,
          tenant_id: user.tenant_id,
          email: form.email,
          full_name: form.full_name,
          role: 'professor',
          active: true
        })

      if (userError) {
        console.error('❌ Erro ao criar registro na tabela users:', userError)
        
        // Tentar deletar o usuário do Auth se falhar
        await supabase.auth.admin.deleteUser(authData.user.id)
        
        throw userError
      }

      console.log('✅ Professor criado com sucesso!')

      toast.success('Professor adicionado com sucesso!')
      router.push('/dashboard/admin-escola/professores')
      router.refresh()
    } catch (error) {
      console.error('💥 Erro ao adicionar professor:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      if (errorMessage.includes('already registered')) {
        toast.error('Este email já está cadastrado')
      } else {
        toast.error(errorMessage || 'Erro ao adicionar professor')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/admin-escola/professores">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adicionar Professor</h1>
          <p className="text-gray-600 mt-1">
            Preencha os dados para criar uma nova conta de professor
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados do Professor</CardTitle>
            <CardDescription>
              Todos os campos são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Nome Completo *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Maria da Silva"
                required
                disabled={saving}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="professor@escola.com.br"
                required
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Este será o login do professor
              </p>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock className="w-4 h-4 inline mr-1" />
                Senha *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Lock className="w-4 h-4 inline mr-1" />
                Confirmar Senha *
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a senha novamente"
                required
                minLength={6}
                disabled={saving}
              />
            </div>

            {/* Aviso */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📧 Importante:</strong> O professor receberá um email de confirmação 
                no endereço fornecido. Ele deverá confirmar o email antes de fazer login.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Adicionar Professor
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

