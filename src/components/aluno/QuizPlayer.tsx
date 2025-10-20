'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Award } from 'lucide-react'

interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  pontos: number
}

interface QuizPlayerProps {
  quizId: string
  titulo: string
  perguntas: QuizQuestion[]
  onComplete: (pontos: number, tentativas: number) => void
}

export default function QuizPlayer({ titulo, perguntas, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [tentativas, setTentativas] = useState(0)
  const [pontosGanhos, setPontosGanhos] = useState(0)
  const [quizCompleto, setQuizCompleto] = useState(false)

  const currentQuestion = perguntas[currentQuestionIndex]

  const handleSelectAnswer = (index: number) => {
    if (isAnswered) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return

    const correct = selectedAnswer === currentQuestion.correctIndex
    setIsAnswered(true)
    setIsCorrect(correct)
    setTentativas(tentativas + 1)

    if (correct) {
      // Calcular pontos com multiplicador baseado em tentativas
      const multiplicador = tentativas === 0 ? 1.0 : tentativas === 1 ? 0.5 : 0.25
      const pontos = Math.round(currentQuestion.pontos * multiplicador)
      setPontosGanhos(pontosGanhos + pontos)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < perguntas.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
      setIsCorrect(false)
    } else {
      setQuizCompleto(true)
      onComplete(pontosGanhos, tentativas)
    }
  }

  useEffect(() => {
    // Reset ao mudar de pergunta
    setSelectedAnswer(null)
    setIsAnswered(false)
    setIsCorrect(false)
  }, [currentQuestionIndex])

  if (!currentQuestion && !quizCompleto) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Erro ao carregar pergunta</p>
      </div>
    )
  }

  if (quizCompleto) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <Award className="h-16 w-16 text-yellow-500" />
          <h2 className="text-2xl font-bold text-slate-900">Quiz Concluído!</h2>
          <p className="text-slate-600">
            Você ganhou <strong className="text-blue-600">{pontosGanhos} pontos</strong>
          </p>
          <p className="text-sm text-slate-500">
            Total de tentativas: {tentativas}
          </p>
          <Button onClick={() => window.location.reload()} size="lg">
            Voltar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{titulo}</h2>
          <p className="text-slate-600">
            Pergunta {currentQuestionIndex + 1} de {perguntas.length}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {pontosGanhos} pontos
        </Badge>
      </div>

      {/* Progresso */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{
            width: `${((currentQuestionIndex + 1) / perguntas.length) * 100}%`
          }}
        />
      </div>

      {/* Pergunta */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {currentQuestion?.prompt}
        </h3>

        {/* Opções */}
        <div className="space-y-3">
          {currentQuestion?.choices.map((choice, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectAnswer = index === currentQuestion?.correctIndex
            const showCorrect = isAnswered && isCorrectAnswer
            const showWrong = isAnswered && isSelected && !isCorrect

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={isAnswered}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected && !isAnswered ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}
                  ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                  ${showWrong ? 'border-red-500 bg-red-50' : ''}
                  ${!isAnswered ? 'hover:border-blue-400 hover:bg-slate-50' : ''}
                  disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{choice}</span>
                  {showCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {showWrong && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {isAnswered && (
          <div className={`mt-6 p-4 rounded-lg ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '✅ Resposta correta!' : '❌ Resposta incorreta'}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {isCorrect 
                ? `Você ganhou ${Math.round((currentQuestion?.pontos || 0) * (tentativas === 0 ? 1.0 : tentativas === 1 ? 0.5 : 0.25))} pontos!`
                : 'Tente novamente ou vá para a próxima pergunta.'
              }
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="mt-6 flex gap-3">
          {!isAnswered ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="flex-1"
              size="lg"
            >
              Confirmar Resposta
            </Button>
          ) : isCorrect || tentativas >= 2 ? (
            <Button
              onClick={handleNextQuestion}
              className="flex-1"
              size="lg"
            >
              {currentQuestionIndex < perguntas.length - 1 ? 'Próxima Pergunta' : 'Finalizar Quiz'}
            </Button>
          ) : (
            <div className="flex gap-3 flex-1">
              <Button
                onClick={() => {
                  setIsAnswered(false)
                  setSelectedAnswer(null)
                }}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Tentar Novamente
              </Button>
              <Button
                onClick={handleNextQuestion}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Pular
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Info de pontos */}
      <div className="text-center text-sm text-slate-600">
        <p>
          💡 Dica: Acerte na primeira tentativa para ganhar pontos totais!
        </p>
        <p className="text-xs text-slate-500 mt-1">
          1ª tentativa: 100% • 2ª tentativa: 50% • 3ª tentativa: 25%
        </p>
      </div>
    </div>
  )
}

