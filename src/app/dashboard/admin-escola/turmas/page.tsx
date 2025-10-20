'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus, GraduationCap, Users, Trash2, Edit, School } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'

interface Turma {
  id: string
  tenant_id: string
  name: string
  ano_escolar_id: string
  ano_nome: string
  designacao: string | null
  professor_id: string
  professor_nome: string
  professor_email: string
  sala: string | null
  turno: string | null
  descricao: string | null
  total_alunos: number
  created_at: string
  updated_at: string
}

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

export default function TurmasPage() {
  const { user, loading } = useAuth()
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [filtroAno, setFiltroAno] = useState<string>('')
  const [filtroProfessor, setFiltroProfessor] = useState<string>('')
  const [filtroTurno, setFiltroTurno] = useState<string>('')
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (user?.tenant_id) {
      loadTurmas()
      loadAnosEscolares()
      loadProfessores()
    }
  }, [user])

  const loadTurmas = async () => {
    if (!user?.tenant_id) {
      console.log('❌ Sem tenant_id')
      return
    }

    try {
      setLoadingTurmas(true)
      
      console.log('🔍 Carregando turmas para tenant:', user.tenant_id)
      
      // MÉTODO 1: Usar query direta (fallback)
      const { data: turmasDiretas, error: erroDireto } = await supabase
        .from('turmas')
        .select(`
          *,
          anos_escolares:ano_escolar_id (
            nome
          ),
          users:professor_id (
            full_name,
            email
          )
        `)
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false })

      console.log('📊 Query direta:', { data: turmasDiretas, error: erroDireto })

      if (erroDireto) {
        console.error('❌ Erro na query direta:', erroDireto)
        toast.error(`Erro: ${erroDireto.message}`)
        return
      }

      // Transformar dados para o formato esperado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const turmasFormatadas = (turmasDiretas || []).map((t: Record<string, any>) => ({
        id: t.id as string,
        tenant_id: t.tenant_id as string,
        name: t.name as string,
        ano_escolar_id: t.ano_escolar_id as string,
        ano_nome: (t.anos_escolares?.nome as string) || '',
        designacao: t.designacao as string | null,
        professor_id: t.professor_id as string,
        professor_nome: (t.users?.full_name as string) || '',
        professor_email: (t.users?.email as string) || '',
        sala: t.sala as string | null,
        turno: t.turno as string | null,
        descricao: t.descricao as string | null,
        total_alunos: 0, // Vamos buscar depois
        created_at: t.created_at as string,
        updated_at: t.updated_at as string
      }))

      console.log('✅ Turmas carregadas:', turmasFormatadas.length)
      setTurmas(turmasFormatadas)
      
    } catch (error) {
      console.error('❌ Exception ao carregar turmas:', error)
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A')
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro: ${errorMessage}`)
    } finally {
      setLoadingTurmas(false)
    }
  }

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
    }
  }

  const handleDelete = async (turmaId: string, nomeTurma: string, totalAlunos: number) => {
    if (totalAlunos > 0) {
      toast.error(`Não é possível excluir. A turma "${nomeTurma}" possui ${totalAlunos} alunos ativos.`)
      return
    }

    if (!confirm(`Confirma a exclusão da turma "${nomeTurma}"?`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('delete_turma_admin', {
        p_turma_id: turmaId
      })

      if (error) throw error

      if (data?.success) {
        toast.success('Turma excluída com sucesso!')
        loadTurmas()
      } else {
        toast.error(data?.message || 'Erro ao excluir turma')
      }
    } catch (error) {
      console.error('Erro ao excluir turma:', error)
      toast.error('Erro ao excluir turma')
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

  // Filtrar turmas
  const turmasFiltradas = turmas.filter(turma => {
    if (filtroAno && turma.ano_escolar_id !== filtroAno) return false
    if (filtroProfessor && turma.professor_id !== filtroProfessor) return false
    if (filtroTurno && turma.turno !== filtroTurno) return false
    return true
  })

  const totalAlunos = turmas.reduce((acc, t) => acc + t.total_alunos, 0)
  const professoresAtivos = new Set(turmas.map(t => t.professor_id).filter(Boolean)).size

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/admin-escola">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Turmas</h1>
            <p className="text-gray-600 mt-1">
              Gerencie as turmas da escola
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin-escola/turmas/nova">
            <Plus className="w-4 h-4 mr-2" />
            Nova Turma
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-600">
                {turmas.length}
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {totalAlunos}
              </div>
              <Users className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Professores Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">
                {professoresAtivos}
              </div>
              <School className="h-8 w-8 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ano Escolar
              </label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {anosEscolares.map((ano) => (
                  <option key={ano.id} value={ano.id}>
                    {ano.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professor
              </label>
              <select
                value={filtroProfessor}
                onChange={(e) => setFiltroProfessor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                {professores.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turno
              </label>
              <select
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Integral">Integral</option>
              </select>
            </div>
          </div>

          {(filtroAno || filtroProfessor || filtroTurno) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltroAno('')
                  setFiltroProfessor('')
                  setFiltroTurno('')
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Turmas */}
      {loadingTurmas ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando turmas...</p>
        </div>
      ) : turmasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma turma encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {turmas.length === 0
                ? 'Crie a primeira turma para começar'
                : 'Nenhuma turma corresponde aos filtros selecionados'}
            </p>
            {turmas.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/admin-escola/turmas/nova">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Turma
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {turmasFiltradas.map((turma) => (
            <Card key={turma.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {turma.name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        {turma.ano_nome}
                      </span>
                      {turma.turno && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {turma.turno}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
                      <div>
                        <span className="font-medium">Professor:</span>{' '}
                        {turma.professor_nome}
                      </div>
                      <div>
                        <span className="font-medium">Alunos:</span>{' '}
                        {turma.total_alunos}
                      </div>
                      {turma.sala && (
                        <div>
                          <span className="font-medium">Sala:</span>{' '}
                          {turma.sala}
                        </div>
                      )}
                      {turma.designacao && (
                        <div>
                          <span className="font-medium">Designação:</span>{' '}
                          {turma.designacao}
                        </div>
                      )}
                    </div>

                    {turma.descricao && (
                      <p className="text-sm text-gray-500 mt-2">
                        {turma.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/admin-escola/turmas/${turma.id}/editar`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(turma.id, turma.name, turma.total_alunos)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
