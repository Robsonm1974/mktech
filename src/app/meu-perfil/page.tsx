'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2, Trophy, TrendingUp, BookOpen, Award } from 'lucide-react'

interface ProfileData {
  aluno: {
    id: string
    full_name: string
    turmas: {
      name: string
    }
    tenants: {
      name: string
    }
  }
  progress: {
    pontos_totais: number
    aulas_completadas: number
    badges_conquistadas: string[]
    ultima_aula_data: string
  }
  badges: Array<{ id: string; titulo: string; icon_url: string }>
  ranking: {
    posicao: number
    total: number
  }
  recentAulas: Array<{ sessions: { aulas: { titulo: string } } | null; pontos_ganhos: number; criada_em: string }>
}

export default function MeuPerfilPage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadProfileData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadProfileData = async () => {
    try {
      const studentSession = localStorage.getItem('studentSession')
      if (!studentSession) {
        throw new Error('Sessão do aluno não encontrada')
      }

      const session = JSON.parse(studentSession)
      
      // Buscar dados do aluno
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select(`
          id,
          full_name,
          turma_id,
          turmas(name),
          tenants(name)
        `)
        .eq('id', session.alunoId)
        .single()

      if (alunoError || !aluno) {
        throw new Error('Dados do aluno não encontrados')
      }

      // Buscar progresso
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('aluno_id', session.alunoId)
        .single()

      // Buscar badges conquistadas
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .in('id', progress?.badges_conquistadas || [])

      // Buscar ranking na turma
      const { data: ranking } = await supabase
        .from('user_progress')
        .select(`
          aluno_id,
          pontos_totais,
          alunos!inner(full_name, turma_id)
        `)
        .eq('alunos.turma_id', aluno.turma_id)
        .order('pontos_totais', { ascending: false })

      const alunoRanking = (ranking?.findIndex(r => r.aluno_id === session.alunoId) ?? -1) + 1
      const totalNaTurma = ranking?.length || 0

      // Buscar aulas recentes
      const { data: aulas } = await supabase
        .from('quiz_responses')
        .select(`
          pontos_ganhos,
          criada_em,
          sessions!inner(
            aula_id,
            aulas!inner(titulo)
          )
        `)
        .eq('aluno_id', session.alunoId)
        .order('criada_em', { ascending: false })
        .limit(5)

      setProfileData({
        aluno: {
          id: aluno.id,
          full_name: aluno.full_name,
          turmas: { name: (aluno.turmas as Array<{ name: string }>)?.[0]?.name || '' },
          tenants: { name: (aluno.tenants as Array<{ name: string }>)?.[0]?.name || '' }
        },
        progress: progress || { pontos_totais: 0, aulas_completadas: 0, badges_conquistadas: [], ultima_aula_data: '' },
        badges: badges || [],
        ranking: {
          posicao: alunoRanking || 0,
          total: totalNaTurma
        },
        recentAulas: (aulas || []) as unknown as Array<{ sessions: { aulas: { titulo: string } } | null; pontos_ganhos: number; criada_em: string }>
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('studentSession')
    window.location.href = '/entrar'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button className="mt-4" onClick={() => window.location.href = '/entrar'}>
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profileData) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="text-gray-600">
                {profileData.aluno.tenants.name} - {profileData.aluno.turmas.name}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Perfil Principal */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {profileData.aluno.full_name.charAt(0)}
              </span>
            </div>
            <CardTitle className="text-2xl">{profileData.aluno.full_name}</CardTitle>
            <CardDescription>
              Estudante da {profileData.aluno.turmas.name}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {profileData.progress.pontos_totais}
              </div>
              <div className="text-sm text-gray-600">Pontos Totais</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {profileData.progress.aulas_completadas}
              </div>
              <div className="text-sm text-gray-600">Aulas Completadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {profileData.badges.length}
              </div>
              <div className="text-sm text-gray-600">Badges Conquistadas</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {profileData.ranking.posicao}
              </div>
              <div className="text-sm text-gray-600">Posição na Turma</div>
            </CardContent>
          </Card>
        </div>

        {/* Ranking */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking da Turma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {profileData.ranking.posicao}º
              </div>
              <div className="text-lg text-gray-600 mb-2">
                de {profileData.ranking.total} alunos
              </div>
              <div className="text-sm text-gray-500">
                Você está entre os {Math.round((profileData.ranking.posicao / profileData.ranking.total) * 100)}% melhores da turma
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        {profileData.badges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Badges Conquistadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profileData.badges.map((badge) => (
                  <div key={badge.id} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-2">🏅</div>
                    <div className="font-medium text-sm">{badge.titulo}</div>
                     <div className="text-xs text-gray-600 mt-1">Badge conquistada</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aulas Recentes */}
        {profileData.recentAulas.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Aulas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profileData.recentAulas.map((aula, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{aula.sessions?.aulas?.titulo || 'Aula'}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(aula.criada_em).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      {aula.pontos_ganhos} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conquistas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 border rounded-lg">
                <div className="text-4xl mb-4">🎯</div>
                <div className="font-semibold mb-2">Precisão</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((profileData.progress.pontos_totais / (profileData.progress.aulas_completadas * 50)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Taxa de acerto média</div>
              </div>

              <div className="text-center p-6 border rounded-lg">
                <div className="text-4xl mb-4">⚡</div>
                <div className="font-semibold mb-2">Consistência</div>
                <div className="text-2xl font-bold text-green-600">
                  {profileData.progress.aulas_completadas > 0 ? 'Excelente' : 'Iniciante'}
                </div>
                <div className="text-sm text-gray-600">Nível de participação</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/entrar">Nova Aula</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/relatorio-aluno">Compartilhar com Pais</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
