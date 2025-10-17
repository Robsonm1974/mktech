'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function CriarQuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const blocoId = searchParams.get('bloco')
  const supabase = createSupabaseBrowserClient()
  
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'mcq',
    perguntas: [
      {
        id: crypto.randomUUID(),
        prompt: '',
        choices: ['', '', '', ''],
        correctIndex: 0,
        pontos: 10
      }
    ] as QuizQuestion[]
  })

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
    
    if (!blocoId) {
      toast.error('ID do bloco não fornecido')
      return
    }

    if (!form.titulo || form.perguntas.length === 0) {
      toast.error('Preencha o título e adicione pelo menos uma pergunta')
      return
    }

    try {
      setSaving(true)

      console.log('📊 Dados do formulário:', {
        blocoId,
        titulo: form.titulo,
        tipo: form.tipo,
        perguntas: form.perguntas
      })

      // Criar quiz usando bloco_template_id (não bloco_id)
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          bloco_id: blocoId, // Este é o bloco_template_id na verdade
          titulo: form.titulo,
          tipo: form.tipo,
          perguntas: form.perguntas
        })
        .select()
        .single()

      if (quizError) {
        console.error('❌ Erro ao criar quiz:', quizError)
        console.error('❌ Erro detalhado:', JSON.stringify(quizError, null, 2))
        throw new Error(quizError.message || 'Erro ao criar quiz no Supabase')
      }

      console.log('✅ Quiz criado:', quiz)

      // Atualizar bloco com quiz_id
      const { error: updateError } = await supabase
        .from('blocos_templates')
        .update({
          quiz_id: quiz.id,
          status: 'com_quiz',
          updated_at: new Date().toISOString()
        })
        .eq('id', blocoId)

      if (updateError) {
        console.error('❌ Erro ao atualizar bloco:', updateError)
        console.error('❌ Erro detalhado:', JSON.stringify(updateError, null, 2))
        throw new Error(updateError.message || 'Erro ao atualizar bloco')
      }

      console.log('✅ Bloco atualizado com quiz_id')

      toast.success('Quiz criado com sucesso!')
      router.push('/admin/blocos')
      router.refresh()
    } catch (error) {
      console.error('❌ Erro ao criar quiz:', error)
      console.error('❌ Tipo do erro:', typeof error)
      console.error('❌ Erro stringified:', JSON.stringify(error, null, 2))
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : 'Erro desconhecido ao criar quiz'
      
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/admin/blocos" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para blocos
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Criar Quiz</h1>
        <p className="text-slate-600 mt-1">Adicione perguntas e respostas para o bloco</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">
              Título do Quiz *
            </label>
            <Input
              id="titulo"
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Quiz - Introdução ao Raciocínio Lógico"
              required
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Perguntas
            </label>

            {form.perguntas.map((pergunta, qIndex) => (
              <Card key={pergunta.id} className="p-4 mb-4 bg-slate-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-900">Pergunta {qIndex + 1}</span>
                  {form.perguntas.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Input
                      type="text"
                      value={pergunta.prompt}
                      onChange={(e) => updateQuestion(qIndex, 'prompt', e.target.value)}
                      placeholder="Digite a pergunta..."
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm text-slate-600">Opções de resposta:</span>
                    {pergunta.choices.map((choice, cIndex) => (
                      <div key={cIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={pergunta.correctIndex === cIndex}
                          onChange={() => updateQuestion(qIndex, 'correctIndex', cIndex)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">{String.fromCharCode(65 + cIndex)})</span>
                        <Input
                          type="text"
                          value={choice}
                          onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                          placeholder={`Opção ${String.fromCharCode(65 + cIndex)}`}
                          required
                          disabled={saving}
                          className="flex-1"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 mt-1">
                      Selecione a resposta correta marcando o círculo
                    </p>
                  </div>

                  <div className="w-32">
                    <label className="block text-xs text-slate-600 mb-1">Pontos</label>
                    <Input
                      type="number"
                      min="1"
                      value={pergunta.pontos}
                      onChange={(e) => updateQuestion(qIndex, 'pontos', parseInt(e.target.value) || 1)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              disabled={saving}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Quiz
                </>
              )}
            </Button>
            <Link href="/admin/blocos">
              <Button type="button" variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function CriarQuizPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <CriarQuizContent />
    </Suspense>
  )
}
