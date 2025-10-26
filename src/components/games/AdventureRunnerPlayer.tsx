'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import Phaser from 'phaser'
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
  }, [playSound])

  // Criar uma classe de cena customizada com os callbacks (memoizada)
  const SceneWithCallbacks = useMemo(() => {
    return class extends AdventureRunnerScene {
      constructor() {
        super()
      }
      
      init(data: any) {
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

      {/* 🏁 Tela Final do Jogo */}
      {gameFinished && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 flex items-center justify-center p-4"
          style={{ zIndex: 10000 }}
        >
          <Card className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl text-center">
            {/* Troféu */}
            <div className="text-8xl mb-4">🏆</div>
            
            {/* Título */}
            <h2 className="text-4xl font-bold text-slate-900 mb-2">
              Parabéns!
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Você completou o jogo!
            </p>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-6 border-4 border-yellow-400">
                <div className="text-5xl mb-2">💰</div>
                <div className="text-3xl font-bold text-yellow-800">{finalCoins}</div>
                <div className="text-sm text-yellow-700 font-semibold">Moedas Coletadas</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 border-4 border-purple-400">
                <div className="text-5xl mb-2">⭐</div>
                <div className="text-3xl font-bold text-purple-800">{finalScore}</div>
                <div className="text-sm text-purple-700 font-semibold">Pontuação Final</div>
              </div>
            </div>

            {/* Mensagem motivacional */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-lg text-blue-800 font-medium">
                {finalCoins >= 15 ? '🌟 Incrível! Você é um mestre!' :
                 finalCoins >= 10 ? '👏 Muito bem! Continue assim!' :
                 '💪 Bom trabalho! Tente novamente para coletar mais moedas!'}
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg"
              >
                🔄 Jogar Novamente
              </Button>
              <Button
                onClick={() => onComplete(finalScore, finalCoins)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 text-lg"
              >
                ✅ Finalizar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

