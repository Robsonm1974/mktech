'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useState, useEffect, FormEvent } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AnoEscolar {
  id: string
  nome: string
  idade_minima: number
  ordem: number
}

interface Professor {
  id: string
  full_name: string
  email: string
}

export default function NovaTurmaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [form, setForm] = useState({
    ano_escolar_id: '',
    designacao: '',
    designacao_personalizada: '',
    name: '',
    professor_id: '',
    sala: '',
    turno: '',
    descricao: ''
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadAnosEscolares()
    if (user?.tenant_id) {
      loadProfessores()
    }
  }, [user])

  // Auto-gerar nome da turma
  useEffect(() => {
    if (form.ano_escolar_id) {
      const ano = anosEscolares.find(a => a.id === form.ano_escolar_id)
      if (ano) {
        const designacao = form.designacao === 'personalizado' 
          ? form.designacao_personalizada 
          : form.designacao
        
        const nome = designacao 
          ? `${ano.nome} ${designacao}` 
          : ano.nome
        
        setForm(prev => ({ ...prev, name: nome }))
      }
    }
  }, [form.ano_escolar_id, form.designacao, form.designacao_personalizada, anosEscolares])

  const loadAnosEscolares = async () => {
    try {
      const { data, error } = await supabase
        .from('anos_escolares')
        .select('*')
        .order('ordem')

      if (error) throw error
      setAnosEscolares(data || [])
    } catch (error) {
      console.error('Erro ao carregar anos:', error)
      toast.error('Erro ao carregar anos escolares')
    }
  }

  const loadProfessores = async () => {
    if (!user?.tenant_id) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('tenant_id', user.tenant_id)
        .eq('role', 'professor')
        .eq('active', true)
        .order('full_name')

      if (error) throw error
      setProfessores(data || [])
    } catch (error) {
      console.error('Erro ao carregar professores:', error)
      toast.error('Erro ao carregar professores')
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user?.tenant_id) {
      toast.error('Erro: Tenant não identificado')
      return
    }

    // Validações
    if (!form.ano_escolar_id) {
      toast.error('Selecione o Ano Escolar')
      return
    }

    if (!form.professor_id) {
      toast.error('Selecione o Professor Responsável')
      return
    }

    if (!form.name.trim()) {
      toast.error('Nome da turma não pode estar vazio')
      return
    }

    try {
      setSaving(true)

      const designacaoFinal = form.designacao === 'personalizado' 
        ? form.designacao_personalizada 
        : form.designacao

      const { data, error } = await supabase.rpc('insert_turma_admin', {
        p_tenant_id: user.tenant_id,
        p_ano_escolar_id: form.ano_escolar_id,
        p_designacao: designacaoFinal || null,
        p_name: form.name,
        p_professor_id: form.professor_id,
        p_sala: form.sala || null,
        p_turno: form.turno || null,
        p_descricao: form.descricao || null
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Turma criada com sucesso!')
        router.push('/dashboard/admin-escola/turmas')
        router.refresh()
      } else {
        console.error('RPC retornou erro:', data)
        toast.error(data?.message || 'Erro ao criar turma')
      }
    } catch (error) {
      console.error('Erro ao criar turma:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar turma'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/login">Fazer Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/admin-escola/turmas">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nova Turma</h1>
          <p className="text-gray-600 mt-1">
            Preencha os dados para criar uma nova turma
          </p>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dados da Turma</CardTitle>
            <CardDescription>
              * Campos obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ano Escolar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano Escolar *
              </label>
              <select
                value={form.ano_escolar_id}
                onChange={(e) => setForm({ ...form, ano_escolar_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={saving}
              >
                <option value="">Selecione o ano...</option>
                {anosEscolares.map((ano) => (
                  <option key={ano.id} value={ano.id}>
                    {ano.nome} ({ano.idade_minima} anos)
                  </option>
                ))}
              </select>
            </div>

            {/* Designação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designação (Opcional)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {['A', 'B', 'C', 'D', 'E', 'Manhã', 'Tarde', 'Noite', 'Especial'].map((des) => (
                  <button
                    key={des}
                    type="button"
                    onClick={() => setForm({ ...form, designacao: des })}
                    className={`px-4 py-2 rounded-md border transition-colors ${
                      form.designacao === des
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                    disabled={saving}
                  >
                    {des}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, designacao: 'personalizado' })}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    form.designacao === 'personalizado'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                  disabled={saving}
                >
                  Personalizado
                </button>
              </div>
              
              {form.designacao === 'personalizado' && (
                <input
                  type="text"
                  value={form.designacao_personalizada}
                  onChange={(e) => setForm({ ...form, designacao_personalizada: e.target.value })}
                  placeholder="Digite a designação..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                />
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                💡 Se não informar, a turma será apenas &ldquo;{anosEscolares.find(a => a.id === form.ano_escolar_id)?.nome || 'Ano'}&rdquo;
              </p>
            </div>

            {/* Nome da Turma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Turma *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: 1º Ano A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Gerado automaticamente ou editável
              </p>
            </div>

            {/* Professor Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professor Responsável *
              </label>
              <select
                value={form.professor_id}
                onChange={(e) => setForm({ ...form, professor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={saving}
              >
                <option value="">Selecione um professor...</option>
                {professores.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.full_name} ({prof.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Sala */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sala (Opcional)
              </label>
              <input
                type="text"
                value={form.sala}
                onChange={(e) => setForm({ ...form, sala: e.target.value })}
                placeholder="Ex: Sala 201, Laboratório 3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turno (Opcional)
              </label>
              <select
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="">Não especificado</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Informações adicionais sobre a turma..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-2 mt-6">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Turma
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

