'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus, Users, Mail, GraduationCap, MoreVertical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'

interface Professor {
  id: string
  email: string
  full_name: string
  active: boolean
  created_at: string
  _count?: {
    turmas: number
  }
}

export default function ProfessoresPage() {
  const { user, loading } = useAuth()
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loadingProfessores, setLoadingProfessores] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadProfessores()
  }, [user])

  const loadProfessores = async () => {
    if (!user?.tenant_id) return

    try {
      setLoadingProfessores(true)

      // Buscar professores
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, active, created_at')
        .eq('tenant_id', user.tenant_id)
        .eq('role', 'professor')
        .order('full_name')

      if (error) {
        console.error('Erro ao carregar professores:', error)
        toast.error('Erro ao carregar professores')
        return
      }

      // Para cada professor, contar turmas
      const professoresComCount = await Promise.all(
        (data || []).map(async (prof) => {
          const { count } = await supabase
            .from('turmas')
            .select('*', { count: 'exact', head: true })
            .eq('professor_id', prof.id)

          return {
            ...prof,
            _count: { turmas: count || 0 }
          }
        })
      )

      setProfessores(professoresComCount)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar professores')
    } finally {
      setLoadingProfessores(false)
    }
  }

  const handleToggleActive = async (professorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !currentStatus })
        .eq('id', professorId)

      if (error) throw error

      toast.success(currentStatus ? 'Professor desativado' : 'Professor ativado')
      loadProfessores()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do professor')
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
            <h1 className="text-3xl font-bold text-gray-900">Professores</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os professores da escola
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin-escola/professores/novo">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Professor
          </Link>
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Professores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {professores.length}
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
            <div className="text-3xl font-bold text-green-600">
              {professores.filter(p => p.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Turmas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {professores.reduce((acc, p) => acc + (p._count?.turmas || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Professores */}
      {loadingProfessores ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando professores...</p>
        </div>
      ) : professores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum professor cadastrado
            </h3>
            <p className="text-gray-600 mb-4">
              Adicione o primeiro professor para começar
            </p>
            <Button asChild>
              <Link href="/dashboard/admin-escola/professores/novo">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Professor
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {professores.map((professor) => (
            <Card key={professor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {professor.full_name || 'Sem nome'}
                        </h3>
                        {!professor.active && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{professor.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          <span>{professor._count?.turmas || 0} turmas</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Cadastrado em: {new Date(professor.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(professor.id, professor.active)}
                    >
                      {professor.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/admin-escola/professores/${professor.id}`}>
                        Ver Detalhes
                      </Link>
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

