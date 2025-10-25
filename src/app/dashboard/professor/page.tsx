'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { BookOpen, Users, Play, BarChart3, Settings, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'

interface Turma {
  id: string
  name: string
  grade_level: string
  descricao: string
  _count?: {
    alunos: number
  }
}

interface SessaoRecente {
  id: string
  session_code: string
  aula_titulo: string
  aula_id: string
  turma_nome: string
  turma_id: string
  status: string
  data_inicio: string
  data_fim: string | null
  total_alunos: number
  bloco_ativo_numero: number
}

interface Estatisticas {
  total_turmas: number
  total_alunos: number
  sessoes_realizadas: number
  sessoes_ativas: number
}

export default function ProfessorDashboard() {
  const { user, loading } = useAuth()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [sessoesRecentes, setSessoesRecentes] = useState<SessaoRecente[]>([])
  const [loadingSessoes, setLoadingSessoes] = useState(true)
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total_turmas: 0,
    total_alunos: 0,
    sessoes_realizadas: 0,
    sessoes_ativas: 0
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const loadTurmas = async () => {
      if (!user) return

      try {
        // Buscar turmas do professor
        const { data: turmasData, error } = await supabase
          .from('turmas')
          .select(`
            id,
            name,
            grade_level,
            descricao
          `)
          .eq('professor_id', user.id)
          .order('name')

        if (error) {
          console.error('Erro ao carregar turmas:', error)
          return
        }

        // Para cada turma, contar alunos
        const turmasComCount = await Promise.all(
          (turmasData || []).map(async (turma) => {
            const { count } = await supabase
              .from('alunos')
              .select('*', { count: 'exact', head: true })
              .eq('turma_id', turma.id)
              .eq('active', true)

            return {
              ...turma,
              _count: { alunos: count || 0 }
            }
          })
        )

        setTurmas(turmasComCount)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingTurmas(false)
      }
    }

    loadTurmas()
  }, [user, supabase])

  // Carregar sessões recentes e estatísticas
  useEffect(() => {
    const loadSessoes = async () => {
      if (!user) return

      console.log('👤 Usuário logado:', {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      })

      try {
        // Buscar sessões recentes
        console.log('🔍 Buscando sessões para professor_id:', user.id)
        const { data: sessoesData, error: sessoesError } = await supabase.rpc(
          'get_sessoes_professor',
          { p_professor_id: user.id }
        )

        console.log('📦 Resultado sessões:', { data: sessoesData, error: sessoesError })

        if (sessoesError) {
          console.error('❌ Erro ao carregar sessões:', sessoesError)
          console.error('Detalhes:', {
            message: sessoesError.message,
            details: sessoesError.details,
            hint: sessoesError.hint,
            code: sessoesError.code
          })
        } else {
          console.log('✅ Sessões carregadas:', sessoesData?.length || 0)
          setSessoesRecentes(sessoesData || [])
        }

        // Buscar estatísticas
        console.log('📊 Buscando estatísticas...')
        const { data: statsData, error: statsError } = await supabase.rpc(
          'get_estatisticas_professor',
          { p_professor_id: user.id }
        )

        console.log('📊 Resultado estatísticas:', { data: statsData, error: statsError })

        if (statsError) {
          console.error('❌ Erro ao carregar estatísticas:', statsError)
        } else {
          console.log('✅ Estatísticas carregadas:', statsData)
          setEstatisticas(statsData || {
            total_turmas: 0,
            total_alunos: 0,
            sessoes_realizadas: 0,
            sessoes_ativas: 0
          })
        }
      } catch (error) {
        console.error('💥 Erro fatal:', error)
      } finally {
        setLoadingSessoes(false)
      }
    }

    loadSessoes()
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo, {user.full_name || user.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Dashboard do Professor - Gerencie suas turmas e aulas
        </p>
      </div>

      {/* Minhas Turmas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Minhas Turmas</h2>
          <Button variant="outline" size="sm">
            + Nova Turma
          </Button>
        </div>

        {loadingTurmas ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando turmas...</p>
          </div>
        ) : turmas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma turma encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Crie sua primeira turma para começar
              </p>
              <Button>
                + Criar Primeira Turma
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.map((turma) => (
              <Card key={turma.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{turma.name}</CardTitle>
                  <CardDescription>{turma.grade_level}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Alunos:</span>
                      <span className="font-semibold">{turma._count?.alunos || 0}</span>
                    </div>
                    
                    <div className="pt-3 border-t space-y-2">
                      <Button asChild className="w-full" size="sm">
                        <Link href={`/dashboard/professor/iniciar-sessao?turmaId=${turma.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Sessão
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Ver Alunos
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cards de Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Play className="h-8 w-8 text-blue-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Iniciar Sessão</CardTitle>
            <CardDescription className="text-sm">
              Comece uma nova aula gamificada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="sm">
              <Link href="/dashboard/professor/iniciar-sessao">
                Iniciar Agora
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-green-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Minhas Turmas</CardTitle>
            <CardDescription className="text-sm">
              Gerencie suas turmas e alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              Ver Turmas
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Conteúdos</CardTitle>
            <CardDescription className="text-sm">
              Explore os conteúdos e aulas disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              Ver Conteúdos
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-orange-600" />
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg">Relatórios</CardTitle>
            <CardDescription className="text-sm">
              Acompanhe o progresso dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" size="sm">
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sessões Recentes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Sessões Recentes
          </CardTitle>
          <CardDescription>
            Suas últimas aulas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSessoes ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Carregando sessões...</p>
            </div>
          ) : sessoesRecentes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhuma sessão realizada ainda
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/professor/iniciar-sessao">
                  Iniciar Primeira Sessão
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessoesRecentes.slice(0, 10).map((sessao) => (
                <div
                  key={sessao.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold">{sessao.aula_titulo}</h4>
                      <Badge variant={sessao.status === 'active' ? 'default' : 'secondary'}>
                        {sessao.status === 'active' ? '🟢 Ativa' : '⚪ Encerrada'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {sessao.turma_nome} · {sessao.total_alunos} alunos participaram
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(sessao.data_inicio).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sessao.status === 'active' && (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/professor/sessao/${sessao.id}`}>
                          Ver Sessão
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total de Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{turmas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total de Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {turmas.reduce((acc, t) => acc + (t._count?.alunos || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Sessões Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{estatisticas.sessoes_realizadas}</div>
            {estatisticas.sessoes_ativas > 0 && (
              <p className="text-xs text-green-600 mt-1 font-medium">
                {estatisticas.sessoes_ativas} ativa(s) agora
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guia de Primeiros Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Primeiros Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Crie sua primeira turma em &quot;Minhas Turmas&quot;</li>
            <li>Adicione alunos à turma</li>
            <li>Explore os conteúdos disponíveis</li>
            <li>Inicie uma sessão gamificada com sua turma</li>
            <li>Acompanhe o progresso dos alunos nos relatórios</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
