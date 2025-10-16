'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2, Play, Trophy, Star, Clock } from 'lucide-react'

interface SessionData {
  id: string
  status: string
  bloco_ativo_numero: number
  aulas: {
    titulo: string
    descricao: string
    blocos: Array<{
      id: string
      numero_sequencia: number
      titulo: string
      tipo: string
      duracao_minutos: number
      pontos_por_bloco: number
      quizzes: Array<{
        id: string
        titulo: string
        tipo: string
        perguntas: Array<{ prompt: string; choices: string[]; correctIndex: number }>
      }>
    }>
  }
  turmas: {
    name: string
  }
  tenants: {
    name: string
  }
}

interface StudentData {
  alunoId: string
  sessionId: string
  tenantSlug: string
  authenticated: boolean
  timestamp: number
}

export default function SessaoPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentBlock, setCurrentBlock] = useState(0)
  const [blockStarted, setBlockStarted] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)
  
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadSessionData()
    loadStudentSession()
  }, [sessionId])

  const loadStudentSession = () => {
    const studentSession = localStorage.getItem('studentSession')
    if (studentSession) {
      setStudentData(JSON.parse(studentSession))
    } else {
      setError('Sessão do aluno não encontrada')
      setLoading(false)
    }
  }

  const loadSessionData = async () => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          bloco_ativo_numero,
          aulas!inner(
            titulo,
            descricao,
            blocos!inner(
              id,
              numero_sequencia,
              titulo,
              tipo,
              duracao_minutos,
              pontos_por_bloco,
              quizzes!inner(
                id,
                titulo,
                tipo,
                perguntas
              )
            )
          ),
          turmas!inner(name),
          tenants!inner(name)
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        throw new Error('Sessão não encontrada')
      }

      setSessionData(session as unknown as SessionData)
      setCurrentBlock(session.bloco_ativo_numero - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessão')
    } finally {
      setLoading(false)
    }
  }

  const startBlock = () => {
    setBlockStarted(true)
    // Aqui seria implementada a lógica para iniciar o bloco
    // Por exemplo, carregar vídeo, apresentação, etc.
  }

  const completeQuiz = async (points: number) => {
    try {
      // Salvar resposta do quiz
      await supabase
        .from('quiz_responses')
        .insert({
          session_id: sessionId,
          aluno_id: studentData?.alunoId,
          quiz_id: sessionData?.aulas.blocos[currentBlock]?.quizzes[0]?.id,
          pontos_ganhos: points,
          correta: points > 0,
          tentativa_numero: 1,
          criada_em: new Date().toISOString()
        })

      setTotalPoints(prev => prev + points)
      setQuizCompleted(true)

      // Verificar se é o último bloco
      if (currentBlock >= (sessionData?.aulas.blocos.length || 0) - 1) {
        // Aula completa
        await completeAula()
      }
    } catch (err) {
      console.error('Erro ao salvar quiz:', err)
    }
  }

  const completeAula = async () => {
    try {
      // Atualizar progresso do aluno
      await supabase
        .from('user_progress')
        .upsert({
          aluno_id: studentData?.alunoId,
          pontos_totais: totalPoints,
          aulas_completadas: 1, // Incrementar
          ultima_aula_id: 'temp-id',
          ultima_aula_data: new Date().toISOString(),
          atualizada_em: new Date().toISOString()
        })
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err)
    }
  }

  const nextBlock = () => {
    setCurrentBlock(prev => prev + 1)
    setBlockStarted(false)
    setQuizCompleted(false)
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

  if (!sessionData || !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Dados não encontrados</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sessão ou dados do aluno não encontrados.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/entrar'}>
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentBlockData = sessionData.aulas.blocos[currentBlock]
  const isLastBlock = currentBlock >= sessionData.aulas.blocos.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{sessionData.aulas.titulo}</h1>
              <p className="text-sm text-gray-600">
                {sessionData.tenants.name} - {sessionData.turmas.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg">
                {totalPoints} pts
              </Badge>
              <Badge variant="outline">
                Bloco {currentBlock + 1} de {sessionData.aulas.blocos.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!blockStarted ? (
          /* Tela de início do bloco */
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">
                {currentBlockData?.tipo === 'video' && '📹'}
                {currentBlockData?.tipo === 'apresentacao' && '📊'}
                {currentBlockData?.tipo === 'animacao_lottie' && '🎬'}
                {currentBlockData?.tipo === 'phaser_game' && '🎮'}
              </div>
              <CardTitle className="text-2xl">
                {currentBlockData?.titulo || `Bloco ${currentBlock + 1}`}
              </CardTitle>
              <CardDescription className="text-lg">
                Prepare-se para aprender!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">{currentBlockData?.duracao_minutos || 5} min</div>
                  <div className="text-sm text-gray-600">Duração</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <div className="font-medium">{currentBlockData?.pontos_por_bloco || 10} pts</div>
                  <div className="text-sm text-gray-600">Pontos</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-medium">Quiz</div>
                  <div className="text-sm text-gray-600">Ao final</div>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full"
                onClick={startBlock}
              >
                <Play className="mr-2 h-5 w-5" />
                Iniciar Bloco
              </Button>
            </CardContent>
          </Card>
        ) : !quizCompleted ? (
          /* Tela do bloco ativo */
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {currentBlockData?.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Aqui seria renderizado o conteúdo do bloco */}
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {currentBlockData?.tipo === 'video' && '📹'}
                      {currentBlockData?.tipo === 'apresentacao' && '📊'}
                      {currentBlockData?.tipo === 'animacao_lottie' && '🎬'}
                      {currentBlockData?.tipo === 'phaser_game' && '🎮'}
                    </div>
                    <p className="text-gray-600">
                      {currentBlockData?.tipo === 'video' && 'Vídeo em reprodução...'}
                      {currentBlockData?.tipo === 'apresentacao' && 'Apresentação interativa...'}
                      {currentBlockData?.tipo === 'animacao_lottie' && 'Animação Lottie...'}
                      {currentBlockData?.tipo === 'phaser_game' && 'Game Phaser...'}
                    </p>
                  </div>
                </div>

                {/* Simulação de quiz simples */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quiz</CardTitle>
                    <CardDescription>
                      Responda a pergunta para ganhar pontos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-lg">
                      Qual estrutura repete uma ação?
                    </div>
                    <div className="grid gap-2">
                      {['Se (if)', 'Loop', 'Função'].map((option, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start"
                          onClick={() => completeQuiz(index === 1 ? currentBlockData?.pontos_por_bloco || 10 : 0)}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Tela de conclusão do bloco */
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <CardTitle className="text-2xl">Bloco Concluído!</CardTitle>
              <CardDescription>
                Você ganhou pontos e está progredindo na aula
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  +{currentBlockData?.pontos_por_bloco || 10} pontos
                </div>
                <div className="text-lg text-gray-600">
                  Total: {totalPoints} pontos
                </div>
              </div>

              {isLastBlock ? (
                <div className="text-center space-y-4">
                  <div className="text-xl font-semibold">🎓 Aula Concluída!</div>
                  <p className="text-gray-600">
                    Parabéns! Você completou toda a aula e ganhou {totalPoints} pontos.
                  </p>
                  <div className="flex gap-4">
                    <Button asChild className="flex-1">
                      <a href="/meu-perfil">Ver Perfil</a>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <a href="/entrar">Nova Aula</a>
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={nextBlock}>
                  Próximo Bloco →
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
