'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Users, Play, CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode'

interface Session {
  id: string
  session_code: string
  turma_id: string
  session_qr_data: {
    sessionId: string
    aulaId: string
    turmaId: string
    code: string
  }
  bloco_ativo_numero: number
  status: string
  data_inicio: string
  alunos_participantes: number
  aulas: {
    titulo: string
    descricao: string
    duracao_minutos: number
    pontos_totais: number
  }
  turmas: {
    id: string
    name: string
    grade_level: string
  }
}

interface AlunoSessao {
  aluno_id: string
  aluno_nome: string
  bloco_atual: number
  blocos_completados: number
  total_blocos: number
  pontos_ganhos: number
  status: string
  ultima_atividade: string
}

export default function SessionDashboardPage() {
  const { user, loading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<Session | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loadingSession, setLoadingSession] = useState(true)
  const [alunosConectados, setAlunosConectados] = useState<number>(0)
  const [alunosSessao, setAlunosSessao] = useState<AlunoSessao[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(false)
  const [alunosTurma, setAlunosTurma] = useState<Array<{ id: string; full_name: string; pin_code: string; icone_afinidade: string }>>([])
  const [loadingAlunosTurma, setLoadingAlunosTurma] = useState(false)

  // Carregar dados da sessão
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return

      try {
        const { data, error } = await supabase
          .from('sessions')
          .select(`
            id,
            session_code,
            session_qr_data,
            bloco_ativo_numero,
            status,
            data_inicio,
            alunos_participantes,
            turma_id,
            aulas (
              titulo,
              descricao,
              duracao_minutos,
              pontos_totais
            ),
            turmas (
              id,
              name,
              grade_level
            )
          `)
          .eq('id', sessionId)
          .single()

        if (error) {
          console.error('Erro ao carregar sessão:', error)
          return
        }

        setSession(data as unknown as Session)

        // Gerar QR Code
        const joinUrl = `${window.location.origin}/entrar?code=${data.session_code}`
        const qrUrl = await QRCode.toDataURL(joinUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        setQrCodeUrl(qrUrl)

      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingSession(false)
      }
    }

    loadSession()
  }, [sessionId, supabase])

  // Real-time: monitorar alunos conectados
  useEffect(() => {
    if (!sessionId) return

    console.log('👀 Monitorando alunos conectados para sessão:', sessionId)

    // Buscar contagem inicial de alunos
    const fetchInitialCount = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('alunos_participantes')
        .eq('id', sessionId)
        .single()

      if (data?.alunos_participantes) {
        const count = Array.isArray(data.alunos_participantes) 
          ? data.alunos_participantes.length 
          : 0
        setAlunosConectados(count)
        console.log('👥 Alunos conectados (inicial):', count)
      }
    }

    fetchInitialCount()

    // Subscribe para mudanças em tempo real
    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          console.log('🔔 Sessão atualizada:', payload.new)
          const newData = payload.new as Record<string, unknown>
          
          // Atualizar sessão completa
          setSession(newData as unknown as Session)
          
          // Atualizar contador de alunos
          if (Array.isArray(newData.alunos_participantes)) {
            const count = newData.alunos_participantes.length
            setAlunosConectados(count)
            console.log('👥 Alunos conectados (atualizado):', count)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('🔌 Desconectando do canal real-time')
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase])

  // Carregar lista de alunos e progresso
  useEffect(() => {
    const loadAlunos = async () => {
      if (!sessionId) return

      setLoadingAlunos(true)
      try {
        const { data, error } = await supabase.rpc('get_alunos_sessao', {
          p_session_id: sessionId
        })

        if (error) {
          console.error('Erro ao carregar alunos:', error)
          return
        }

        setAlunosSessao(data || [])
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingAlunos(false)
      }
    }

    loadAlunos()
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadAlunos, 5000)
    
    return () => clearInterval(interval)
  }, [sessionId, supabase])

  // Carregar alunos da turma (lista completa com PINs)
  useEffect(() => {
    const loadAlunosTurma = async () => {
      if (!session?.turma_id) return

      setLoadingAlunosTurma(true)
      try {
        const { data, error } = await supabase
          .from('alunos')
          .select('id, full_name, pin_code, icone_afinidade')
          .eq('turma_id', session.turma_id)
          .eq('active', true)
          .order('full_name')

        if (error) {
          console.error('Erro ao carregar alunos da turma:', error)
          return
        }

        setAlunosTurma(data || [])
        console.log('✅ Alunos da turma carregados:', data?.length)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingAlunosTurma(false)
      }
    }

    if (session) {
      loadAlunosTurma()
    }
  }, [session, supabase])

  const handleEncerrarSessao = async () => {
    if (!confirm('Deseja realmente encerrar esta sessão?\n\nIsso encerrará a sessão para todos os alunos.')) return

    try {
      // Usar RPC dedicado
      const { data, error } = await supabase.rpc('encerrar_sessao', {
        p_session_id: sessionId
      })

      if (error) {
        console.error('Erro ao encerrar sessão:', error)
        alert('Erro ao encerrar sessão: ' + error.message)
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = data as any

      if (!result.success) {
        alert('Erro: ' + result.message)
        return
      }

      alert(`Sessão encerrada com sucesso!\n${result.total_participacoes} aluno(s) participaram.`)
      router.push('/dashboard/professor')
      
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao encerrar sessão')
    }
  }

  if (loading || loadingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sessão não encontrada</CardTitle>
            <CardDescription>
              A sessão solicitada não existe ou você não tem permissão para acessá-la.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/professor">Voltar ao Dashboard</Link>
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
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/professor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sessão Ativa
            </h1>
            <p className="text-gray-600 mt-2">
              {session.aulas.titulo} - {session.turmas.name}
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleEncerrarSessao}>
            <XCircle className="h-4 w-4 mr-2" />
            Encerrar Sessão
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: QR Code */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-center">Entrar na Aula</CardTitle>
              <CardDescription className="text-center">
                Escaneie o QR Code ou use o código
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-4 border-blue-600 mb-4">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code da Sessão" 
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 animate-pulse rounded"></div>
                )}
              </div>

              {/* Código */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">ou digite o código:</p>
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg py-4 px-6">
                  <p className="text-4xl font-bold text-blue-900 tracking-widest">
                    {session.session_code}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Acesse: mktech.app/entrar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Alunos da Turma */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Lista de Alunos</CardTitle>
              <CardDescription className="text-xs">
                Ajude os alunos com nome, ícone e PIN
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {loadingAlunosTurma ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : alunosTurma.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum aluno cadastrado</p>
              ) : (
                <div className="space-y-2">
                  {alunosTurma.map((aluno) => (
                    <div 
                      key={aluno.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                          {aluno.icone_afinidade === 'dog' && '🐶'}
                          {aluno.icone_afinidade === 'cat' && '🐱'}
                          {aluno.icone_afinidade === 'lion' && '🦁'}
                          {aluno.icone_afinidade === 'tiger' && '🐯'}
                          {aluno.icone_afinidade === 'bear' && '🐻'}
                          {aluno.icone_afinidade === 'panda' && '🐼'}
                          {aluno.icone_afinidade === 'koala' && '🐨'}
                          {aluno.icone_afinidade === 'fox' && '🦊'}
                          {aluno.icone_afinidade === 'rabbit' && '🐰'}
                          {aluno.icone_afinidade === 'frog' && '🐸'}
                          {aluno.icone_afinidade === 'monkey' && '🐵'}
                          {aluno.icone_afinidade === 'pig' && '🐷'}
                          {aluno.icone_afinidade === 'cow' && '🐮'}
                          {aluno.icone_afinidade === 'horse' && '🐴'}
                          {aluno.icone_afinidade === 'unicorn' && '🦄'}
                          {aluno.icone_afinidade === 'dragon' && '🐉'}
                          {aluno.icone_afinidade === 'dinosaur' && '🦕'}
                          {aluno.icone_afinidade === 'whale' && '🐋'}
                          {aluno.icone_afinidade === 'dolphin' && '🐬'}
                          {aluno.icone_afinidade === 'shark' && '🦈'}
                        </div>
                        <span className="text-sm font-medium">{aluno.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">PIN:</span>
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {aluno.pin_code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Status e Controles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Alunos Conectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {alunosConectados}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Bloco Ativo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {session.bloco_ativo_numero}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold text-green-600">Ativa</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações da Aula */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Aula:</span>
                <span className="font-semibold">{session.aulas.titulo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Turma:</span>
                <span className="font-semibold">{session.turmas.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duração:</span>
                <span className="font-semibold">{session.aulas.duracao_minutos} minutos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pontos Totais:</span>
                <span className="font-semibold">{session.aulas.pontos_totais} pontos</span>
              </div>
            </CardContent>
          </Card>

          {/* Alunos Conectados - Com Progresso Individual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alunos na Sessão ({alunosSessao.length})
              </CardTitle>
              <CardDescription>
                Progresso individual de cada aluno (atualiza a cada 5s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAlunos && alunosSessao.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Carregando alunos...</p>
                </div>
              ) : alunosSessao.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum aluno conectado ainda</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Peça aos alunos para escanearem o QR Code
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alunosSessao.map((aluno) => (
                    <div 
                      key={aluno.aluno_id}
                      className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${
                            aluno.status === 'active' ? 'bg-green-500' :
                            aluno.status === 'completed' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="font-semibold">{aluno.aluno_nome}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-bold text-yellow-600">{aluno.pontos_ganhos}</p>
                            <p className="text-xs text-gray-500">pontos</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-blue-600">
                              {aluno.bloco_atual}/{aluno.total_blocos}
                            </p>
                            <p className="text-xs text-gray-500">blocos</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            aluno.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ 
                            width: `${(aluno.blocos_completados / aluno.total_blocos) * 100}%` 
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {aluno.blocos_completados} de {aluno.total_blocos} completados
                        </span>
                        <span>
                          {aluno.status === 'completed' ? (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completo
                            </span>
                          ) : aluno.status === 'active' ? (
                            'Ativo agora'
                          ) : (
                            'Desconectado'
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controle de Blocos */}
          <Card>
            <CardHeader>
              <CardTitle>Controle da Aula</CardTitle>
              <CardDescription>
                Avance pelos blocos da aula
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div>
                    <p className="font-semibold text-blue-900">
                      Bloco {session.bloco_ativo_numero}
                    </p>
                    <p className="text-sm text-blue-700">
                      Em andamento
                    </p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>

                <Button className="w-full" size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  Próximo Bloco
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}




