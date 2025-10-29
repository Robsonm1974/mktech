'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import BlocoPlayer from '@/components/aluno/BlocoPlayer'
import AdventureRunnerPlayer from '@/components/games/AdventureRunnerPlayer'
import { QuizAnimado } from '@/components/gamification/QuizAnimado'
import { TransitionScreen } from '@/components/gamification/TransitionScreen'
import { ConfettiCelebration } from '@/components/gamification/ConfettiCelebration'
import { ArrowLeft, ArrowRight, Play, Loader2 } from 'lucide-react'

type PreviewItem =
  | {
      tipo: 'bloco'
      ordem: number
      dados: {
        id: string
        titulo: string
        tipo_midia: string | null
        midia_url: string | null
        conteudo_texto: string | null
      }
    }
  | {
      tipo: 'jogo'
      ordem: number
      dados: {
        id: string
        titulo: string
        duracao_segundos: number
      }
    }

type QuizPreview = {
  id: string
  titulo: string
  tipo: string
  perguntas: Array<{ id: string; prompt: string; choices: string[]; correctIndex: number; pontos: number }>
  bloco_template_id?: string
}

export default function AulaPreviewPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [aulaTitulo, setAulaTitulo] = useState<string>('Aula')
  const [itens, setItens] = useState<PreviewItem[]>([])
  const [index, setIndex] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizzesByBloco, setQuizzesByBloco] = useState<Record<string, QuizPreview>>({})

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: aulaData } = await supabase
          .from('aulas')
          .select('id, titulo')
          .eq('id', params.id)
          .single()
        setAulaTitulo(aulaData?.titulo || 'Aula')

        // Blocos da aula
        const { data: blocos } = await supabase
          .from('aulas_blocos')
          .select(`
            ordem_na_aula,
            bloco_template_id,
            blocos_templates ( id, titulo, tipo_midia, midia_url, conteudo_texto )
          `)
          .eq('aula_id', params.id)
          .order('ordem_na_aula')

        // Jogos da aula
        const { data: jogos } = await supabase
          .from('aulas_jogos')
          .select(`
            ordem_na_aula,
            game_id,
            games ( id, titulo, duracao_segundos )
          `)
          .eq('aula_id', params.id)
          .order('ordem_na_aula')

        type MaybeArray<T> = T | T[]
        type BlocoTemplatePartial = { id?: string; titulo?: string; tipo_midia?: string | null; midia_url?: string | null; conteudo_texto?: string | null }
        interface BlocoRel { ordem_na_aula: number; blocos_templates?: MaybeArray<BlocoTemplatePartial> }
        interface GamePartial { id?: string; titulo?: string; duracao_segundos?: number }
        interface JogoRel { ordem_na_aula: number; games?: MaybeArray<GamePartial> }

        const blocosCast = (blocos as unknown as BlocoRel[]) || []
        const jogosCast = (jogos as unknown as JogoRel[]) || []

        const itensPreview: PreviewItem[] = [
          ...blocosCast.map((b) => {
            const raw = b.blocos_templates as MaybeArray<BlocoTemplatePartial> | undefined
            const bt = Array.isArray(raw) ? raw[0] : raw
            return {
              tipo: 'bloco' as const,
              ordem: b.ordem_na_aula,
              dados: {
                id: bt?.id ?? '',
                titulo: bt?.titulo ?? 'Bloco',
                tipo_midia: bt?.tipo_midia ?? null,
                midia_url: bt?.midia_url ?? null,
                conteudo_texto: bt?.conteudo_texto ?? null,
              },
            }
          }),
          ...jogosCast.map((j) => {
            const raw = j.games as MaybeArray<GamePartial> | undefined
            const g = Array.isArray(raw) ? raw[0] : raw
            return {
              tipo: 'jogo' as const,
              ordem: j.ordem_na_aula,
              dados: {
                id: g?.id ?? '',
                titulo: g?.titulo ?? 'Jogo',
                duracao_segundos: g?.duracao_segundos ?? 60,
              },
            }
          }),
        ]
          .filter((i) => Boolean(i.dados.id))
          .sort((a, b) => a.ordem - b.ordem)

        setItens(itensPreview)
        setIndex(0)
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Quando a sequência é carregada, buscar quizzes por bloco_template_id
  useEffect(() => {
    const fetchQuizzes = async () => {
      const blocoIds = itens
        .filter(i => i.tipo === 'bloco')
        .map(i => i.dados.id)
      if (blocoIds.length === 0) return

      const { data } = await supabase
        .from('quizzes')
        .select('id, titulo, tipo, perguntas, bloco_template_id')
        .in('bloco_template_id', blocoIds)

      const map: Record<string, QuizPreview> = {}
      ;(data || []).forEach((q: QuizPreview) => {
        if (q.bloco_template_id) map[q.bloco_template_id] = q
      })
      setQuizzesByBloco(map)
    }
    if (itens.length > 0) fetchQuizzes()
  }, [itens, supabase])

  const itemAtual = useMemo(() => itens[index] || null, [itens, index])

  // Resetar estado de quiz ao mudar item
  useEffect(() => {
    setShowQuiz(false)
  }, [index])

  const handleItemComplete = () => {
    // Se houver próximo item, mostra transição e avança; senão, celebração
    if (index < itens.length - 1) {
      setShowTransition(true)
      setTimeout(() => {
        setShowTransition(false)
        setIndex((i) => Math.min(i + 1, itens.length - 1))
      }, 2500)
    } else {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3500)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!itemAtual) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">{aulaTitulo}</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-slate-600">Esta aula não possui itens para preview.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Preview: {aulaTitulo}</h1>
        </div>
        <div className="text-sm text-slate-600">Item {index + 1} de {itens.length}</div>
      </div>

      {/* Player */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">{itemAtual.dados.titulo}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {itemAtual.tipo === 'bloco' ? (
            !showQuiz ? (
              <BlocoPlayer
                blocoId={itemAtual.dados.id}
                tipo_midia={itemAtual.dados.tipo_midia}
                midia_url={itemAtual.dados.midia_url}
                conteudo_texto={itemAtual.dados.conteudo_texto}
                onComplete={() => {
                  const hasQuiz = Boolean(quizzesByBloco[itemAtual.dados.id])
                  if (hasQuiz) setShowQuiz(true)
                  else handleItemComplete()
                }}
              />
            ) : (
              quizzesByBloco[itemAtual.dados.id] ? (
                <QuizAnimado
                  quiz={quizzesByBloco[itemAtual.dados.id]!}
                  onResposta={async () => { /* preview não grava */ }}
                  onQuizCompleto={() => handleItemComplete()}
                />
              ) : null
            )
          ) : (
            <AdventureRunnerPlayer
              questions={[]}
              duration={itemAtual.dados.duracao_segundos}
              onComplete={() => handleItemComplete()}
            />
          )}

          {/* Controles */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIndex((i) => Math.min(i + 1, itens.length - 1))}
                disabled={index >= itens.length - 1}
              >
                Próximo <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={() => setIndex(0)}>
                <Play className="h-4 w-4 mr-2" /> Recomeçar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tela de Transição entre itens (preview) */}
      {showTransition && (
        <TransitionScreen
          blocoAnterior={{
            titulo: itemAtual.dados.titulo,
            tempoGasto: 30,
            acertos: 0,
            erros: 0,
            pontosGanhos: 0,
            totalPerguntas: 0,
          }}
          proximoBloco={index < itens.length - 1 ? { titulo: itens[index + 1]?.dados.titulo ?? 'Próximo', tipo: itens[index + 1]?.tipo ?? 'bloco' } : null}
          progressoGeral={{ blocoAtual: index + 1, totalBlocos: itens.length, pontosAcumulados: 0 }}
          onContinuar={() => {
            setShowTransition(false)
            setIndex((i) => Math.min(i + 1, itens.length - 1))
          }}
          autoAdvance={true}
          countdownSeconds={3}
          showConfetti={false}
        />
      )}

      {/* Celebração ao concluir todos itens (preview) */}
      {showCelebration && (
        <ConfettiCelebration
          estatisticas={{
            totalBlocos: itens.length,
            totalPontos: 0,
            tempoTotal: 0,
            acertosTotal: 0,
            errosTotal: 0,
            performance: 100,
          }}
          onFechar={() => setShowCelebration(false)}
          duracao={3000}
        />
      )}
    </div>
  )
}


