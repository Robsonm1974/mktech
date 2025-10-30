'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, GraduationCap, BookOpen, Settings, BarChart3, Plus, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'

interface Stats {
  totalProfessores: number
  totalTurmas: number
  totalAlunos: number
  seatsUsed: number
  seatsTotal: number
}

export default function AdminEscolaDashboard() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalProfessores: 0,
    totalTurmas: 0,
    totalAlunos: 0,
    seatsUsed: 0,
    seatsTotal: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [tenantName, setTenantName] = useState('')
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.tenant_id) return

      try {
        // Buscar dados do tenant
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('name, seats_total, seats_used')
          .eq('id', user.tenant_id)
          .single()

        if (tenantData) {
          setTenantName(tenantData.name)
          setStats(prev => ({
            ...prev,
            seatsTotal: tenantData.seats_total,
            seatsUsed: tenantData.seats_used
          }))
        }

        // Contar professores
        const { count: profCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenant_id)
          .eq('role', 'professor')
          .eq('active', true)

        // Contar turmas
        const { count: turmasCount } = await supabase
          .from('turmas')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenant_id)

        // Contar alunos ativos
        const { count: alunosCount } = await supabase
          .from('alunos')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', user.tenant_id)
          .eq('active', true)

        setStats({
          totalProfessores: profCount || 0,
          totalTurmas: turmasCount || 0,
          totalAlunos: alunosCount || 0,
          seatsTotal: tenantData?.seats_total || 0,
          seatsUsed: tenantData?.seats_used || 0
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    loadStats()
  }, [user, supabase])

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

  const ocupacaoPercentual = stats.seatsTotal > 0 
    ? Math.round((stats.seatsUsed / stats.seatsTotal) * 100) 
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent mb-2">
          Bem-vindo, {user.full_name || user.email}! 👋
        </h1>
        <p className="text-lg text-gray-600 font-semibold">
          Painel Administrativo - {tenantName}
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl shadow-2xl border-0 bg-white hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Professores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                {loadingStats ? '...' : stats.totalProfessores}
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-2xl border-0 bg-white hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                {loadingStats ? '...' : stats.totalTurmas}
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-2xl border-0 bg-white hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                {loadingStats ? '...' : stats.totalAlunos}
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-2xl border-0 bg-white hover:scale-[1.02] transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600">
              Vagas Ocupadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
                  {ocupacaoPercentual}%
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium">
                  {stats.seatsUsed} de {stats.seatsTotal}
                </p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Ações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Professores</CardTitle>
            <CardDescription className="text-sm text-gray-600 font-medium">
              Gerencie os professores da escola
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-0 shadow-lg" size="sm">
              <Link href="/dashboard/admin-escola/professores">
                Ver Professores
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50" size="sm">
              <Link href="/dashboard/admin-escola/professores/novo">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Professor
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Turmas</CardTitle>
            <CardDescription className="text-sm text-gray-600 font-medium">
              Organize as turmas e anos escolares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white border-0 shadow-lg" size="sm">
              <Link href="/dashboard/admin-escola/turmas">
                Ver Turmas
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50" size="sm">
              <Link href="/dashboard/admin-escola/turmas/nova">
                <Plus className="w-4 h-4 mr-2" />
                Criar Turma
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:scale-[1.02] transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <ChevronRight className="h-5 w-5 text-purple-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Alunos</CardTitle>
            <CardDescription className="text-sm text-gray-600 font-medium">
              Cadastre e gerencie os alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white border-0 shadow-lg" size="sm">
              <Link href="/dashboard/admin-escola/alunos">
                Ver Alunos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50" size="sm">
              <Link href="/dashboard/admin-escola/alunos/novo">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aluno
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ações Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:scale-[1.02] transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                Relatórios
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-600 font-medium">
              Acompanhe o desempenho da escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white border-0 shadow-lg" size="lg">
              <Link href="/dashboard/admin-escola/relatorios">
                Ver Relatórios
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-gray-50 to-gray-100/50 hover:scale-[1.02] transition-all duration-200">
          <CardHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-800">
                Configurações
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-600 font-medium">
              Ajustes e preferências da escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white border-0 shadow-lg" size="lg">
              <Link href="/dashboard/admin-escola/configuracoes">
                Acessar Configurações
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Guia de Primeiros Passos */}
      {stats.totalProfessores === 0 || stats.totalTurmas === 0 || stats.totalAlunos === 0 ? (
        <Card className="mt-8 rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 text-xl font-bold">
              <span className="text-2xl">🚀</span>
              Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-gray-700 font-medium">
              {stats.totalProfessores === 0 && (
                <li className="text-amber-900">Adicione professores à escola</li>
              )}
              {stats.totalTurmas === 0 && (
                <li className="text-amber-900">Crie turmas para organizar os alunos</li>
              )}
              {stats.totalAlunos === 0 && (
                <li className="text-amber-900">Cadastre os alunos nas turmas</li>
              )}
              <li>Oriente os professores a fazer login e iniciar sessões</li>
              <li>Acompanhe o progresso pelos relatórios</li>
            </ol>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

