'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'

interface Turma {
  id: string
  tenant_id: string
  name: string
  ano_escolar_id: string
  designacao: string | null
  professor_id: string
  sala: string | null
  turno: string | null
  descricao: string | null
}

interface Professor {
  id: string
  full_name: string
  email: string
}

export default function EditarTurmaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const turmaId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [professores, setProfessores] = useState<Professor[]>([])
  const [turma, setTurma] = useState<Turma | null>(null)
  const [form, setForm] = useState({
    designacao: '',
    name: '',
    professor_id: '',
    sala: '',
    turno: '',
    descricao: ''
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (user?.tenant_id && turmaId) {
      loadTurma()
      loadProfessores()
    }
  }, [user, turmaId])

  const loadTurma = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaId)
        .eq('tenant_id', user?.tenant_id)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Turma não encontrada')
        router.push('/dashboard/admin-escola/turmas')
        return
      }

      setTurma(data)
      setForm({
        designacao: data.designacao || '',
        name: data.name || '',
        professor_id: data.professor_id || '',
        sala: data.sala || '',
        turno: data.turno || '',
        descricao: data.descricao || ''
      })
    } catch (error) {
      console.error('Erro ao carregar turma:', error)
      toast.error('Erro ao carregar turma')
      router.push('/dashboard/admin-escola/turmas')
    } finally {
      setLoading(false)
    }
  }

  const loadProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('tenant_id', user?.tenant_id)
        .eq('role', 'professor')
        .eq('active', true)
        .order('full_name')

      if (error) throw error
      setProfessores(data || [])
    } catch (error) {
      console.error('Erro ao carregar professores:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.professor_id) {
      toast.error('Selecione um professor')
      return
    }

    if (!form.name.trim()) {
      toast.error('Nome da turma é obrigatório')
      return
    }

    try {
      setSaving(true)

      const { data, error } = await supabase.rpc('update_turma_admin', {
        p_turma_id: turmaId,
        p_designacao: form.designacao || null,
        p_name: form.name,
        p_professor_id: form.professor_id,
        p_sala: form.sala || null,
        p_turno: form.turno || null,
        p_descricao: form.descricao || null
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Turma atualizada com sucesso!')
        router.push('/dashboard/admin-escola/turmas')
        router.refresh()
      } else {
        toast.error(data?.message || 'Erro ao atualizar turma')
      }
    } catch (error) {
      console.error('Erro ao atualizar turma:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar turma'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!turma) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Turma</h1>
          <p className="text-gray-600 mt-1">
            Atualize as informações da turma
          </p>
        </div>
        <Link href="/dashboard/admin-escola/turmas">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Informação do Ano (não editável) */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Ano Escolar:</strong> {turma.ano_escolar_id}
          <span className="ml-2 text-blue-600">(não pode ser alterado)</span>
        </p>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Turma</CardTitle>
          <CardDescription>
            Atualize os campos necessários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Designação */}
            <div className="space-y-2">
              <Label htmlFor="designacao">
                Designação (A, B, C, Especial, etc) - Opcional
              </Label>
              <Input
                id="designacao"
                value={form.designacao}
                onChange={(e) => setForm({ ...form, designacao: e.target.value })}
                placeholder="A, B, C, Especial..."
                maxLength={50}
              />
              <p className="text-xs text-gray-500">
                Deixe em branco se houver apenas uma turma deste ano
              </p>
            </div>

            {/* Nome da Turma */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Turma *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: 1º Ano A"
                required
                maxLength={100}
              />
            </div>

            {/* Professor */}
            <div className="space-y-2">
              <Label htmlFor="professor_id">Professor Responsável *</Label>
              <select
                id="professor_id"
                value={form.professor_id}
                onChange={(e) => setForm({ ...form, professor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um professor</option>
                {professores.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.full_name} ({prof.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Sala */}
            <div className="space-y-2">
              <Label htmlFor="sala">Sala - Opcional</Label>
              <Input
                id="sala"
                value={form.sala}
                onChange={(e) => setForm({ ...form, sala: e.target.value })}
                placeholder="Ex: Sala 101"
                maxLength={50}
              />
            </div>

            {/* Turno */}
            <div className="space-y-2">
              <Label htmlFor="turno">Turno - Opcional</Label>
              <select
                id="turno"
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o turno</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição - Opcional</Label>
              <textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Observações adicionais sobre a turma..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                maxLength={500}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
              <Link href="/dashboard/admin-escola/turmas" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
