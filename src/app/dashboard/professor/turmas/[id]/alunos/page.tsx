'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, User, Trophy } from 'lucide-react'

interface Aluno {
  id: string
  full_name: string
  pin_code: string | null
  icone_afinidade: string | null
  active?: boolean | null
  sessoes_participadas: number
  total_pontos: number
}

export default function AlunosDaTurmaPage() {
  const params = useParams()
  const router = useRouter()
  const turmaId = params.id as string

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmaNome, setTurmaNome] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [turmaId])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()

      // 1. Buscar informações da turma
      const { data: turma, error: turmaError } = await supabase
        .from('turmas')
        .select('id, name')
        .eq('id', turmaId)
        .single()

      if (turmaError) throw turmaError

      setTurmaNome(turma?.name || 'Turma')

      // 2. Buscar alunos da turma (mesma lógica da página de sessão, filtrando por turma)
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('id, full_name, pin_code, icone_afinidade, active')
        .eq('turma_id', turmaId)
        .eq('active', true)
        .order('full_name')

      if (alunosError) throw alunosError

      // 3. Para cada aluno, buscar estatísticas de participação
      const alunosComStats = await Promise.all(
        (alunosData || []).map(async (aluno) => {
          // Buscar participações do aluno (para contar sessões e obter IDs)
          const { data: participacoes } = await supabase
            .from('participacoes_sessao')
            .select('id, session_id')
            .eq('aluno_id', aluno.id)

          const sessoesUnicas = new Set(participacoes?.map(p => p.session_id) || []).size
          const participacaoIds = participacoes?.map(p => p.id) || []

          // Buscar pontos totais do progresso de blocos usando participacao_id
          let totalPontos = 0
          if (participacaoIds.length > 0) {
            const { data: progressos } = await supabase
              .from('progresso_blocos')
              .select('pontos_total')
              .in('participacao_id', participacaoIds)

            totalPontos = progressos?.reduce((sum, p) => sum + (p.pontos_total || 0), 0) || 0
          }

          return {
            ...aluno,
            sessoes_participadas: sessoesUnicas,
            total_pontos: totalPontos
          }
        })
      )

      setAlunos(alunosComStats)
    } catch (err) {
      console.error('Erro ao carregar alunos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function renderIcone(icone: string | null) {
    switch (icone) {
      case 'dog': return '🐶'
      case 'cat': return '🐱'
      case 'lion': return '🦁'
      case 'tiger': return '🐯'
      case 'bear': return '🐻'
      case 'panda': return '🐼'
      case 'koala': return '🐨'
      case 'fox': return '🦊'
      case 'rabbit': return '🐰'
      case 'frog': return '🐸'
      case 'monkey': return '🐵'
      case 'pig': return '🐷'
      case 'cow': return '🐮'
      case 'horse': return '🐴'
      case 'unicorn': return '🦄'
      case 'dragon': return '🐉'
      case 'dinosaur': return '🦕'
      case 'whale': return '🐋'
      case 'dolphin': return '🐬'
      case 'shark': return '🦈'
      default: return '🙂'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando alunos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-red-600 font-semibold">Erro ao carregar alunos</p>
          <p className="text-slate-600 mt-2">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Voltar
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="hover:bg-indigo-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Alunos da Turma</h1>
                <p className="text-slate-600">{turmaNome}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Total de alunos</p>
              <p className="text-3xl font-bold text-indigo-600">{alunos.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {alunos.length === 0 ? (
          <Card className="p-12 text-center bg-white/60 backdrop-blur-sm">
            <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Nenhum aluno encontrado
            </h3>
            <p className="text-slate-500">
              Esta turma ainda não possui alunos cadastrados.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alunos.map((aluno) => (
              <Card
                key={aluno.id}
                className="p-6 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 hover:border-indigo-300"
              >
                {/* Ícone e Nome */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                    {renderIcone(aluno.icone_afinidade)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">
                      {aluno.full_name}
                    </h3>
                    <p className="text-sm text-slate-500">PIN: <span className="font-semibold text-indigo-600">{aluno.pin_code || '—'}</span></p>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1">Sessões</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {aluno.sessoes_participadas}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-600 font-medium mb-1 flex items-center justify-center gap-1">
                      <Trophy className="h-3 w-3" />
                      Pontos
                    </p>
                    <p className="text-2xl font-bold text-amber-700">
                      {aluno.total_pontos}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

