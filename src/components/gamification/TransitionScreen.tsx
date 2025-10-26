'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Star, 
  TrendingUp,
  ArrowRight,
  Trophy,
  Target
} from 'lucide-react'
import { useSound } from '@/hooks/useSound'

interface TransitionScreenProps {
  // Estatísticas do bloco anterior
  blocoAnterior: {
    titulo: string
    tempoGasto: number // em segundos
    acertos: number
    erros: number
    pontosGanhos: number
    totalPerguntas: number
  }
  
  // Próximo bloco (opcional)
  proximoBloco?: {
    titulo: string
    tipo: string // 'video', 'quiz', etc
  } | null
  
  // Progresso geral
  progressoGeral: {
    blocoAtual: number
    totalBlocos: number
    pontosAcumulados: number
  }
  
  // Callback ao clicar em continuar
  onContinuar: () => void
  
  // Configurações
  autoAdvance?: boolean // Auto-avançar após countdown
  countdownSeconds?: number // Tempo do countdown (default: 5)
  showConfetti?: boolean // Mostrar confetti se foi muito bem
}

export function TransitionScreen({
  blocoAnterior,
  proximoBloco,
  progressoGeral,
  onContinuar,
  autoAdvance = true,
  countdownSeconds = 5,
  showConfetti = true
}: TransitionScreenProps) {
  const { playSound } = useSound()
  const [countdown, setCountdown] = useState(countdownSeconds)
  const [isExiting, setIsExiting] = useState(false)

  // Calcular performance
  const performance = blocoAnterior.totalPerguntas > 0
    ? (blocoAnterior.acertos / blocoAnterior.totalPerguntas) * 100
    : 100

  const isExcelente = performance === 100
  const isBom = performance >= 70
  const isRegular = performance >= 50

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return `${mins}min ${secs}s`
  }

  // Countdown automático
  useEffect(() => {
    if (!autoAdvance) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleContinuar()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoAdvance])

  // Som inicial baseado em performance
  useEffect(() => {
    if (isExcelente) {
      playSound('perfect')
    } else if (isBom) {
      playSound('correct')
    } else {
      playSound('complete')
    }
  }, [])

  const handleContinuar = () => {
    setIsExiting(true)
    playSound('click')
    setTimeout(() => {
      onContinuar()
    }, 300)
  }

  // Progresso percentual
  const progressoPercentual = (progressoGeral.blocoAtual / progressoGeral.totalBlocos) * 100

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-purple-50">
              <CardContent className="p-8 space-y-6">
                {/* Header com emoji baseado em performance */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-block mb-4"
                  >
                    {isExcelente ? (
                      <Trophy className="w-20 h-20 text-yellow-500" />
                    ) : isBom ? (
                      <Star className="w-20 h-20 text-blue-500" />
                    ) : (
                      <Target className="w-20 h-20 text-purple-500" />
                    )}
                  </motion.div>

                  <h2 className="text-3xl font-black text-gray-800 mb-2">
                    {isExcelente ? '🎉 Perfeito!' : isBom ? '✨ Muito Bem!' : '💪 Continue Assim!'}
                  </h2>
                  <p className="text-lg text-gray-600 font-medium">
                    {blocoAnterior.titulo}
                  </p>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Tempo */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 font-semibold">Tempo</p>
                        <p className="text-2xl font-black text-blue-800">
                          {formatTime(blocoAnterior.tempoGasto)}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Acertos */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-green-50 rounded-2xl p-4 border-2 border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600 font-semibold">Acertos</p>
                        <p className="text-2xl font-black text-green-800">
                          {blocoAnterior.acertos}/{blocoAnterior.totalPerguntas}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Erros */}
                  {blocoAnterior.erros > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-red-50 rounded-2xl p-4 border-2 border-red-200"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-600" />
                        <div>
                          <p className="text-sm text-red-600 font-semibold">Erros</p>
                          <p className="text-2xl font-black text-red-800">
                            {blocoAnterior.erros}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Pontos */}
                  <motion.div
                    initial={{ opacity: 0, x: blocoAnterior.erros > 0 ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200"
                  >
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-600" />
                      <div>
                        <p className="text-sm text-yellow-600 font-semibold">Pontos</p>
                        <p className="text-2xl font-black text-yellow-800">
                          +{blocoAnterior.pontosGanhos}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Progresso Geral */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-gray-800">Progresso da Sessão</span>
                    </div>
                    <span className="font-black text-purple-600 text-lg">
                      {progressoGeral.blocoAtual}/{progressoGeral.totalBlocos}
                    </span>
                  </div>
                  <Progress value={progressoPercentual} className="h-3" />
                  <p className="text-sm text-gray-600 text-center">
                    <span className="font-bold text-purple-600">
                      {progressoGeral.pontosAcumulados} pontos
                    </span>
                    {' '}acumulados até agora
                  </p>
                </motion.div>

                {/* Próximo Bloco */}
                {proximoBloco && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border-2 border-purple-200"
                  >
                    <p className="text-sm text-purple-600 font-semibold mb-1">
                      📚 Próximo Bloco:
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      {proximoBloco.titulo}
                    </p>
                  </motion.div>
                )}

                {/* Botão Continuar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button
                    onClick={handleContinuar}
                    size="lg"
                    className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                  >
                    Continuar
                    {autoAdvance && countdown > 0 && ` (${countdown}s)`}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>

                {/* Mensagem motivacional */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-sm text-gray-500 italic"
                >
                  {isExcelente
                    ? '🌟 Você é incrível! Continue assim!'
                    : isBom
                    ? '💪 Excelente trabalho! Você está indo muito bem!'
                    : '🚀 Não desista! Cada erro é um aprendizado!'}
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

