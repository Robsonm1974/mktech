'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, BookOpen, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface AnoEscolar {
  id: string
  nome: string
  descricao: string
  idade_referencia: number
}

interface Aula {
  id: string
  trilha_id: string
  titulo: string
  descricao: string | null
  ordem: number
  created_at: string
  total_blocos: number
  blocos_ids: string[] | null
  ano_escolar_id: string | null
  disciplina_id: string | null
  ano_nome: string | null
  disciplina_codigo: string | null
  disciplina_nome: string | null
}

interface Disciplina {
  id: string
  codigo: string
  nome: string
  cor_hex: string
}

type ViewMode = 'anos' | 'lista'

export default function AulasPage() {
  const router = useRouter()
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAnos, setLoadingAnos] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('anos')
  const [filtroAno, setFiltroAno] = useState<string | null>(null)
  const [filtroDisciplina, setFiltroDisciplina] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadAnosEscolares()
    loadDisciplinas()
    loadAulas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAnosEscolares = async () => {
    try {
      setLoadingAnos(true)
      const { data, error } = await supabase.rpc('get_anos_escolares')
      
      if (error) {
        console.error('Erro ao carregar anos escolares:', error)
        toast.error('Erro ao carregar anos escolares')
        return
      }

      setAnosEscolares(data || [])
    } catch (error) {
      console.error('Erro ao carregar anos escolares:', error)
      toast.error('Erro ao carregar anos escolares')
    } finally {
      setLoadingAnos(false)
    }
  }

  const loadDisciplinas = async () => {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, codigo, nome, cor_hex')
        .order('nome')
      
      if (error) {
        console.error('Erro ao carregar disciplinas:', error)
        return
      }

      setDisciplinas(data || [])
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error)
    }
  }

  const loadAulas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.rpc('get_aulas_with_relations_admin')
      
      if (error) {
        console.error('Erro ao carregar aulas:', error)
        setError('Erro ao carregar aulas')
        toast.error('Erro ao carregar aulas')
        return
      }

      setAulas(data || [])
    } catch (error) {
      console.error('Erro ao carregar aulas:', error)
      setError('Erro ao carregar aulas')
      toast.error('Erro ao carregar aulas')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar aulas
  const aulasFiltradas = aulas.filter(aula => {
    if (filtroAno && aula.ano_escolar_id !== filtroAno) return false
    if (filtroDisciplina && aula.disciplina_id !== filtroDisciplina) return false
    return true
  })

  // Agrupar por ano
  const aulasPorAno = anosEscolares.map(ano => {
    const aulasDoAno = aulasFiltradas.filter(a => a.ano_escolar_id === ano.id)
    return {
      ano,
      aulas: aulasDoAno,
      total: aulasDoAno.length
    }
  }).filter(grupo => grupo.total > 0)

  const totalAulas = aulas.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestão de Aulas</h1>
          <p className="text-slate-600 mt-1">
            Crie aulas combinando blocos templates • Total: {totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/admin/aulas/criar')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Aula
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await Promise.all([loadAnosEscolares(), loadDisciplinas(), loadAulas()])
            }}
            disabled={loading || loadingAnos}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || loadingAnos ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Controles de Visualização e Filtros */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Toggle View Mode */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'anos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('anos')}
            >
              Por Ano
            </Button>
            <Button
              variant={viewMode === 'lista' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('lista')}
            >
              Lista Completa
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-1">
            {/* Filtro Ano */}
            <select
              value={filtroAno || ''}
              onChange={(e) => setFiltroAno(e.target.value || null)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm flex-1 max-w-[200px]"
            >
              <option value="">Todos os Anos</option>
              {anosEscolares.map(ano => (
                <option key={ano.id} value={ano.id}>
                  {ano.nome}
                </option>
              ))}
            </select>

            {/* Filtro Disciplina */}
            <select
              value={filtroDisciplina || ''}
              onChange={(e) => setFiltroDisciplina(e.target.value || null)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm flex-1 max-w-[200px]"
            >
              <option value="">Todas as Disciplinas</option>
              {disciplinas.map(disc => (
                <option key={disc.id} value={disc.id}>
                  {disc.nome}
                </option>
              ))}
            </select>

            {/* Limpar Filtros */}
            {(filtroAno || filtroDisciplina) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiltroAno(null)
                  setFiltroDisciplina(null)
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {(loading || loadingAnos) && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Content */}
      {!loading && !loadingAnos && (
        <>
          {aulas.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 text-lg font-medium">Nenhuma aula encontrada</p>
              <p className="text-slate-500 text-sm mt-1">
                Crie sua primeira aula para começar
              </p>
            </div>
          ) : aulasFiltradas.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 text-lg font-medium">Nenhuma aula encontrada com esses filtros</p>
              <p className="text-slate-500 text-sm mt-1">
                Tente ajustar os filtros ou limpar a seleção
              </p>
            </div>
          ) : (
            <>
              {/* Modo: Agrupado por Ano */}
              {viewMode === 'anos' && (
                <div className="space-y-6">
                  {aulasPorAno.map(({ ano, aulas: aulasDoAno, total }) => (
                    <div key={ano.id} className="bg-white border border-slate-200 rounded-lg p-6">
                      {/* Header do Ano */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900">{ano.nome}</h2>
                          <p className="text-slate-600 text-sm">{total} {total === 1 ? 'aula' : 'aulas'}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/admin/aulas/criar?ano=${ano.id}`)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nova Aula para {ano.nome}
                        </Button>
                      </div>

                      {/* Lista de Aulas do Ano */}
                      <div className="grid grid-cols-1 gap-3">
                        {aulasDoAno.map((aula) => (
                          <div
                            key={aula.id}
                            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-slate-900">
                                    {aula.titulo}
                                  </h3>
                                  {aula.disciplina_codigo && (
                                    <span
                                      className="px-2 py-1 rounded text-xs font-semibold text-white"
                                      style={{ backgroundColor: disciplinas.find(d => d.codigo === aula.disciplina_codigo)?.cor_hex || '#64748b' }}
                                    >
                                      {aula.disciplina_codigo}
                                    </span>
                                  )}
                                </div>
                                {aula.descricao && (
                                  <p className="text-slate-600 text-sm mb-2">{aula.descricao}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{aula.total_blocos} blocos</span>
                                  </div>
                                  {aula.disciplina_nome && (
                                    <div className="flex items-center gap-1">
                                      <span>•</span>
                                      <span>{aula.disciplina_nome}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{new Date(aula.created_at).toLocaleDateString('pt-BR')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/admin/aulas/${aula.id}`)}
                                >
                                  Detalhes
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/admin/aulas/editar/${aula.id}`)}
                                >
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modo: Lista Completa */}
              {viewMode === 'lista' && (
                <div className="grid grid-cols-1 gap-4">
                  {aulasFiltradas.map((aula) => (
                    <div
                      key={aula.id}
                      className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-slate-900">
                              {aula.titulo}
                            </h3>
                            {aula.ano_nome && (
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                {aula.ano_nome}
                              </span>
                            )}
                            {aula.disciplina_codigo && (
                              <span
                                className="px-2 py-1 rounded text-xs font-semibold text-white"
                                style={{ backgroundColor: disciplinas.find(d => d.codigo === aula.disciplina_codigo)?.cor_hex || '#64748b' }}
                              >
                                {aula.disciplina_codigo}
                              </span>
                            )}
                          </div>
                          {aula.descricao && (
                            <p className="text-slate-600 mb-3">{aula.descricao}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{aula.total_blocos} blocos</span>
                            </div>
                            {aula.disciplina_nome && (
                              <div className="flex items-center gap-1">
                                <span>•</span>
                                <span>{aula.disciplina_nome}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(aula.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/aulas/${aula.id}`)}
                          >
                            Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/aulas/editar/${aula.id}`)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
