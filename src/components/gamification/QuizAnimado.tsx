'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useSound } from '@/hooks/useSound'

// Interface baseada na estrutura real do banco de dados
interface QuizPergunta {
  id: string
  prompt: string // Texto da pergunta
  choices: string[] // Array de opções
  correctIndex: number // Índice da resposta correta
  pontos: number // Pontos desta pergunta
}

interface QuizAnimadoProps {
  quiz: {
    id: string
    titulo: string
    tipo: string // 'mcq', 'verdadeiro_falso', etc
    perguntas: QuizPergunta[]
  }
  tentativasPermitidas?: number // Do banco: tentativas_permitidas (padrão: 2)
  tempoLimiteSeg?: number // Do banco: tempo_limite_seg (padrão: 300)
  onResposta: (params: {
    perguntaIndex: number
    respostaSelecionada: number
    correto: boolean
    pontosGanhos: number
    tentativaAtual: number
  }) => Promise<void>
  onQuizCompleto?: () => void
  perguntaAtualInicial?: number
  tentativasAtuais?: number[] // Array com tentativas de cada pergunta
}

export function QuizAnimado({
  quiz,
  tentativasPermitidas = 2,
  tempoLimiteSeg = 300,
  onResposta,
  onQuizCompleto,
  perguntaAtualInicial = 0,
  tentativasAtuais = []
}: QuizAnimadoProps) {
  const { playSound } = useSound()
  
  const [perguntaAtual, setPerguntaAtual] = useState(perguntaAtualInicial)
  const [respostaSelecionada, setRespostaSelecionada] = useState<number | null>(null)
  const [tentativas, setTentativas] = useState<number[]>(tentativasAtuais)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    show: boolean
    tipo: 'correct' | 'incorrect'
    mensagem: string
  }>({ show: false, tipo: 'correct', mensagem: '' })
  const [tempoRestante, setTempoRestante] = useState(tempoLimiteSeg)
  const [quizIniciado, setQuizIniciado] = useState(false)

  const pergunta = quiz.perguntas[perguntaAtual]
  const totalPerguntas = quiz.perguntas.length
  const tentativaAtual = tentativas[perguntaAtual] || 0
  const tentativasRestantes = tentativasPermitidas - tentativaAtual

  // Timer
  useEffect(() => {
    if (!quizIniciado) return

    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTempoEsgotado()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizIniciado, perguntaAtual])

  // Iniciar quiz
  useEffect(() => {
    if (!quizIniciado) {
      setQuizIniciado(true)
    }
  }, [])

  const handleTempoEsgotado = async () => {
    playSound('countdown')
    setFeedback({
      show: true,
      tipo: 'incorrect',
      mensagem: '⏰ Tempo esgotado! Avançando...'
    })

    setTimeout(() => {
      proximaPergunta()
    }, 2000)
  }

  const handleSelecionarOpcao = (index: number) => {
    if (isSubmitting || feedback.show) return
    
    playSound('select')
    setRespostaSelecionada(index)
  }

  const handleResponder = async () => {
    if (respostaSelecionada === null || isSubmitting) return

    setIsSubmitting(true)
    playSound('click')

    const correto = respostaSelecionada === pergunta.correctIndex
    const novaTentativa = tentativaAtual + 1

    // Calcular pontos (baseado no sistema existente)
    let pontosGanhos = 0
    if (correto) {
      if (novaTentativa === 1) {
        pontosGanhos = pergunta.pontos // 100%
      } else if (novaTentativa === 2) {
        pontosGanhos = Math.floor(pergunta.pontos / 2) // 50%
      }
    }

    // Atualizar tentativas
    const novasTentativas = [...tentativas]
    novasTentativas[perguntaAtual] = correto ? -1 : novaTentativa
    setTentativas(novasTentativas)

    // Chamar callback
    try {
      await onResposta({
        perguntaIndex: perguntaAtual,
        respostaSelecionada,
        correto,
        pontosGanhos,
        tentativaAtual: novaTentativa
      })

      // Feedback
      if (correto) {
        playSound(novaTentativa === 1 ? 'perfect' : 'correct')
        setFeedback({
          show: true,
          tipo: 'correct',
          mensagem: `✅ Correto! +${pontosGanhos} pontos`
        })

        setTimeout(() => {
          proximaPergunta()
        }, 1500)
      } else {
        playSound('incorrect')
        
        if (novaTentativa >= tentativasPermitidas) {
          setFeedback({
            show: true,
            tipo: 'incorrect',
            mensagem: '❌ Incorreto. Sem mais tentativas.'
          })

          setTimeout(() => {
            proximaPergunta()
          }, 2000)
        } else {
          setFeedback({
            show: true,
            tipo: 'incorrect',
            mensagem: `❌ Incorreto. ${tentativasPermitidas - novaTentativa} tentativa(s) restante(s)`
          })

          setTimeout(() => {
            setFeedback({ show: false, tipo: 'correct', mensagem: '' })
            setRespostaSelecionada(null)
            setIsSubmitting(false)
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Erro ao registrar resposta:', error)
      setIsSubmitting(false)
    }
  }

  const proximaPergunta = () => {
    setFeedback({ show: false, tipo: 'correct', mensagem: '' })
    setRespostaSelecionada(null)
    setIsSubmitting(false)

    if (perguntaAtual < totalPerguntas - 1) {
      setPerguntaAtual(perguntaAtual + 1)
      setTempoRestante(tempoLimiteSeg) // Resetar timer
    } else {
      // Quiz completo
      if (onQuizCompleto) {
        onQuizCompleto()
      }
    }
  }

  // Cor do timer baseado no tempo
  const getTimerColor = () => {
    const percentual = (tempoRestante / tempoLimiteSeg) * 100
    if (percentual > 50) return 'text-green-500'
    if (percentual > 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Card className="shadow-2xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                Pergunta {perguntaAtual + 1} de {totalPerguntas}
              </span>
              {tentativaAtual > 0 && (
                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  {tentativasRestantes} tentativa(s)
                </span>
              )}
            </div>
            
            <div className={`flex items-center gap-2 font-bold text-lg ${getTimerColor()}`}>
              <Clock className="w-5 h-5" />
              {formatTime(tempoRestante)}
            </div>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={((perguntaAtual + 1) / totalPerguntas) * 100} 
            className="mb-6 h-2"
          />

          {/* Pergunta */}
          <AnimatePresence mode="wait">
            <motion.div
              key={perguntaAtual}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-8">
                {pergunta.prompt}
              </h3>

              {/* Opções */}
              <div className="space-y-3 mb-6">
                {pergunta.choices.map((opcao, index) => {
                  const isSelected = respostaSelecionada === index
                  const isCorrect = feedback.show && index === pergunta.correctIndex
                  const isWrong = feedback.show && isSelected && index !== pergunta.correctIndex

                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleSelecionarOpcao(index)}
                      disabled={isSubmitting || feedback.show}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        w-full p-4 rounded-xl text-left font-medium transition-all
                        border-2 flex items-center justify-between
                        ${isSelected && !feedback.show ? 'border-purple-500 bg-purple-50 shadow-md' : ''}
                        ${!isSelected && !feedback.show ? 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm' : ''}
                        ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                        ${isWrong ? 'border-red-500 bg-red-50' : ''}
                        ${(isSubmitting || feedback.show) ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold
                          ${isSelected && !feedback.show ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}
                          ${isCorrect ? 'bg-green-500 text-white' : ''}
                          ${isWrong ? 'bg-red-500 text-white' : ''}
                        `}>
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{opcao}</span>
                      </span>

                      {isCorrect && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                      {isWrong && <XCircle className="w-6 h-6 text-red-500" />}
                    </motion.button>
                  )
                })}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {feedback.show && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`
                      p-4 rounded-lg mb-4 flex items-center gap-3 font-semibold
                      ${feedback.tipo === 'correct' ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-red-100 text-red-800 border-2 border-red-300'}
                    `}
                  >
                    {feedback.tipo === 'correct' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                    <span>{feedback.mensagem}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botão Responder */}
              {!feedback.show && (
                <Button
                  onClick={handleResponder}
                  disabled={respostaSelecionada === null || isSubmitting}
                  className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                  size="lg"
                >
                  {isSubmitting ? 'Verificando...' : 'Responder'}
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

