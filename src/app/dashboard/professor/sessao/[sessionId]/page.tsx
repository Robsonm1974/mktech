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
    name: string
    grade_level: string
  }
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
            aulas (
              titulo,
              descricao,
              duracao_minutos,
              pontos_totais
            ),
            turmas (
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

  const handleEncerrarSessao = async () => {
    if (!confirm('Deseja realmente encerrar esta sessão?')) return

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          data_fim: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Erro ao encerrar sessão:', error)
        alert('Erro ao encerrar sessão')
        return
      }

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
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Pausar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleEncerrarSessao}>
              <XCircle className="h-4 w-4 mr-2" />
              Encerrar Sessão
            </Button>
          </div>
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

          {/* Alunos Conectados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alunos na Sessão
              </CardTitle>
              <CardDescription>
                Aguardando alunos se conectarem...
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session.alunos_participantes === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum aluno conectado ainda</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Peça aos alunos para escanearem o QR Code
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {session.alunos_participantes} aluno(s) conectado(s)
                  </p>
                  {/* Aqui podemos adicionar lista de alunos no futuro */}
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


