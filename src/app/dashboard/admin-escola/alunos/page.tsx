'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, GraduationCap, Edit, Trash2, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'

interface Aluno {
  id: string
  tenant_id: string
  turma_id: string | null
  turma_nome: string
  ano_escolar_id: string | null
  ano_nome: string
  full_name: string
  data_nascimento: string | null
  numero_matricula: string | null
  icone_afinidade: string
  pin_code: string
  foto_url: string | null
  email_responsavel: string | null
  nome_responsavel: string | null
  telefone_responsavel: string | null
  pontos_totais: number
  badges_conquistados: Array<{id: string; nome: string; data: string}>
  nivel: number
  active: boolean
  created_at: string
  updated_at: string
}

interface Turma {
  id: string
  name: string
  ano_escolar_id: string
}

interface AnoEscolar {
  id: string
  nome: string
}

export default function AlunosPage() {
  const { user, loading } = useAuth()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [loadingAlunos, setLoadingAlunos] = useState(true)
  const [filtroTurma, setFiltroTurma] = useState<string>('')
  const [filtroAno, setFiltroAno] = useState<string>('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (user?.tenant_id) {
      loadAlunos()
      loadTurmas()
      loadAnosEscolares()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadAlunos = async () => {
    if (!user?.tenant_id) return

    try {
      setLoadingAlunos(true)
      
      const { data, error } = await supabase.rpc('get_alunos_admin', {
        p_tenant_id: user.tenant_id,
        p_turma_id: null,
        p_active: null
      })

      if (error) throw error
      setAlunos(data || [])
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
      toast.error('Erro ao carregar alunos')
    } finally {
      setLoadingAlunos(false)
    }
  }

  const loadTurmas = async () => {
    if (!user?.tenant_id) return

    try {
      const { data, error } = await supabase
        .from('turmas')
        .select('id, name, ano_escolar_id')
        .eq('tenant_id', user.tenant_id)
        .order('name')

      if (error) throw error
      setTurmas(data || [])
    } catch (error) {
      console.error('Erro ao carregar turmas:', error)
    }
  }

  const loadAnosEscolares = async () => {
    try {
      const { data, error } = await supabase
        .from('anos_escolares')
        .select('id, nome')
        .order('ordem')

      if (error) throw error
      setAnosEscolares(data || [])
    } catch (error) {
      console.error('Erro ao carregar anos escolares:', error)
    }
  }

  const handleDelete = async (alunoId: string, nomeAluno: string) => {
    if (!confirm(`Confirma a exclusão do aluno "${nomeAluno}"?`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('delete_aluno_admin', {
        p_aluno_id: alunoId
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Aluno excluído com sucesso!')
        loadAlunos()
      } else {
        toast.error(data?.message || 'Erro ao excluir aluno')
      }
    } catch (error) {
      console.error('Erro ao excluir aluno:', error)
      toast.error('Erro ao excluir aluno')
    }
  }

  // Aplicar filtros
  const alunosFiltrados = alunos.filter((aluno) => {
    if (filtroTurma && aluno.turma_id !== filtroTurma) return false
    if (filtroAno && aluno.ano_escolar_id !== filtroAno) return false
    if (filtroStatus === 'ativo' && !aluno.active) return false
    if (filtroStatus === 'inativo' && aluno.active) return false
    return true
  })

  // Estatísticas
  const totalAlunos = alunos.length
  const alunosAtivos = alunos.filter(a => a.active).length
  const alunosInativos = alunos.filter(a => !a.active).length
  const turmasComAlunos = new Set(alunos.filter(a => a.turma_id).map(a => a.turma_id)).size

  const filtrosAtivos = !!(filtroTurma || filtroAno || filtroStatus)

  if (loading || loadingAlunos) {
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
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin-escola">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Alunos</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Cadastre e gerencie os alunos da escola
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin-escola/alunos/novo">
            <Plus className="w-4 h-4 mr-2" />
            Novo Aluno
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {totalAlunos}
              </div>
              <Users className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {alunosAtivos}
              </div>
              <Users className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Alunos Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-orange-600">
                {alunosInativos}
              </div>
              <Users className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Turmas com Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {turmasComAlunos}
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os alunos por turma, ano escolar ou status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Turma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turma
              </label>
              <select
                value={filtroTurma}
                onChange={(e) => setFiltroTurma(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as turmas</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Ano Escolar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ano Escolar
              </label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os anos</option>
                {anosEscolares.map((ano) => (
                  <option key={ano.id} value={ano.id}>
                    {ano.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </div>

          {filtrosAtivos && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltroTurma('')
                  setFiltroAno('')
                  setFiltroStatus('')
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      {alunosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum aluno encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              {alunos.length === 0
                ? 'Cadastre o primeiro aluno para começar'
                : 'Nenhum aluno corresponde aos filtros selecionados'}
            </p>
            {alunos.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/admin-escola/alunos/novo">
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alunosFiltrados.map((aluno) => (
            <Card key={aluno.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                        {aluno.icone_afinidade === 'dog' && '🐕'}
                        {aluno.icone_afinidade === 'cat' && '🐱'}
                        {aluno.icone_afinidade === 'fruit' && '🍎'}
                        {aluno.icone_afinidade === 'flower' && '🌸'}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {aluno.full_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                            PIN: {aluno.pin_code}
                          </span>
                          {aluno.turma_nome && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                              {aluno.turma_nome}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded ${
                            aluno.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {aluno.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-3">
                      {aluno.numero_matricula && (
                        <div>
                          <span className="font-medium">Matrícula:</span>{' '}
                          {aluno.numero_matricula}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Pontos:</span>{' '}
                        {aluno.pontos_totais}
                      </div>
                      <div>
                        <span className="font-medium">Nível:</span>{' '}
                        {aluno.nivel}
                      </div>
                      {aluno.nome_responsavel && (
                        <div>
                          <span className="font-medium">Responsável:</span>{' '}
                          {aluno.nome_responsavel}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      title="Ver Perfil"
                    >
                      <Link href={`/meu-perfil?aluno_id=${aluno.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/admin-escola/alunos/${aluno.id}/editar`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(aluno.id, aluno.full_name)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informação de filtros */}
      {filtrosAtivos && alunosFiltrados.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Exibindo {alunosFiltrados.length} de {alunos.length} alunos
        </div>
      )}
    </div>
  )
}
