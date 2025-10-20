'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  name: string
}

// Ícones disponíveis
const ICONES_DISPONIVEIS = [
  { id: 'dog', emoji: '🐕', nome: 'Cachorro' },
  { id: 'cat', emoji: '🐱', nome: 'Gato' },
  { id: 'lion', emoji: '🦁', nome: 'Leão' },
  { id: 'panda', emoji: '🐼', nome: 'Panda' },
  { id: 'rabbit', emoji: '🐰', nome: 'Coelho' },
  { id: 'bird', emoji: '🐦', nome: 'Pássaro' },
  { id: 'fish', emoji: '🐠', nome: 'Peixe' },
  { id: 'turtle', emoji: '🐢', nome: 'Tartaruga' },
  { id: 'butterfly', emoji: '🦋', nome: 'Borboleta' },
  { id: 'bee', emoji: '🐝', nome: 'Abelha' },
  { id: 'fruit', emoji: '🍎', nome: 'Maçã' },
  { id: 'banana', emoji: '🍌', nome: 'Banana' },
  { id: 'strawberry', emoji: '🍓', nome: 'Morango' },
  { id: 'grape', emoji: '🍇', nome: 'Uva' },
  { id: 'flower', emoji: '🌸', nome: 'Flor' },
  { id: 'sunflower', emoji: '🌻', nome: 'Girassol' },
  { id: 'star', emoji: '⭐', nome: 'Estrela' },
  { id: 'heart', emoji: '❤️', nome: 'Coração' },
  { id: 'rainbow', emoji: '🌈', nome: 'Arco-íris' },
  { id: 'rocket', emoji: '🚀', nome: 'Foguete' },
]

export default function EditarAlunoPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const alunoId = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [form, setForm] = useState({
    turma_id: '',
    full_name: '',
    data_nascimento: '',
    numero_matricula: '',
    icone_afinidade: 'dog',
    pin_code: '',
    email_responsavel: '',
    nome_responsavel: '',
    telefone_responsavel: '',
    active: true
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (user?.tenant_id && alunoId) {
      loadAluno()
      loadTurmas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, alunoId])

  const loadAluno = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', alunoId)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Aluno não encontrado')
        router.push('/dashboard/admin-escola/alunos')
        return
      }

      setForm({
        turma_id: data.turma_id || '',
        full_name: data.full_name,
        data_nascimento: data.data_nascimento || '',
        numero_matricula: data.numero_matricula || '',
        icone_afinidade: data.icone_afinidade || 'dog',
        pin_code: data.pin_code,
        email_responsavel: data.email_responsavel || '',
        nome_responsavel: data.nome_responsavel || '',
        telefone_responsavel: data.telefone_responsavel || '',
        active: data.active
      })
    } catch (error) {
      console.error('Erro ao carregar aluno:', error)
      toast.error('Erro ao carregar aluno')
      router.push('/dashboard/admin-escola/alunos')
    } finally {
      setLoading(false)
    }
  }

  const loadTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select('id, name')
        .eq('tenant_id', user?.tenant_id)
        .order('name')

      if (error) throw error
      setTurmas(data || [])
    } catch (error) {
      console.error('Erro ao carregar turmas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.turma_id) {
      toast.error('Selecione uma turma')
      return
    }

    if (!form.full_name.trim()) {
      toast.error('Nome completo é obrigatório')
      return
    }

    if (!form.pin_code || form.pin_code.length !== 4) {
      toast.error('PIN deve ter 4 dígitos')
      return
    }

    try {
      setSaving(true)

      const { data, error } = await supabase.rpc('update_aluno_admin', {
        p_aluno_id: alunoId,
        p_turma_id: form.turma_id,
        p_full_name: form.full_name,
        p_data_nascimento: form.data_nascimento || null,
        p_numero_matricula: form.numero_matricula || null,
        p_icone_afinidade: form.icone_afinidade,
        p_pin_code: form.pin_code,
        p_foto_url: null,
        p_email_responsavel: form.email_responsavel || null,
        p_nome_responsavel: form.nome_responsavel || null,
        p_telefone_responsavel: form.telefone_responsavel || null,
        p_active: form.active
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Aluno atualizado com sucesso!')
        router.push('/dashboard/admin-escola/alunos')
        router.refresh()
      } else {
        toast.error(data?.message || 'Erro ao atualizar aluno')
      }
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
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

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Aluno</h1>
          <p className="text-gray-600 mt-1">
            Atualize os dados do aluno
          </p>
        </div>
        <Link href="/dashboard/admin-escola/alunos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="turma_id">Turma *</Label>
              <select
                id="turma_id"
                value={form.turma_id}
                onChange={(e) => setForm({ ...form, turma_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_matricula">Matrícula</Label>
                <Input
                  id="numero_matricula"
                  value={form.numero_matricula}
                  onChange={(e) => setForm({ ...form, numero_matricula: e.target.value })}
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Aluno ativo
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Ícone e PIN */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ícone de Afinidade *</Label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {ICONES_DISPONIVEIS.map((icone) => (
                  <button
                    key={icone.id}
                    type="button"
                    onClick={() => setForm({ ...form, icone_afinidade: icone.id })}
                    className={`
                      p-3 rounded-lg border-2 transition-all hover:scale-110
                      ${form.icone_afinidade === icone.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <span className="text-3xl">{icone.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin_code">PIN de 4 Dígitos *</Label>
              <Input
                id="pin_code"
                value={form.pin_code}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setForm({ ...form, pin_code: valor })
                }}
                maxLength={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dados do Responsável */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Responsável</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
              <Input
                id="nome_responsavel"
                value={form.nome_responsavel}
                onChange={(e) => setForm({ ...form, nome_responsavel: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email_responsavel">E-mail</Label>
                <Input
                  id="email_responsavel"
                  type="email"
                  value={form.email_responsavel}
                  onChange={(e) => setForm({ ...form, email_responsavel: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone_responsavel">Telefone</Label>
                <Input
                  id="telefone_responsavel"
                  type="tel"
                  value={form.telefone_responsavel}
                  onChange={(e) => setForm({ ...form, telefone_responsavel: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="flex-1">
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
          <Link href="/dashboard/admin-escola/alunos" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

