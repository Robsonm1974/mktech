'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2, Play, Trophy, Star, CheckCircle2, Lock, AlertCircle, Sparkles, Target } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// ============================================================================
// INTERFACES
// ============================================================================

interface BlocoTemplate {
  id: string
  titulo: string
  conteudo_texto: string
  tipo_midia: string
  midia_url: string
  midia_metadata: Record<string, unknown>
  pontos_bloco: number
  quiz_id: string | null
  quizzes: Quiz | null
}

interface Quiz {
  id: string
  titulo: string
  tipo: string
  perguntas: Array<{
    id: string
    prompt: string
    choices: string[]
    correctIndex: number
    pontos: number
  }>
}

interface BlocoWithOrder extends BlocoTemplate {
  ordem: number
}

interface Participacao {
  id: string
  bloco_atual_numero: number
  blocos_completados: number
  total_blocos: number
  pontos_ganhos_sessao: number
  status: string
}

interface ProgressoBloco {
  numero_sequencia: number
  bloco_id: string
  status: 'locked' | 'active' | 'completed'
  pontos_total: number
  iniciado_em: string | null
  completado_em: string | null
}

interface StudentSession {
  alunoId: string
  sessionId: string
  tenantSlug: string
  authenticated: boolean
  timestamp: number
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SessaoPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const supabase = createSupabaseBrowserClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Estados principais
  const [loading, setLoading] = useState(true)
  const [studentSession, setStudentSession] = useState<StudentSession | null>(null)
  const [participacaoId, setParticipacaoId] = useState<string | null>(null)
  
  // Dados da sessão
  const [aula, setAula] = useState<{ id: string; titulo: string; descricao: string } | null>(null)
  const [blocos, setBlocos] = useState<BlocoWithOrder[]>([])
  const [participacao, setParticipacao] = useState<Participacao | null>(null)
  
  // Estado do bloco atual
  const [blocoAtual, setBlocoAtual] = useState<BlocoWithOrder | null>(null)
  const [blocoAtivo, setBlocoAtivo] = useState(false)
  const [blocoConteudoVisto, setBlocoConteudoVisto] = useState(false)
  
  // Estado do quiz
  const [quizAtivo, setQuizAtivo] = useState(false)
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<number[]>([])
  const [tentativas, setTentativas] = useState<number[]>([])
  const [quizzesCompletados, setQuizzesCompletados] = useState<Set<string>>(new Set())

