'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface QuizQuestion {
  id: string
  prompt: string
  choices: string[]
  correctIndex: number
  pontos: number
}

interface Quiz {
  id: string
  bloco_id: string
  titulo: string
  tipo: string
  perguntas: QuizQuestion[]
}

function EditarQuizContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const quizId = params.id as string
  const blocoId = searchParams.get('bloco')
  const supabase = createSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'mcq',
    perguntas: [] as QuizQuestion[]
  })

  useEffect(() => {
    if (quizId) {
      loadQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId])

  const loadQuiz = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single()

      if (error) throw error

      if (data) {
        setForm({
          titulo: data.titulo || '',
          tipo: data.tipo || 'mcq',
          perguntas: data.perguntas || []
        })
      }
    } catch (error) {
      console.error('Erro ao carregar quiz:', error)
      toast.error('Erro ao carregar quiz')
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = () => {
    setForm({
      ...form,
      perguntas: [
        ...form.perguntas,
        {
          id: crypto.randomUUID(),
          prompt: '',
          choices: ['', '', '', ''],
          correctIndex: 0,
          pontos: 10
        }
      ]
    })
  }

  const removeQuestion = (index: number) => {
    if (form.perguntas.length === 1) {
      toast.error('O quiz deve ter pelo menos uma pergunta')
      return
    }
    setForm({
      ...form,
      perguntas: form.perguntas.filter((_, i) => i !== index)
    })
  }

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number | string[]) => {
    const newPerguntas = [...form.perguntas]
    const updated = { ...newPerguntas[index], [field]: value } as QuizQuestion
    newPerguntas[index] = updated
    setForm({ ...form, perguntas: newPerguntas })
  }

  const updateChoice = (questionIndex: number, choiceIndex: number, value: string) => {
    const newPerguntas = [...form.perguntas]
    const pergunta = newPerguntas[questionIndex]
    if (!pergunta) return
    
    const newChoices = [...pergunta.choices]
    newChoices[choiceIndex] = value
    newPerguntas[questionIndex] = { ...pergunta, choices: newChoices }
    setForm({ ...form, perguntas: newPerguntas })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.titulo || form.perguntas.length === 0) {
      toast.error('Preencha o título e mantenha pelo menos uma pergunta')
      return
    }

    // Validar perguntas
    for (let i = 0; i < form.perguntas.length; i++) {
      const p = form.perguntas[i]
      if (!p || !p.prompt.trim()) {
        toast.error(`Pergunta ${i + 1}: preencha o enunciado`)
        return
      }
      const filledChoices = p.choices.filter(c => c.trim() !== '')
      if (filledChoices.length < 2) {
        toast.error(`Pergunta ${i + 1}: adicione pelo menos 2 opções`)
        return
      }
      if (p.correctIndex < 0 || p.correctIndex >= p.choices.length || !p.choices[p.correctIndex]?.trim()) {
        toast.error(`Pergunta ${i + 1}: selecione uma resposta correta válida`)
        return
      }
    }

    try {
      setSaving(true)

      // Atualizar quiz
      const { error: updateError } = await supabase
        .from('quizzes')
        .update({
          titulo: form.titulo,
          tipo: form.tipo,
          perguntas: form.perguntas,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId)

      if (updateError) throw updateError

      toast.success('Quiz atualizado com sucesso!')
      
      // Redirecionar de volta para a página de blocos
      if (blocoId) {
        router.push(`/admin/blocos`)
      } else {
        router.back()
      }
    } catch (error) {
      console.error('Erro ao atualizar quiz:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar quiz')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando quiz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/blocos" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Blocos
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Editar Quiz</h1>
          <p className="text-slate-600 mt-1">Atualize as perguntas e configurações do quiz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Informações Básicas</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">
                  Título do Quiz *
                </label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Quiz - Introdução aos Algoritmos"
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Quiz
                </label>
                <select
                  id="tipo"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="mcq">Múltipla Escolha</option>
                  <option value="verdadeiro_falso">Verdadeiro ou Falso</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Perguntas */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Perguntas ({form.perguntas.length})
              </h2>
              <Button
                type="button"
                onClick={addQuestion}
                variant="outline"
                size="sm"
                disabled={saving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Pergunta
              </Button>
            </div>

            <div className="space-y-6">
              {form.perguntas.map((pergunta, qIndex) => (
                <Card key={pergunta.id} className="p-4 border-2 border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-900">Pergunta {qIndex + 1}</h3>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={pergunta.pontos}
                        onChange={(e) => updateQuestion(qIndex, 'pontos', parseInt(e.target.value) || 10)}
                        className="w-20"
                        min="1"
                        disabled={saving}
                      />
                      <span className="text-sm text-slate-600 self-center">pontos</span>
                      {form.perguntas.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeQuestion(qIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Enunciado *
                      </label>
                      <textarea
                        value={pergunta.prompt}
                        onChange={(e) => updateQuestion(qIndex, 'prompt', e.target.value)}
                        placeholder="Digite a pergunta..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Opções de Resposta *
                      </label>
                      <div className="space-y-2">
                        {pergunta.choices.map((choice, cIndex) => (
                          <div key={cIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${pergunta.id}`}
                              checked={pergunta.correctIndex === cIndex}
                              onChange={() => updateQuestion(qIndex, 'correctIndex', cIndex)}
                              className="w-4 h-4 text-blue-600"
                              disabled={saving}
                            />
                            <span className="text-sm font-medium text-slate-600 w-8">
                              {String.fromCharCode(65 + cIndex)})
                            </span>
                            <Input
                              value={choice}
                              onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                              placeholder={`Opção ${String.fromCharCode(65 + cIndex)}`}
                              className="flex-1"
                              disabled={saving}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Selecione o círculo da resposta correta
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Ações */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EditarQuizPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <EditarQuizContent />
    </Suspense>
  )
}

