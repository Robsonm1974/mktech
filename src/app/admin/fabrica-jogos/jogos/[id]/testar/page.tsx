'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import AdventureRunnerPlayer from '@/components/games/AdventureRunnerPlayer'

interface Question {
  id: string
  pergunta: string
  opcoes: { id: string; texto: string; correta: boolean }[]
  explicacao: string
}

interface Game {
  id: string
  titulo: string
  descricao: string | null
  duracao_segundos: number
  filtro_perguntas: {
    ano_escolar_id: string
    disciplina_id: string | null
    dificuldades: string[]
    quantidade: number
  }
}

export default function TestarJogoPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  
  const [game, setGame] = useState<Game | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGame()
  }, [])

  const loadGame = async () => {
    try {
      setLoading(true)
      
      const gameId = params.id as string

      // Carregar jogo
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single()

      if (gameError) throw gameError

      setGame(gameData)

      // Sortear perguntas
      const filtro = gameData.filtro_perguntas
      
      let query = supabase
        .from('banco_perguntas')
        .select('id, pergunta, opcoes, explicacao')
        .eq('ano_escolar_id', filtro.ano_escolar_id)
        .eq('ativa', true)

      if (filtro.disciplina_id) {
        query = query.eq('disciplina_id', filtro.disciplina_id)
      }

      if (filtro.dificuldades && filtro.dificuldades.length > 0) {
        query = query.in('dificuldade', filtro.dificuldades)
      }

      query = query.limit(filtro.quantidade || 3)

      const { data: questionsData, error: questionsError } = await query

      if (questionsError) throw questionsError

      setQuestions(questionsData || [])

      if (!questionsData || questionsData.length === 0) {
        toast.error('Nenhuma pergunta encontrada com esses filtros!')
      }

    } catch (error) {
      console.error('Erro ao carregar jogo:', error)
      toast.error('Erro ao carregar jogo')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = (score: number, coins: number) => {
    console.log('🏁 Jogo completado!', { score, coins })
    toast.success(`Jogo completado! ${coins} moedas coletadas!`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando jogo...</p>
        </div>
      </div>
    )
  }

  if (!game || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {!game ? 'Jogo não encontrado' : 'Sem perguntas disponíveis'}
          </h2>
          <p className="text-slate-600 mb-6">
            {!game 
              ? 'Este jogo não existe ou foi removido'
              : 'Nenhuma pergunta foi encontrada com os filtros configurados'
            }
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header fixo */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-white font-bold">{game.titulo}</h1>
              <p className="text-slate-400 text-sm">
                {questions.length} perguntas • {game.duracao_segundos}s
              </p>
            </div>
          </div>
          <div className="text-yellow-400 font-bold text-sm">
            🎮 MODO TESTE
          </div>
        </div>
      </div>

      {/* Game Player */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl aspect-video">
          <AdventureRunnerPlayer
            questions={questions}
            duration={game.duracao_segundos}
            onComplete={handleComplete}
          />
        </div>
      </div>
    </div>
  )
}