  // Sons
  const playSound = (soundName: string) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${soundName}.mp3`
      audioRef.current.play().catch(() => {
        // Silenciar erros de autoplay
      })
    }
  }

  // ============================================================================
  // INICIALIZAÇÃO
  // ============================================================================

  useEffect(() => {
    initializeSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const initializeSession = async () => {
    try {
      // 1. Carregar dados do aluno do localStorage
      const studentData = localStorage.getItem('studentSession')
      if (!studentData) {
        toast({
          title: 'Erro',
          description: 'Sessão do aluno não encontrada',
          variant: 'destructive'
        })
        router.push('/entrar')
        return
      }

      const student: StudentSession = JSON.parse(studentData)
      setStudentSession(student)

      // 2. Registrar entrada do aluno na sessão
      const { data: entradaData, error: entradaError } = await supabase.rpc('aluno_entrar_sessao', {
        p_session_id: sessionId,
        p_aluno_id: student.alunoId
      })

      if (entradaError || !entradaData.success) {
        throw new Error(entradaData?.message || 'Erro ao entrar na sessão')
      }

      setParticipacaoId(entradaData.participacao_id)

      // 3. Carregar dados da sessão
      await loadSessionData(student.alunoId)

    } catch (error) {
      console.error('Erro ao inicializar:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar sessão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSessionData = async (alunoId: string) => {
    try {
      // Buscar sessão básica
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, aula_id, status')
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        throw new Error('Sessão não encontrada')
      }

      // Buscar aula
      const { data: aulaData, error: aulaError } = await supabase
        .from('aulas')
        .select('id, titulo, descricao')
        .eq('id', session.aula_id)
        .single()

      if (aulaError || !aulaData) {
        throw new Error('Aula não encontrada')
      }

      setAula(aulaData as { id: string; titulo: string; descricao: string })

      // Buscar blocos da aula usando RPC (bypass RLS)
      console.log('🔍 Buscando blocos para session_id:', sessionId)
      
      const { data: blocosResponse, error: blocosError } = await supabase.rpc(
        'get_blocos_sessao',
        { p_session_id: sessionId }
      )

      console.log('📦 Resultado blocosResponse:', blocosResponse)
      console.log('❌ Erro blocosError:', blocosError)

      if (blocosError || !blocosResponse?.success) {
        console.error('❌ ERRO:', blocosError || blocosResponse?.error)
        throw new Error('Erro ao carregar blocos: ' + (blocosError?.message || blocosResponse?.error || 'Erro desconhecido'))
      }

      // Transformar blocos do formato RPC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocosTransformados: BlocoWithOrder[] = (blocosResponse.blocos || []).map((bloco: any) => ({
        id: bloco.id,
        titulo: bloco.titulo,
        conteudo_texto: bloco.conteudo_texto,
        tipo_midia: bloco.tipo_midia,
        midia_url: bloco.midia_url,
        midia_metadata: bloco.midia_metadata,
        pontos_bloco: bloco.pontos_bloco,
        quiz_id: bloco.quiz_id,
        quizzes: bloco.quiz,
        ordem: bloco.ordem_na_aula
      }))

      console.log('📦 Blocos transformados:', blocosTransformados)
      console.log('📊 Total de blocos:', blocosTransformados.length)

      setBlocos(blocosTransformados)

      // Se não há blocos, mostrar erro
      if (blocosTransformados.length === 0) {
        throw new Error('Esta aula não tem blocos vinculados')
      }

      // Carregar progresso do aluno (passando blocos como parâmetro)
      await loadProgresso(alunoId, blocosTransformados)

    } catch (error) {
      console.error('Erro ao carregar dados da sessão:', error)
      throw error
    }
  }

  const loadProgresso = async (alunoId: string, blocosDisponiveis: BlocoWithOrder[]) => {
    try {
      console.log('🔄 Carregando progresso do aluno:', alunoId)
      
      const { data: progressoData, error: progressoError } = await supabase.rpc(
        'get_progresso_aluno_sessao',
        {
          p_session_id: sessionId,
          p_aluno_id: alunoId
        }
      )

      console.log('📊 Progresso retornado:', progressoData)
      console.log('❌ Erro ao carregar progresso:', progressoError)

      if (progressoError) {
        console.error('❌ Erro detalhado:', progressoError)
        return
      }

      if (progressoData) {
        console.log('✅ Participação:', progressoData.participacao)
        console.log('✅ Blocos progresso:', progressoData.blocos)
        
        setParticipacao(progressoData.participacao)

        // Encontrar bloco ativo
        const blocoAtivoData = progressoData.blocos?.find((b: ProgressoBloco) => b.status === 'active')
        console.log('🎯 Bloco ativo encontrado:', blocoAtivoData)
        console.log('🆔 ID procurado:', blocoAtivoData?.bloco_id)
        console.log('📋 IDs disponíveis:', blocosDisponiveis.map(b => ({ id: b.id, titulo: b.titulo })))
        
        if (blocoAtivoData) {
          const blocoEncontrado = blocosDisponiveis.find(b => b.id === blocoAtivoData.bloco_id)
          console.log('📦 Bloco correspondente:', blocoEncontrado)
          
          if (blocoEncontrado) {
            setBlocoAtual(blocoEncontrado)
            console.log('✅ Bloco atual definido!')
          } else {
            console.warn('⚠️ Bloco não encontrado na lista de blocos')
          }
        } else {
          console.warn('⚠️ Nenhum bloco com status "active" encontrado')
          
          // Verificar se a sessão está completa antes de fazer fallback
          if (progressoData.participacao.status === 'completed' || 
              progressoData.participacao.blocos_completados === progressoData.participacao.total_blocos) {
            console.log('✅ SESSÃO COMPLETA! Não fazer fallback')
            // Não fazer nada, deixar que a tela de conclusão apareça
          } else {
            // FALLBACK: Se não encontrou progresso, iniciar com primeiro bloco
            if (blocosDisponiveis.length > 0) {
              console.log('🔄 FALLBACK: Usando primeiro bloco da lista')
              setBlocoAtual(blocosDisponiveis[0])
              setParticipacao({
                id: '',
                bloco_atual_numero: 1,
                blocos_completados: 0,
                total_blocos: blocosDisponiveis.length,
                pontos_ganhos_sessao: 0,
                status: 'active'
              })
            }
          }
        }
      } else {
        console.warn('⚠️ progressoData vazio')
        // FALLBACK: Se não tem progresso, iniciar com primeiro bloco
        if (blocosDisponiveis.length > 0) {
          console.log('🔄 FALLBACK: Usando primeiro bloco da lista')
          setBlocoAtual(blocosDisponiveis[0])
          setParticipacao({
            id: '',
            bloco_atual_numero: 1,
            blocos_completados: 0,
            total_blocos: blocosDisponiveis.length,
            pontos_ganhos_sessao: 0,
            status: 'active'
          })
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar progresso:', error)
    }
  }

  // ============================================================================
  // CONTROLE DE BLOCOS
  // ============================================================================

  const handleIniciarBloco = () => {
    setBlocoAtivo(true)
    playSound('click')
    toast({
      title: 'Bloco iniciado!',
      description: 'Assista ao conteúdo e responda o quiz'
    })
  }

  const handleConteudoVistoCompleto = () => {
    setBlocoConteudoVisto(true)
    playSound('success')
    
    // Se não tem quiz, completar bloco automaticamente
    if (!blocoAtual?.quiz_id) {
      handleCompletarBloco()
    } else {
      setQuizAtivo(true)
    }
  }

  const handleCompletarBloco = async () => {
    if (!participacaoId || !blocoAtual) return

    try {
      const { data, error } = await supabase.rpc('aluno_completar_bloco', {
        p_participacao_id: participacaoId,
        p_bloco_template_id: blocoAtual.id,
        p_pontos_conteudo: blocoAtual.pontos_bloco
      })

      if (error || !data.success) {
        throw new Error(data?.message || 'Erro ao completar bloco')
      }

      playSound('achievement')
      toast({
        title: 'Bloco completado!',
        description: `+${blocoAtual.pontos_bloco} pontos`,
        variant: 'default'
      })

      // Recarregar progresso
      if (studentSession) {
        await loadProgresso(studentSession.alunoId, blocos)
      }

      // Resetar estados
      setBlocoAtivo(false)
      setBlocoConteudoVisto(false)
      setQuizAtivo(false)
      setRespostasSelecionadas([])
      setTentativas([])

      // Se sessão completa
      if (data.sessao_completa) {
        playSound('level-up')
        toast({
          title: '🎉 Sessão Completa!',
          description: 'Parabéns! Você completou todos os blocos!',
          variant: 'default'
        })
      }

    } catch (error) {
      console.error('Erro ao completar bloco:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao completar bloco',
        variant: 'destructive'
      })
    }
  }

  // ============================================================================
  // CONTROLE DO QUIZ
  // ============================================================================

  const handleSelecionarResposta = (perguntaIndex: number, respostaIndex: number) => {
    playSound('click')
    const novasRespostas = [...respostasSelecionadas]
    novasRespostas[perguntaIndex] = respostaIndex
    setRespostasSelecionadas(novasRespostas)
  }

  const handleResponderPergunta = async (perguntaIndex: number) => {
    if (!blocoAtual?.quizzes || !participacaoId || !studentSession) return

    const quiz = blocoAtual.quizzes
    const pergunta = quiz.perguntas[perguntaIndex]
    
    if (!pergunta) {
      toast({
        title: 'Erro',
        description: 'Pergunta não encontrada',
        variant: 'destructive'
      })
      return
    }
    
    const respostaSelecionada = respostasSelecionadas[perguntaIndex]

    if (respostaSelecionada === undefined) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma resposta',
        variant: 'destructive'
      })
      return
    }

    const correto = respostaSelecionada === pergunta.correctIndex
    const tentativaAtual = (tentativas[perguntaIndex] || 0) + 1

    // Calcular pontos (1ª tentativa = 100%, 2ª = 50%, 3ª+ = 0%)
    let pontosGanhos = 0
    if (correto) {
      if (tentativaAtual === 1) {
        pontosGanhos = pergunta.pontos
      } else if (tentativaAtual === 2) {
        pontosGanhos = Math.floor(pergunta.pontos / 2)
      }
    }

    try {
      // Registrar resposta
      const { data, error } = await supabase.rpc('registrar_resposta_quiz', {
        p_quiz_id: quiz.id,
        p_aluno_id: studentSession.alunoId,
        p_session_id: sessionId,
        p_participacao_id: participacaoId,
        p_pergunta_index: perguntaIndex,
        p_resposta_escolhida: respostaSelecionada,
        p_correto: correto,
        p_pontos_ganhos: pontosGanhos,
        p_tentativa_numero: tentativaAtual
      })

      if (error || !data.success) {
        throw new Error(data?.message || 'Erro ao registrar resposta')
      }

      if (correto) {
        playSound('success')
        toast({
          title: '✅ Correto!',
          description: `+${pontosGanhos} pontos`,
          variant: 'default'
        })

        // Marcar como completado
        const novasTentativas = [...tentativas]
        novasTentativas[perguntaIndex] = -1 // -1 indica completado
        setTentativas(novasTentativas)

        // Verificar se todas as perguntas foram respondidas
        const todasRespondidas = quiz.perguntas.every((_, idx) => novasTentativas[idx] === -1)
        
        if (todasRespondidas && !quizzesCompletados.has(quiz.id)) {
          setQuizzesCompletados(prev => new Set(prev).add(quiz.id))
          
          // Completar bloco após pequeno delay
          setTimeout(() => {
            handleCompletarBloco()
          }, 1500)
        }

      } else {
        const novasTentativas = [...tentativas]
        
        // Se esgotou as tentativas, marcar como "completado" (com 0 pontos)
        if (tentativaAtual >= 2) {
          novasTentativas[perguntaIndex] = -1 // Marcar como completado
          playSound('badge-unlock')
          
          toast({
            title: '❌ Incorreto',
            description: 'Sem mais tentativas. Avançando...',
            variant: 'destructive'
          })

          // Verificar se todas as perguntas foram respondidas/esgotadas
          const todasRespondidas = quiz.perguntas.every((_, idx) => novasTentativas[idx] === -1)
          
          if (todasRespondidas && !quizzesCompletados.has(quiz.id)) {
            setQuizzesCompletados(prev => new Set(prev).add(quiz.id))
            
            // Completar bloco após pequeno delay
            setTimeout(() => {
              handleCompletarBloco()
            }, 1500)
          }
        } else {
          novasTentativas[perguntaIndex] = tentativaAtual
          playSound('click')
          
          toast({
            title: '❌ Incorreto',
            description: 'Tente novamente!',
            variant: 'destructive'
          })
        }
        
        setTentativas(novasTentativas)
      }

    } catch (error) {
      console.error('Erro ao registrar resposta:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao registrar resposta',
        variant: 'destructive'
      })
    }
  }

  // ============================================================================
  // RENDERIZAÇÃO DE CONTEÚDO
  // ============================================================================

  const renderConteudo = () => {
    if (!blocoAtual) return null

    switch (blocoAtual.tipo_midia) {
      case 'video':
        // Detectar se é YouTube
        const isYouTube = blocoAtual.midia_url?.includes('youtube.com') || blocoAtual.midia_url?.includes('youtu.be')
        
        if (isYouTube) {
          // Extrair ID do YouTube
          let videoId = ''
          try {
            const url = new URL(blocoAtual.midia_url)
            videoId = url.searchParams.get('v') || url.pathname.split('/').pop() || ''
          } catch (e) {
            console.error('Erro ao parsear URL do YouTube:', e)
          }

          return (
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )
        }

        // Vídeo local
        return (
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={blocoAtual.midia_url}
              controls
              className="w-full h-full"
              onEnded={() => handleConteudoVistoCompleto()}
            >
              Seu navegador não suporta vídeos.
            </video>
          </div>
        )

      case 'apresentacao':
      case 'texto':
        return (
          <Card className="rounded-3xl shadow-xl border-0">
            <CardContent className="p-8">
              <div 
                className="prose max-w-none text-lg"
                dangerouslySetInnerHTML={{ __html: blocoAtual.conteudo_texto }}
              />
            </CardContent>
          </Card>
        )

      case 'animacao_lottie':
        return (
          <Card className="rounded-3xl shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Animação Lottie</p>
              <p className="text-sm">URL: {blocoAtual.midia_url}</p>
            </CardContent>
          </Card>
        )

      default:
        return (
          <Card className="rounded-3xl shadow-xl border-0">
            <CardContent className="p-8">
              <p>Tipo de mídia não suportado: {blocoAtual.tipo_midia}</p>
            </CardContent>
          </Card>
        )
    }
  }

  const renderQuiz = () => {
    if (!blocoAtual?.quizzes) return null

    const quiz = blocoAtual.quizzes

    return (
      <div className="space-y-6">
        <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              {quiz.titulo}
            </CardTitle>
            <CardDescription className="text-base">
              Responda corretamente para ganhar pontos!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {quiz.perguntas.map((pergunta, idx) => {
              const tentativa = tentativas[idx] || 0
              const completada = tentativa === -1
              const respostaSelecionada = respostasSelecionadas[idx]

              return (
                <div key={idx} className="p-6 bg-white rounded-2xl shadow-lg border-2 border-gray-100 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-bold text-lg">{pergunta.prompt}</h4>
                    <Badge 
                      variant={completada ? 'default' : 'outline'}
                      className={`px-4 py-2 text-sm font-bold ${
                        completada ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                      }`}
                    >
                      {completada ? '✓ Completo' : `${pergunta.pontos} pts`}
                    </Badge>
                  </div>

                  {!completada && (
                    <>
                      <div className="space-y-3">
                        {pergunta.choices.map((choice, choiceIdx) => (
                          <button
                            key={choiceIdx}
                            onClick={() => handleSelecionarResposta(idx, choiceIdx)}
                            disabled={completada}
                            className={`w-full p-4 text-left border-2 rounded-xl transition-all font-medium ${
                              respostaSelecionada === choiceIdx
                                ? 'border-[#667eea] bg-gradient-to-r from-[#667eea]/10 to-[#764ba2]/10 shadow-md transform scale-[1.02]'
                                : 'border-gray-200 hover:border-gray-400 hover:shadow-md hover:transform hover:scale-[1.01]'
                            } ${completada ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#667eea] text-white font-bold mr-3">
                              {String.fromCharCode(65 + choiceIdx)}
                            </span>
                            {choice}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <p className="text-sm text-muted-foreground font-medium">
                          {tentativa > 0 && `Tentativa ${tentativa}/2`}
                        </p>
                        <Button
                          onClick={() => handleResponderPergunta(idx)}
                          disabled={respostaSelecionada === undefined || tentativa >= 2}
                          size="lg"
                          className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] to-[#6a3d8f] px-8 font-bold shadow-lg"
                        >
                          Responder
                        </Button>
                      </div>
                    </>
                  )}

                  {completada && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                      <span className="text-green-700 font-bold">Pergunta respondida corretamente!</span>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white text-xl font-bold">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  // Tela de conclusão da sessão
  if (participacao?.status === 'completed' || participacao?.blocos_completados === participacao?.total_blocos) {
    return (
      <>
        <audio ref={audioRef} />
        <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full rounded-3xl shadow-2xl border-0">
            <CardHeader className="text-center space-y-6 pb-4">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl">
                <Trophy className="h-20 w-20 text-white" />
              </div>
              <CardTitle className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                🎉 Parabéns!
              </CardTitle>
              <CardDescription className="text-xl text-gray-600">
                Você completou a aula com sucesso!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                  <div className="text-4xl font-black text-blue-600 mb-2">{participacao.blocos_completados}</div>
                  <div className="text-sm text-gray-600 font-medium">Blocos Completados</div>
                </div>
                <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-200">
                  <div className="text-4xl font-black text-yellow-600 mb-2">{participacao.pontos_ganhos_sessao}</div>
                  <div className="text-sm text-gray-600 font-medium">Pontos Ganhos</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => {
                    playSound('click')
                    window.location.href = '/meu-perfil'
                  }} 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] to-[#6a3d8f] text-lg font-bold shadow-lg"
                >
                  Ver Meu Perfil
                </Button>
                <Button 
                  onClick={() => {
                    playSound('click')
                    window.location.href = '/entrar'
                  }} 
                  variant="outline" 
                  size="lg" 
                  className="w-full text-lg font-bold border-2"
                >
                  Participar de Outra Aula
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!blocoAtual || !participacao) {
    return (
      <>
        <audio ref={audioRef} />
        <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-3xl shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                Aguardando
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Nenhum bloco disponível no momento.</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <audio ref={audioRef} />
      
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header com Progresso */}
          <Card className="rounded-3xl shadow-2xl border-0 bg-white">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent mb-2">
                    {aula?.titulo}
                  </CardTitle>
                  <CardDescription className="text-base font-medium flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Bloco {participacao.bloco_atual_numero} de {participacao.total_blocos}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-gradient-to-br from-yellow-50 to-yellow-100 px-6 py-4 rounded-2xl border-2 border-yellow-200">
                  <Trophy className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-3xl font-black text-yellow-600">
                      {participacao.pontos_ganhos_sessao}
                    </div>
                    <p className="text-xs text-gray-600 font-medium">pontos</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm font-medium text-gray-600">
                  <span>Progresso Geral</span>
                  <span>{Math.round((participacao.blocos_completados / participacao.total_blocos) * 100)}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all duration-1000"
                    style={{ width: `${(participacao.blocos_completados / participacao.total_blocos) * 100}%` }}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Conteúdo do Bloco */}
          {!blocoAtivo ? (
            <Card className="rounded-3xl shadow-2xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Lock className="h-8 w-8 text-[#667eea]" />
                  {blocoAtual.titulo}
                </CardTitle>
                <CardDescription className="text-base font-medium">
                  {blocoAtual.pontos_bloco} pontos {blocoAtual.quiz_id && '+ Quiz Interativo'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleIniciarBloco} 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] to-[#6a3d8f] text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
                >
                  <Play className="mr-3 h-6 w-6" />
                  Iniciar Bloco
                  <Sparkles className="ml-3 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {!blocoConteudoVisto && (
                <Card className="rounded-3xl shadow-2xl border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black text-gray-800">{blocoAtual.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {renderConteudo()}
                    
                    {/* Botão para avançar */}
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={handleConteudoVistoCompleto}
                        size="lg"
                        className="w-full max-w-md bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] to-[#6a3d8f] text-lg font-bold shadow-xl hover:scale-[1.02] transition-all"
                      >
                        {blocoAtual.quiz_id ? (
                          <>Continuar para o Quiz <Star className="ml-2 h-5 w-5" /></>
                        ) : (
                          <>Completar Bloco <CheckCircle2 className="ml-2 h-5 w-5" /></>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {blocoConteudoVisto && quizAtivo && renderQuiz()}

              {blocoConteudoVisto && !blocoAtual.quiz_id && (
                <Card className="rounded-3xl shadow-2xl border-0 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <p className="text-2xl font-black text-gray-800 mb-2">Bloco Completado!</p>
                    <p className="text-lg text-gray-600 font-medium">+{blocoAtual.pontos_bloco} pontos</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
