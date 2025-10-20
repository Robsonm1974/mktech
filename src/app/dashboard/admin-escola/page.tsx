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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo, {user.full_name || user.email}!
            </h1>
            <p className="text-gray-600 mt-2">
              Painel Administrativo - {tenantName}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/admin-escola/configuracoes">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Professores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {loadingStats ? '...' : stats.totalProfessores}
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {loadingStats ? '...' : stats.totalTurmas}
              </div>
              <GraduationCap className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {loadingStats ? '...' : stats.totalAlunos}
              </div>
              <BookOpen className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vagas Ocupadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {ocupacaoPercentual}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.seatsUsed} de {stats.seatsTotal}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Ações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Professores</CardTitle>
            <CardDescription className="text-sm">
              Gerencie os professores da escola
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" size="sm">
              <Link href="/dashboard/admin-escola/professores">
                Ver Professores
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/dashboard/admin-escola/professores/novo">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Professor
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <GraduationCap className="h-8 w-8 text-green-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Turmas</CardTitle>
            <CardDescription className="text-sm">
              Organize as turmas e anos escolares
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" size="sm">
              <Link href="/dashboard/admin-escola/turmas">
                Ver Turmas
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/dashboard/admin-escola/turmas/nova">
                <Plus className="w-4 h-4 mr-2" />
                Criar Turma
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Alunos</CardTitle>
            <CardDescription className="text-sm">
              Cadastre e gerencie os alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full" size="sm">
              <Link href="/dashboard/admin-escola/alunos">
                Ver Alunos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/dashboard/admin-escola/alunos/novo">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Aluno
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ações Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Acompanhe o desempenho da escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin-escola/relatorios">
                Ver Relatórios
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </CardTitle>
            <CardDescription>
              Ajustes e preferências da escola
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/admin-escola/configuracoes">
                Acessar Configurações
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Guia de Primeiros Passos */}
      {stats.totalProfessores === 0 || stats.totalTurmas === 0 || stats.totalAlunos === 0 ? (
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              🚀 Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              {stats.totalProfessores === 0 && (
                <li>Adicione professores à escola</li>
              )}
              {stats.totalTurmas === 0 && (
                <li>Crie turmas para organizar os alunos</li>
              )}
              {stats.totalAlunos === 0 && (
                <li>Cadastre os alunos nas turmas</li>
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

