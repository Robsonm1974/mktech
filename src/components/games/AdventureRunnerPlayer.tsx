'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import * as Phaser from 'phaser'
import PhaserGame from './PhaserGame'
import { AdventureRunnerScene } from '@/lib/games/scenes/AdventureRunnerScene'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Question {
  id: string
  pergunta: string
  opcoes: { id: string; texto: string; correta: boolean }[]
  explicacao: string
}

interface AdventureRunnerPlayerProps {
  questions: Question[]
  duration?: number
  onComplete: (score: number, coinsCollected: number) => void
}

/**
 * Player do jogo Adventure Runner com integração de perguntas
 */
export default function AdventureRunnerPlayer({
  questions,
  duration = 60,
  onComplete
}: AdventureRunnerPlayerProps) {
  const [showQuestion, setShowQuestion] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [finalCoins, setFinalCoins] = useState(0)
  
  const sceneRef = useRef<AdventureRunnerScene | null>(null)

  // 🎵 Tocar som (declarar ANTES dos callbacks que usam)
  const playSound = useCallback((soundPath: string, volume: number = 0.7) => {
    try {
      const audio = new Audio(soundPath)
      audio.volume = volume
      audio.play().catch(err => console.warn('Erro ao tocar som:', err))
    } catch (error) {
      console.warn('Erro ao carregar som:', error)
    }
  }, [])

  // Callback: quando o jogador pega um baú
  const handleQuestionTrigger = useCallback((questionIndex: number) => {
    console.log('🎯 Baú coletado! Pergunta:', questionIndex)
    const question = questions[questionIndex]
    if (question) {
      console.log('📝 Mostrando pergunta:', question.pergunta)
      setCurrentQuestion(question)
      setShowQuestion(true)
      setSelectedAnswer(null)
      setShowExplanation(false)
    }
  }, [questions])

  // Callback: quando o jogo termina
  const handleGameComplete = useCallback((score: number, coinsCollected: number) => {
    console.log('🏁 Jogo finalizado! Score:', score, 'Moedas:', coinsCollected)
    setFinalScore(score)
    setFinalCoins(coinsCollected)
    setGameFinished(true)
    
    // 🎵 Som de finalização/vitória
    playSound('/games/assets/sounds/correct.mp3', 0.8)

    // ✅ Avançar automaticamente para o próximo bloco (sem "jogar de novo")
    // dá um pequeno tempo para o usuário perceber a conclusão
    setTimeout(() => {
      onComplete(score, coinsCollected)
    }, 800)
  }, [playSound, onComplete])

  // Criar uma classe de cena customizada com os callbacks (memoizada)
  const SceneWithCallbacks = useMemo(() => {
    return class extends AdventureRunnerScene {
      constructor() {
        super()
      }
      
      init(data: Record<string, unknown>) {
        super.init({
          duration,
          onQuestionTrigger: handleQuestionTrigger,
          onGameComplete: handleGameComplete,
          ...data
        })
      }
    }
  }, [duration, handleQuestionTrigger, handleGameComplete])

  // Configuração do Phaser (memoizada para evitar recriação)
  const gameConfig: Phaser.Types.Core.GameConfig = useMemo(() => ({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 500 },
        debug: false
      }
    },
    scene: SceneWithCallbacks,
    backgroundColor: '#87CEEB'
  }), [SceneWithCallbacks])

  // Callback: quando o jogo Phaser está pronto
  const handleGameReady = useCallback((game: Phaser.Game) => {
    // Guardar referência da cena
    const scene = game.scene.scenes[0] as AdventureRunnerScene
    sceneRef.current = scene
  }, [])

  // Submeter resposta
  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentQuestion) return
    
    const correctOption = currentQuestion.opcoes.find(opt => opt.correta)
    const correct = selectedAnswer === correctOption?.id
    
    setIsCorrect(correct)
    setShowExplanation(true)
    
    // 🎵 Tocar som de correto ou errado
    if (correct) {
      playSound('/games/assets/sounds/correct.mp3', 0.7)
    } else {
      playSound('/games/assets/sounds/wrong.mp3', 0.6)
    }
  }

  // Continuar o jogo após a pergunta
  const handleContinueGame = () => {
    setShowQuestion(false)
    setCurrentQuestion(null)
    
    if (sceneRef.current) {
      sceneRef.current.resumeGame(isCorrect)
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Jogo Phaser */}
      <PhaserGame 
        gameConfig={gameConfig}
        onGameReady={handleGameReady}
      />

      {/* 🎮 Controles Touch (joystick simples) - exibidos em telas touch */}
      <div className="pointer-events-none absolute inset-0 z-[999] select-none md:hidden">
        <div className="absolute bottom-4 left-4 flex gap-4">
          {/* Botão ANDAR */}
          <button
            className="pointer-events-auto w-16 h-16 rounded-full bg-black/40 text-white text-2xl flex items-center justify-center active:bg-black/60"
            onTouchStart={() => sceneRef.current?.setMobileRun(true)}
            onTouchEnd={() => sceneRef.current?.setMobileRun(false)}
            onMouseDown={() => sceneRef.current?.setMobileRun(true)}
            onMouseUp={() => sceneRef.current?.setMobileRun(false)}
            aria-label="Andar"
          >➡️</button>
          {/* Botão PULAR */}
          <button
            className="pointer-events-auto w-16 h-16 rounded-full bg-black/40 text-white text-2xl flex items-center justify-center active:bg-black/60"
            onTouchStart={() => sceneRef.current?.jumpIfOnGround()}
            onMouseDown={() => sceneRef.current?.jumpIfOnGround()}
            aria-label="Pular"
          >🆙</button>
        </div>
      </div>
      
      {/* Modal de Pergunta - Overlay mais sutil */}
      {showQuestion && currentQuestion && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-blue-900/60 to-purple-900/60 backdrop-blur-sm flex items-center justify-center p-4" 
          style={{ zIndex: 9999 }}
        >
          <Card className="bg-white/95 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border-4 border-yellow-400">
            {/* Pergunta */}
            <div className="mb-6">
              <div className="text-sm text-purple-600 font-semibold mb-2">
                ❓ PERGUNTA DO BAÚ
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {currentQuestion.pergunta}
              </h3>
            </div>

            {/* Opções */}
            <div className="space-y-3 mb-6">
              {currentQuestion.opcoes.map((opcao) => {
                const isSelected = selectedAnswer === opcao.id
                const showResult = showExplanation
                const isThisCorrect = opcao.correta
                
                let bgClass = 'bg-slate-100 hover:bg-purple-50'
                if (isSelected && !showResult) bgClass = 'bg-purple-200'
                if (showResult && isThisCorrect) bgClass = 'bg-green-200'
                if (showResult && isSelected && !isThisCorrect) bgClass = 'bg-red-200'

                return (
                  <button
                    key={opcao.id}
                    onClick={() => !showExplanation && setSelectedAnswer(opcao.id)}
                    disabled={showExplanation}
                    className={`w-full p-4 rounded-lg text-left font-medium transition-all ${bgClass} ${
                      !showExplanation ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className="text-lg">{opcao.texto}</span>
                    {showResult && isThisCorrect && (
                      <span className="ml-2 text-green-700">✓</span>
                    )}
                    {showResult && isSelected && !isThisCorrect && (
                      <span className="ml-2 text-red-700">✗</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explicação */}
            {showExplanation && (
              <div className={`mb-6 p-4 rounded-lg ${
                isCorrect ? 'bg-green-100 border-2 border-green-400' : 'bg-orange-100 border-2 border-orange-400'
              }`}>
                <div className="font-bold text-lg mb-2">
                  {isCorrect ? '🎉 Resposta Correta!' : '💡 Agora você já sabe!'}
                </div>
                <div className="text-slate-700">
                  {currentQuestion.explicacao}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              {!showExplanation ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 text-lg"
                >
                  Confirmar Resposta
                </Button>
              ) : (
                <Button
                  onClick={handleContinueGame}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg"
                >
                  Continuar Jogando 🎮
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 🏁 Feedback rápido (sem replay) */}
      {gameFinished && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10000 }}>
          <Card className="bg-white/90 rounded-2xl p-6 shadow-2xl text-center">
            <div className="text-4xl mb-2">🏆</div>
            <div className="text-lg font-semibold">Jogo concluído! Avançando...</div>
          </Card>
        </div>
      )}
    </div>
  )
}

