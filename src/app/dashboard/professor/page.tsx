'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

export default function ProfessorDashboard() {
  const { user, loading } = useAuth()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loadingTurmas, setLoadingTurmas] = useState(true)
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
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhuma sessão realizada ainda</p>
            <Button className="mt-4" size="sm">
              Iniciar Primeira Sessão
            </Button>
          </div>
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
            <div className="text-3xl font-bold text-purple-600">0</div>
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
