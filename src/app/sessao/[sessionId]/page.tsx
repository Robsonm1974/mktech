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
import { QuizAnimado, FloatingPoints, TransitionScreen, ConfettiCelebration } from '@/components/gamification'
import { useSound } from '@/hooks/useSound'
import AdventureRunnerPlayer from '@/components/games/AdventureRunnerPlayer'

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
  tipo: 'bloco' // Para identificar que é um bloco
}

// 🎮 Interface para Jogos
interface GameItem {
  tipo: 'jogo'
  id: string
  ordem: number
  titulo: string
  descricao: string | null
  duracao_segundos: number
  codigo: string
  configuracao: Record<string, unknown>
}

// Tipo unificado para Blocos + Jogos
type ItemAula = BlocoWithOrder | GameItem

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
  const [itensAula, setItensAula] = useState<ItemAula[]>([]) // 🎮 TODOS os itens (blocos + jogos)
  const [participacao, setParticipacao] = useState<Participacao | null>(null)
  
  // Estado do item atual (bloco ou jogo)
  const [itemAtual, setItemAtual] = useState<ItemAula | undefined>(undefined)
  const [blocoAtual, setBlocoAtual] = useState<BlocoWithOrder | null>(null)
  const [blocoAtivo, setBlocoAtivo] = useState(false)
  const [blocoConteudoVisto, setBlocoConteudoVisto] = useState(false)
  
  // Estado do quiz
  const [quizAtivo, setQuizAtivo] = useState(false)
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<number[]>([])
  const [tentativas, setTentativas] = useState<number[]>([])
  const [quizzesCompletados, setQuizzesCompletados] = useState<Set<string>>(new Set())
  
  // Gamificação
  const [floatingPoints, setFloatingPoints] = useState<{
    show: boolean
    points: number
    position: { x: number; y: number }
  }>({
    show: false,
    points: 0,
    position: { x: 0, y: 0 }
  })
  
  // Transições
  const [mostrarTransicao, setMostrarTransicao] = useState(false)
  const [dadosTransicao, setDadosTransicao] = useState<{
    blocoAnterior: {
      titulo: string
      tempoGasto: number
      acertos: number
      erros: number
      pontosGanhos: number
      totalPerguntas: number
    }
    proximoBloco: { titulo: string; tipo: string } | null
  } | null>(null)
  
  // Celebração final
  const [mostrarCelebracao, setMostrarCelebracao] = useState(false)
  const [tempoInicioBloco, setTempoInicioBloco] = useState<number>(0)

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

  // 🎮 Sincronizar itemAtual com blocoAtual
  useEffect(() => {
    if (blocoAtual && itensAula.length > 0) {
      const itemCorrespondente = itensAula.find(item =>
        item.tipo === 'bloco' && item.id === blocoAtual.id
      )
      if (itemCorrespondente) {
        setItemAtual(itemCorrespondente)
        console.log('✅ Item atual sincronizado com bloco:', itemCorrespondente.titulo)
      }
    }
  }, [blocoAtual, itensAula])

  // 🎮 Função para encontrar o próximo item na sequência
  const findProximoItem = (itemAtual: ItemAula | null | undefined): ItemAula | null => {
    if (!itemAtual || itensAula.length === 0) return null

    const currentIndex = itensAula.findIndex(item => item.id === itemAtual.id && item.tipo === itemAtual.tipo)
    if (currentIndex === -1 || currentIndex >= itensAula.length - 1) return null

    const proximoItem = itensAula[currentIndex + 1]
    return proximoItem || null
  }

  const initializeSession = async () => {
    try {
      // 1. Carregar dados do aluno do sessionStorage (namespaced por sessão)
      const storageKey = `studentSession:${sessionId}`
      const studentData = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null
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

      console.log('🔵 Iniciando registro de entrada na sessão...')
      console.log('   Session ID:', sessionId)
      console.log('   Aluno ID:', student.alunoId)

      // 2. Registrar entrada do aluno na sessão
      const { data: entradaData, error: entradaError } = await supabase.rpc('aluno_entrar_sessao', {
        p_session_id: sessionId,
        p_aluno_id: student.alunoId
      })

      console.log('📊 Resultado entrada:', entradaData)
      console.log('❌ Erro entrada:', entradaError)

      if (entradaError) {
        console.error('❌ ERRO RPC:', entradaError)
        throw new Error(`Erro RPC: ${entradaError.message}`)
      }

      if (!entradaData || !entradaData.success) {
        console.error('❌ RPC retornou success=false')
        const errorMsg = entradaData?.message || 'Erro desconhecido ao entrar na sessão'
        throw new Error(errorMsg)
      }

      console.log('✅ Entrada registrada com sucesso!')
      console.log('   Participação ID:', entradaData.participacao_id)

      setParticipacaoId(entradaData.participacao_id)

      // 3. Carregar dados da sessão
      await loadSessionData(student.alunoId)

    } catch (error) {
      console.error('❌ ERRO AO INICIALIZAR:', error)
      toast({
        title: 'Erro ao entrar na sessão',
        description: error instanceof Error ? error.message : 'Erro ao carregar sessão',
        variant: 'destructive'
      })
      // Retornar para página de entrada após 3 segundos
      setTimeout(() => {
        router.push('/entrar')
      }, 3000)
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

      // 🎮 NOVO: Buscar blocos + jogos da aula usando RPC
      console.log('🔍 Buscando itens (blocos + jogos) para session_id:', sessionId)
      
      const { data: itensResponse, error: itensError } = await supabase.rpc(
        'get_itens_aula_sessao',
        { p_session_id: sessionId }
      )

      console.log('📦 Resultado itensResponse:', itensResponse)
      console.log('❌ Erro itensError:', itensError)

      if (itensError || !itensResponse?.success) {
        console.error('❌ ERRO:', itensError || itensResponse?.error)
        throw new Error('Erro ao carregar itens: ' + (itensError?.message || itensResponse?.error || 'Erro desconhecido'))
      }

      // 🎮 NOVO: Processar TODOS os itens (blocos + jogos)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const todosItens = itensResponse.itens || []
      console.log('📦 Total de itens retornados:', todosItens.length)
      console.log('📄 Blocos:', todosItens.filter((i: { tipo: string }) => i.tipo === 'bloco').length)
      console.log('🎮 Jogos:', todosItens.filter((i: { tipo: string }) => i.tipo === 'jogo').length)
      
      // Processar blocos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocosTransformados: BlocoWithOrder[] = todosItens
        .filter((item: { tipo: string }) => item.tipo === 'bloco')
        .map((bloco: {
          id: string; titulo: string; conteudo_texto: string; tipo_midia: string;
          midia_url: string; midia_metadata: Record<string, unknown>; pontos_bloco: number; quiz_id: string;
          quiz: Quiz | null; ordem_na_aula: number
        }) => ({
          id: bloco.id,
          titulo: bloco.titulo,
          conteudo_texto: bloco.conteudo_texto,
          tipo_midia: bloco.tipo_midia,
          midia_url: bloco.midia_url,
          midia_metadata: bloco.midia_metadata,
          pontos_bloco: bloco.pontos_bloco,
          quiz_id: bloco.quiz_id,
          quizzes: bloco.quiz,
          ordem: bloco.ordem_na_aula,
          tipo: 'bloco' as const
        }))

      // 🎮 Processar jogos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jogosTransformados: GameItem[] = todosItens
        .filter((item: { tipo: string }) => item.tipo === 'jogo')
        .map((jogo: {
          id: string; titulo: string; descricao: string; duracao_segundos: number;
          codigo: string; configuracao: Record<string, unknown>; ordem_na_aula: number
        }) => ({
          tipo: 'jogo' as const,
          id: jogo.id,
          ordem: jogo.ordem_na_aula,
          titulo: jogo.titulo,
          descricao: jogo.descricao,
          duracao_segundos: jogo.duracao_segundos,
          codigo: jogo.codigo,
          configuracao: jogo.configuracao
        }))

      // 🎯 Combinar blocos + jogos em ordem
      const todosItensOrdenados: ItemAula[] = [...blocosTransformados, ...jogosTransformados]
        .sort((a, b) => a.ordem - b.ordem)

      console.log('📦 Blocos transformados:', blocosTransformados)
      console.log('🎮 Jogos transformados:', jogosTransformados)
      console.log('📊 Itens totais ordenados:', todosItensOrdenados.length)

      setBlocos(blocosTransformados)
      setItensAula(todosItensOrdenados) // 🎯 Salvar TODOS os itens

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
        toast({
          title: 'Erro ao carregar progresso',
          description: 'Não foi possível carregar o progresso do aluno. Verifique se a sessão foi iniciada corretamente.',
          variant: 'destructive'
        })
        return
      }

      if (!progressoData) {
        console.error('❌ progressoData está vazio/null')
        toast({
          title: 'Erro',
          description: 'Nenhum dado de progresso retornado. Execute a migration SQL necessária.',
          variant: 'destructive'
        })
        return
      }

      if (progressoData) {
        console.log('✅ Participação:', progressoData.participacao)
        console.log('✅ Blocos progresso:', progressoData.blocos)
        
        if (!progressoData.participacao) {
          console.error('❌ progressoData.participacao está null')
          toast({
            title: 'Erro de Participação',
            description: 'Dados de participação não encontrados. Recomece o login.',
            variant: 'destructive'
          })
          setTimeout(() => {
            router.push('/entrar')
          }, 2000)
          return
        }
        
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
            setBlocoAtual(null)
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
              setBlocoAtual(blocosDisponiveis[0] || null)
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
          setBlocoAtual(blocosDisponiveis[0] || null)
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

  // 🎮 Função para completar jogo
  const handleCompletarJogo = async () => {
    if (!itemAtual || itemAtual.tipo !== 'jogo') return

    console.log('🎮 Completando jogo:', itemAtual?.titulo || 'Jogo sem título')

    // Para jogos, vamos usar uma lógica simplificada
    // por enquanto, apenas avançar para o próximo item
    const proximoItem = findProximoItem(itemAtual)

    if (proximoItem) {
      setItemAtual(proximoItem)

      if (proximoItem.tipo === 'bloco') {
        const proximoBloco = blocos.find(b => b.id === proximoItem.id)
        if (proximoBloco) {
          setBlocoAtual(proximoBloco)
        }
      }

      toast({
        title: "🎉 Jogo Concluído!",
        description: "Avançando para o próximo item...",
      })
    } else {
      // Sessão completa
      setMostrarCelebracao(true)
      toast({
        title: "🏆 Sessão Completa!",
        description: "Parabéns! Você completou todos os itens!",
      })
    }
  }

  // ============================================================================
  // CONTROLE DE BLOCOS
  // ============================================================================

  const handleIniciarBloco = () => {
    setBlocoAtivo(true)
    setTempoInicioBloco(Date.now()) // Iniciar contador de tempo
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

      // Calcular tempo gasto
      const tempoGasto = tempoInicioBloco > 0 
        ? Math.floor((Date.now() - tempoInicioBloco) / 1000)
        : 0

      // Calcular acertos/erros do quiz
      let acertos = 0
      let erros = 0
      let totalPerguntas = 0

      if (blocoAtual.quizzes) {
        totalPerguntas = blocoAtual.quizzes.perguntas.length
        blocoAtual.quizzes.perguntas.forEach((_, idx) => {
          const tentativa = tentativas[idx]
          if (tentativa === -1) acertos++
          else if (tentativa && tentativa > 0) erros++
        })
      }

      // Recarregar progresso
      if (studentSession) {
        await loadProgresso(studentSession.alunoId, blocos)
      }

      // Se sessão completa - mostrar celebração
      if (data.sessao_completa) {
        playSound('levelup')

        // Calcular estatísticas finais
        const totalAcertos = participacao?.blocos_completados || 0
        const totalPontos = participacao?.pontos_ganhos_sessao || 0
        const performance = totalPerguntas > 0 ? (acertos / totalPerguntas) * 100 : 100

        setMostrarCelebracao(true)

        // Resetar estados
        setBlocoAtivo(false)
        setBlocoConteudoVisto(false)
        setQuizAtivo(false)
        setRespostasSelecionadas([])
        setTentativas([])
        return
      }

      // 🎮 NOVO: Verificar se o item atual é um jogo e processar adequadamente
      if (itemAtual?.tipo === 'jogo') {
        console.log('🎮 Jogo completado, avançando para próximo item...')

        // Mostrar pontos do jogo (se disponível)
        toast({
          title: "🎉 Jogo Concluído!",
          description: `+${blocoAtual.pontos_bloco} pontos`,
        })

        // Encontrar próximo item
        const proximoItem = findProximoItem(itemAtual)

        if (proximoItem) {
          console.log('🎯 Próximo item encontrado:', proximoItem.titulo)

          // Preparar dados da transição
          setDadosTransicao({
            blocoAnterior: {
              titulo: itemAtual.titulo,
              tempoGasto,
              acertos,
              erros,
              pontosGanhos: blocoAtual.pontos_bloco,
              totalPerguntas
            },
            proximoBloco: {
              titulo: proximoItem.titulo,
              tipo: proximoItem.tipo === 'jogo' ? 'jogo' : (proximoItem as BlocoWithOrder).tipo_midia || 'conteudo'
            }
          })

          // Mostrar tela de transição
          setMostrarTransicao(true)
          return
        } else {
          // Sessão completa
          setMostrarCelebracao(true)
          return
        }
      }

      // Encontrar próximo bloco (lógica original para blocos)
      const blocoAtualIndex = blocos.findIndex(b => b.id === blocoAtual.id)
      const proximoBloco = blocoAtualIndex < blocos.length - 1
        ? blocos[blocoAtualIndex + 1]
        : null

      // Preparar dados da transição
      setDadosTransicao({
        blocoAnterior: {
          titulo: blocoAtual.titulo,
          tempoGasto,
          acertos,
          erros,
          pontosGanhos: blocoAtual.pontos_bloco,
          totalPerguntas
        },
        proximoBloco: proximoBloco ? {
          titulo: proximoBloco.titulo,
          tipo: proximoBloco.tipo_midia || 'conteudo'
        } : null
      })

      // Mostrar tela de transição
      setMostrarTransicao(true)

    } catch (error) {
      console.error('Erro ao completar bloco:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao completar bloco',
        variant: 'destructive'
      })
    }
  }

  // Callback ao fechar transição
  const handleContinuarAposTransicao = () => {
    setMostrarTransicao(false)
    setDadosTransicao(null)

    // 🎮 NOVO: Navegar para o próximo item se disponível
    if (itemAtual) {
      const proximoItem = findProximoItem(itemAtual)

      if (proximoItem) {
        console.log('🎯 Navegando para próximo item:', proximoItem)
        setItemAtual(proximoItem)

        // Se for um jogo, apenas definir como atual
        if (proximoItem.tipo === 'jogo') {
          console.log('🎮 Próximo item é um jogo')
          // Para jogos, não precisamos do fluxo de "iniciar" como nos blocos
          return
        }

        // Se for um bloco, encontrar o correspondente e definir
        if (proximoItem.tipo === 'bloco') {
          const proximoBloco = blocos.find(b => b.id === proximoItem.id)
          if (proximoBloco) {
            setBlocoAtual(proximoBloco)
            console.log('📦 Próximo bloco definido:', proximoBloco.titulo)
          }
        }
      } else {
        console.log('🏁 Fim da sessão - nenhum item seguinte')
        // Se não há próximo item, verificar se a sessão está completa
        if (participacao &&
            (participacao.status === 'completed' ||
             participacao.blocos_completados === participacao.total_blocos)) {
          setMostrarCelebracao(true)
        }
      }
    }

    // Resetar estados
    setBlocoAtivo(false)
    setBlocoConteudoVisto(false)
    setQuizAtivo(false)
    setRespostasSelecionadas([])
    setTentativas([])
    setTempoInicioBloco(0)
  }

  // Callback ao fechar celebração
  const handleFecharCelebracao = () => {
    setMostrarCelebracao(false)
    
    // Resetar estados
    setBlocoAtivo(false)
    setBlocoConteudoVisto(false)
    setQuizAtivo(false)
    setRespostasSelecionadas([])
    setTentativas([])
    
    toast({
      title: '🎉 Sessão Completa!',
      description: 'Parabéns! Você completou todos os blocos!',
      variant: 'default'
    })
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

      case 'html5':
        return (
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
            <iframe
              src={blocoAtual.midia_url}
              className="w-full h-full"
              title="HTML5 Game"
              allow="fullscreen; gamepad; autoplay"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              onLoad={() => {
                // Quando o jogo carrega, aguardar um tempo e então permitir completar
                setTimeout(() => {
                  handleConteudoVistoCompleto()
                }, 2000) // 2 segundos para o jogo carregar
              }}
            />
          </div>
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

  // Handler para resposta do QuizAnimado
  const handleRespostaQuizAnimado = async (params: {
    perguntaIndex: number
    respostaSelecionada: number
    correto: boolean
    pontosGanhos: number
    tentativaAtual: number
  }) => {
    const { correto, pontosGanhos, perguntaIndex, respostaSelecionada, tentativaAtual } = params

    console.log('📝 Resposta registrada:', params)

    // Mostrar pontos flutuantes se acertou
    if (correto) {
      playSound('correct')
      setFloatingPoints({
        show: true,
        points: pontosGanhos,
        position: { 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 3 
        }
      })
    } else {
      playSound('incorrect')
    }

    // Registrar no banco
    try {
      const { error } = await supabase.rpc('registrar_resposta_quiz', {
        p_quiz_id: blocoAtual?.quizzes?.id,
        p_aluno_id: studentSession?.alunoId,
        p_session_id: sessionId,
        p_participacao_id: participacaoId,
        p_pergunta_index: perguntaIndex,
        p_resposta_escolhida: respostaSelecionada,
        p_correto: correto,
        p_pontos_ganhos: pontosGanhos,
        p_tentativa_numero: tentativaAtual
      })

      if (error) {
        console.error('❌ Erro ao registrar resposta:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar sua resposta',
          variant: 'destructive'
        })
      } else {
        console.log('✅ Resposta salva com sucesso!')
      }
    } catch (err) {
      console.error('💥 Exceção ao registrar resposta:', err)
    }
  }

  const renderQuiz = () => {
    if (!blocoAtual?.quizzes) return null

    const quiz = blocoAtual.quizzes

    return (
      <div className="space-y-6">
        <QuizAnimado
          quiz={{
            id: quiz.id,
            titulo: quiz.titulo,
            tipo: quiz.tipo,
            perguntas: quiz.perguntas
          }}
          tentativasPermitidas={2}
          tempoLimiteSeg={300}
          onResposta={handleRespostaQuizAnimado}
          onQuizCompleto={() => {
            console.log('🎉 Quiz completo!')
            playSound('complete')
            setQuizzesCompletados(prev => new Set(prev).add(quiz.id))
            
            // Aguardar 1.5s e completar bloco
            setTimeout(() => {
              handleCompletarBloco()
            }, 1500)
          }}
        />
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

  // Verificar se ainda não carregou a participação
  if (!participacao && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center p-4">
        <Card className="max-w-md w-full rounded-3xl shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <CardTitle className="text-2xl font-black">Erro ao Carregar</CardTitle>
            <CardDescription className="text-base mt-2">
              Não foi possível carregar os dados da participação.
              <br />
              <br />
              Isso pode ocorrer se você não entrou corretamente na sessão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/entrar')}
              className="w-full py-6 rounded-2xl text-lg font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2]"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tela de conclusão da sessão
  if (participacao && (participacao.status === 'completed' || participacao.blocos_completados === participacao.total_blocos)) {
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
                    window.location.href = '/meu-perfil'
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

          {/* 🎮 Renderizar Jogo se item atual for jogo */}
          {itemAtual && itemAtual.tipo === 'jogo' && (
            <Card className="rounded-3xl shadow-2xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-black text-gray-800">
                  🎮 {itemAtual.titulo}
                </CardTitle>
                <CardDescription className="text-base">
                  Duração: {Math.floor(itemAtual.duracao_segundos / 60)} minutos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdventureRunnerPlayer
                  questions={[]} // TODO: Carregar perguntas do jogo
                  duration={itemAtual.duracao_segundos}
                  onComplete={(score: number, coinsCollected: number) => {
                    console.log('🎮 Jogo completado!', { score, coinsCollected })
                    toast({
                      title: "🎉 Jogo Concluído!",
                      description: `Parabéns! Você coletou ${coinsCollected} moedas!`,
                    })
                    // 🎮 Usar a função específica para completar jogo
                    handleCompletarJogo()
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* Conteúdo do Bloco */}
          {itemAtual && itemAtual.tipo === 'bloco' && (
            !blocoAtivo ? (
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
            )
          )}
        </div>
      </div>

      {/* Ações de sessão */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const key = `studentSession:${sessionId}`
            if (typeof window !== 'undefined') sessionStorage.removeItem(key)
            router.replace(`/entrar?sessionId=${sessionId}&v=${Date.now()}`)
          }}
        >Trocar aluno</Button>
      </div>

      {/* FloatingPoints - Animação de pontos */}
      {floatingPoints.show && (
        <FloatingPoints
          points={floatingPoints.points}
          position={floatingPoints.position}
          onComplete={() => setFloatingPoints(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* TransitionScreen - Tela de transição entre blocos */}
      {mostrarTransicao && dadosTransicao && participacao && (
        <TransitionScreen
          blocoAnterior={dadosTransicao.blocoAnterior}
          proximoBloco={dadosTransicao.proximoBloco}
          progressoGeral={{
            blocoAtual: participacao.blocos_completados,
            totalBlocos: participacao.total_blocos,
            pontosAcumulados: participacao.pontos_ganhos_sessao
          }}
          onContinuar={handleContinuarAposTransicao}
          autoAdvance={true}
          countdownSeconds={5}
        />
      )}

      {/* ConfettiCelebration - Celebração ao completar sessão */}
      {mostrarCelebracao && participacao && (
        <ConfettiCelebration
          estatisticas={{
            totalBlocos: participacao.total_blocos,
            totalPontos: participacao.pontos_ganhos_sessao,
            tempoTotal: 0, // TODO: calcular tempo total da sessão
            acertosTotal: participacao.blocos_completados,
            errosTotal: 0,
            performance: (participacao.blocos_completados / participacao.total_blocos) * 100
          }}
          onFechar={handleFecharCelebracao}
          duracao={4000}
        />
      )}

      {/* Audio ref para sons */}
      <audio ref={audioRef} />
    </>
  )
}
