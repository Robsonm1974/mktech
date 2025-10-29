'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Star, Sparkles, Award } from 'lucide-react'
import { useSound } from '@/hooks/useSound'

interface ConfettiCelebrationProps {
  // Estatísticas finais
  estatisticas: {
    totalBlocos: number
    totalPontos: number
    tempoTotal: number // em segundos
    acertosTotal: number
    errosTotal: number
    performance: number // percentual 0-100
  }
  
  // Conquistas desbloqueadas (opcional)
  badges?: Array<{
    id: string
    nome: string
    icone: string
  }>
  
  // Callbacks
  onFechar: () => void
  onCompartilhar?: () => void
  
  // Configurações
  duracao?: number // duração do confetti em ms (default: 3000)
  cores?: string[] // cores do confetti
}

export function ConfettiCelebration({
  estatisticas,
  badges = [],
  onFechar,
  onCompartilhar,
  duracao = 3000,
  cores = ['#667eea', '#764ba2', '#f093fb', '#4facfe']
}: ConfettiCelebrationProps) {
  const { playSound } = useSound()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isExiting, setIsExiting] = useState(false)
  const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null)

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return `${mins}min ${secs}s`
  }

  // Lançar confetti
  const launchConfetti = () => {
    if (!confettiInstanceRef.current) return

    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      colors: cores
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confettiInstanceRef.current!({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    // Explosão em múltiplas direções
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    })
    fire(0.2, {
      spread: 60,
    })
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    })
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }

  // Confetti contínuo
  const continuousConfetti = () => {
    if (!confettiInstanceRef.current) return

    const end = Date.now() + duracao

    const frame = () => {
      confettiInstanceRef.current!({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: cores
      })
      confettiInstanceRef.current!({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: cores
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }

  // Inicializar confetti
  useEffect(() => {
    if (canvasRef.current) {
      confettiInstanceRef.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true
      })

      // Som de celebração
      playSound('level-up')

      // Explosão inicial
      setTimeout(() => {
        launchConfetti()
      }, 300)

      // Confetti contínuo
      setTimeout(() => {
        continuousConfetti()
      }, 800)
    }

    return () => {
      if (confettiInstanceRef.current) {
        confettiInstanceRef.current.reset()
      }
    }
  }, [])

  const handleFechar = () => {
    setIsExiting(true)
    playSound('click')
    
    // Limpar confetti
    if (confettiInstanceRef.current) {
      confettiInstanceRef.current.reset()
    }
    
    setTimeout(() => {
      onFechar()
    }, 300)
  }

  // Mensagem baseada em performance
  const getMensagem = () => {
    if (estatisticas.performance >= 90) {
      return {
        titulo: '🏆 INCRÍVEL!',
        subtitulo: 'Você é um gênio!',
        emoji: '🌟'
      }
    } else if (estatisticas.performance >= 70) {
      return {
        titulo: '✨ EXCELENTE!',
        subtitulo: 'Parabéns pelo esforço!',
        emoji: '🎉'
      }
    } else if (estatisticas.performance >= 50) {
      return {
        titulo: '💪 MUITO BEM!',
        subtitulo: 'Continue assim!',
        emoji: '🚀'
      }
    } else {
      return {
        titulo: '👏 COMPLETOU!',
        subtitulo: 'Cada passo conta!',
        emoji: '🎯'
      }
    }
  }

  const mensagem = getMensagem()

  return (
    <AnimatePresence>
      {!isExiting && (
        <>
          {/* Canvas para confetti */}
          <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-none z-[60]"
          />

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="w-full max-w-2xl"
            >
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-purple-50 to-blue-50 overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  {/* Header Animado */}
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.3, duration: 0.8 }}
                      className="inline-block"
                    >
                      <Trophy className="w-24 h-24 text-yellow-500 drop-shadow-lg" />
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
                    >
                      {mensagem.titulo}
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-xl text-gray-700 font-bold"
                    >
                      {mensagem.subtitulo}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, type: 'spring' }}
                      className="text-6xl"
                    >
                      {mensagem.emoji}
                    </motion.div>
                  </div>

                  {/* Estatísticas em Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {/* Blocos */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-200 text-center">
                      <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-3xl font-black text-purple-600">
                        {estatisticas.totalBlocos}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">Blocos</p>
                    </div>

                    {/* Pontos */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-yellow-200 text-center">
                      <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-3xl font-black text-yellow-600">
                        {estatisticas.totalPontos}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">Pontos</p>
                    </div>

                    {/* Tempo */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-blue-200 text-center">
                      <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-black text-blue-600">
                        {formatTime(estatisticas.tempoTotal)}
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">Tempo</p>
                    </div>

                    {/* Performance */}
                    <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-200 text-center">
                      <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-3xl font-black text-green-600">
                        {estatisticas.performance.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-600 font-semibold">Acertos</p>
                    </div>
                  </motion.div>

                  {/* Badges Desbloqueados */}
                  {badges.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200"
                    >
                      <h3 className="text-lg font-black text-gray-800 mb-3 flex items-center gap-2">
                        <Award className="w-6 h-6 text-yellow-600" />
                        Conquistas Desbloqueadas!
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {badges.map((badge, idx) => (
                          <motion.div
                            key={badge.id}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 1 + idx * 0.1, type: 'spring' }}
                            className="bg-white rounded-xl px-4 py-2 shadow-md border-2 border-yellow-300 flex items-center gap-2"
                          >
                            <span className="text-2xl">{badge.icone}</span>
                            <span className="font-bold text-sm text-gray-800">
                              {badge.nome}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Botões */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex gap-3"
                  >
                    {onCompartilhar && (
                      <Button
                        onClick={onCompartilhar}
                        variant="outline"
                        size="lg"
                        className="flex-1 font-bold border-2"
                      >
                        📤 Compartilhar
                      </Button>
                    )}
                    <Button
                      onClick={handleFechar}
                      size="lg"
                      className="flex-1 font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      🎉 Fechar
                    </Button>
                  </motion.div>

                  {/* Mensagem Final */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="text-center text-sm text-gray-500 italic"
                  >
                    Continue aprendendo e conquistando novos desafios! 🚀
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

