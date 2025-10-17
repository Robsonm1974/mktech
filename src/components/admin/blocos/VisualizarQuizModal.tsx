'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Edit, Trash2, CheckCircle, Circle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

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

interface VisualizarQuizModalProps {
  blocoId: string | null
  quizId: string | null
  isOpen: boolean
  onClose: () => void
  onDelete?: () => void
}

export default function VisualizarQuizModal({
  blocoId,
  quizId,
  isOpen,
  onClose,
  onDelete
}: VisualizarQuizModalProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (isOpen && quizId) {
      loadQuiz()
    } else {
      setQuiz(null)
      setLoading(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quizId])

  const loadQuiz = async () => {
    if (!quizId) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (error) throw error

      setQuiz(data as Quiz)
    } catch (error) {
      console.error('Erro ao carregar quiz:', error)
      toast.error('Erro ao carregar quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quizId || !window.confirm('Tem certeza que deseja deletar este quiz?')) {
      return
    }

    try {
      setDeleting(true)

      // Deletar quiz
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (deleteError) throw deleteError

      // Atualizar bloco
      if (blocoId) {
        await supabase
          .from('blocos_templates')
          .update({
            quiz_id: null,
            status: 'incompleto',
            updated_at: new Date().toISOString()
          })
          .eq('id', blocoId)
      }

      toast.success('Quiz deletado com sucesso!')
      onDelete?.()
      onClose()
    } catch (error) {
      console.error('Erro ao deletar quiz:', error)
      toast.error('Erro ao deletar quiz')
    } finally {
      setDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white p-6 m-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          disabled={deleting}
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Quiz</h2>
          <p className="text-slate-600 text-sm mt-1">Visualizar e gerenciar quiz do bloco</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Carregando quiz...</span>
          </div>
        ) : !quiz ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Quiz não encontrado</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cabeçalho do Quiz */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900">{quiz.titulo}</h3>
              <div className="flex gap-4 mt-2 text-sm text-blue-700">
                <span>Tipo: {quiz.tipo === 'mcq' ? 'Múltipla Escolha' : quiz.tipo}</span>
                <span>•</span>
                <span>{quiz.perguntas.length} pergunta(s)</span>
              </div>
            </Card>

            {/* Perguntas */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Perguntas:</h4>
              
              {quiz.perguntas.map((pergunta, index) => (
                <Card key={pergunta.id} className="p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-semibold text-slate-900">Pergunta {index + 1}</h5>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                      {pergunta.pontos} pontos
                    </span>
                  </div>

                  <p className="text-slate-800 mb-4 text-base">{pergunta.prompt}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Opções:</p>
                    {pergunta.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className={`flex items-start gap-3 p-3 rounded ${
                          choiceIndex === pergunta.correctIndex
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-slate-50 border border-slate-200'
                        }`}
                      >
                        {choiceIndex === pergunta.correctIndex ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <span className="font-semibold text-slate-700 mr-2">
                            {String.fromCharCode(65 + choiceIndex)})
                          </span>
                          <span className={
                            choiceIndex === pergunta.correctIndex
                              ? 'text-green-900'
                              : 'text-slate-700'
                          }>
                            {choice}
                          </span>
                          {choiceIndex === pergunta.correctIndex && (
                            <span className="ml-2 text-xs font-semibold text-green-700">
                              ✓ Correta
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t">
              <Link href={`/admin/quizzes/editar/${quizId}?bloco=${blocoId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Quiz
                </Button>
              </Link>
              
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={onClose} disabled={deleting}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

