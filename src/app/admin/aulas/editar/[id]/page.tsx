'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, X, Save, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Aula {
  id: string
  titulo: string
  descricao: string | null
  ano_escolar_id: string | null
  disciplina_id: string | null
  ano_nome: string | null
  disciplina_codigo: string | null
  disciplina_nome: string | null
  blocos_ids: string[] | null
}

interface AnoEscolar {
  id: string
  nome: string
  descricao: string
}

interface Disciplina {
  id: string
  codigo: string
  nome: string
  cor_hex: string
}

interface BlocoTemplate {
  id: string
  codigo_bloco: string
  titulo: string
  pontos_bloco: number
  disciplinas?: {
    codigo: string
    nome: string
  } | null
}

export default function EditarAulaPage() {
  const router = useRouter()
  const params = useParams()
  const aulaId = params?.id as string

  const [aula, setAula] = useState<Aula | null>(null)
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [blocosDisponiveis, setBlocosDisponiveis] = useState<BlocoTemplate[]>([])
  const [blocosSelecionados, setBlocosSelecionados] = useState<BlocoTemplate[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loadingBlocos, setLoadingBlocos] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (aulaId) {
      loadAnosEscolares()
      loadAula()
      loadDisciplinas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId])

  useEffect(() => {
    if (aula?.ano_escolar_id) {
      loadBlocosDisponiveis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aula?.ano_escolar_id])

  const loadAula = async () => {
    try {
      setLoading(true)
      const { data: aulas, error } = await supabase.rpc('get_aulas_with_relations_admin')
      
      if (error) throw error

      const aulaEncontrada = aulas?.find((a: Aula) => a.id === aulaId)
      
      if (!aulaEncontrada) {
        toast.error('Aula não encontrada')
        router.push('/admin/aulas')
        return
      }

      setAula(aulaEncontrada)

      // Carregar blocos selecionados
      if (aulaEncontrada.blocos_ids && aulaEncontrada.blocos_ids.length > 0) {
        const { data: blocos, error: blocosError } = await supabase
          .from('blocos_templates')
          .select('id, codigo_bloco, titulo, pontos_bloco, disciplinas(codigo, nome)')
          .in('id', aulaEncontrada.blocos_ids)

        if (!blocosError && blocos) {
          // Ordenar blocos conforme a ordem em blocos_ids
          const blocosOrdenados: BlocoTemplate[] = []
          
          for (const id of aulaEncontrada.blocos_ids) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bloco = blocos.find((b: any) => b.id === id)
            if (bloco) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const disc = bloco.disciplinas as any
              blocosOrdenados.push({
                id: bloco.id,
                codigo_bloco: bloco.codigo_bloco,
                titulo: bloco.titulo,
                pontos_bloco: bloco.pontos_bloco,
                disciplinas: disc && typeof disc === 'object' && !Array.isArray(disc) ? disc : null
              } as BlocoTemplate)
            }
          }

          setBlocosSelecionados(blocosOrdenados)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar aula:', error)
      toast.error('Erro ao carregar aula')
      router.push('/admin/aulas')
    } finally {
      setLoading(false)
    }
  }

  const loadAnosEscolares = async () => {
    try {
      const { data, error } = await supabase.rpc('get_anos_escolares')
      
      if (error) {
        console.error('Erro ao carregar anos escolares:', error)
        return
      }
      
      setAnosEscolares(data || [])
    } catch (error) {
      console.error('Erro ao carregar anos escolares:', error)
    }
  }

  const loadDisciplinas = async () => {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, codigo, nome, cor_hex')
        .eq('ativa', true)
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

  const loadBlocosDisponiveis = async () => {
    if (!aula?.ano_escolar_id) return

    try {
      setLoadingBlocos(true)
      const { data, error } = await supabase.rpc('get_blocos_with_relations_admin')
      
      if (error) throw error

      const blocosFiltrados = (data || []).filter((b: BlocoTemplate & { ano_escolar_id?: string }) => 
        b.ano_escolar_id === aula.ano_escolar_id
      )
      
      setBlocosDisponiveis(blocosFiltrados)
    } catch (error) {
      console.error('Erro ao carregar blocos:', error)
      toast.error('Erro ao carregar blocos')
    } finally {
      setLoadingBlocos(false)
    }
  }

  const handleAdicionarBloco = (bloco: BlocoTemplate) => {
    if (!blocosSelecionados.find(b => b.id === bloco.id)) {
      setBlocosSelecionados([...blocosSelecionados, bloco])
    }
  }

  const handleRemoverBloco = (blocoId: string) => {
    setBlocosSelecionados(blocosSelecionados.filter(b => b.id !== blocoId))
  }

  const handleMoverBloco = (index: number, direction: 'up' | 'down') => {
    const newBlocos = [...blocosSelecionados]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newBlocos.length) return
    
    // Swap com verificação de tipo
    const temp = newBlocos[index]
    const target = newBlocos[targetIndex]
    if (temp && target) {
      newBlocos[index] = target
      newBlocos[targetIndex] = temp
      setBlocosSelecionados(newBlocos)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!aula) return

    if (blocosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um bloco')
      return
    }

    try {
      setSaving(true)

      // Atualizar informações da aula (apenas campos que existem na interface simplificada)
      const { error: updateError } = await supabase
        .from('aulas')
        .update({
          titulo: aula.titulo,
          descricao: aula.descricao
        })
        .eq('id', aulaId)

      if (updateError) throw updateError

      // Atualizar blocos via RPC
      const { data, error: blocosError } = await supabase.rpc('update_aula_blocos_admin', {
        p_aula_id: aulaId,
        p_blocos_ids: blocosSelecionados.map(b => b.id)
      })

      if (blocosError) throw blocosError

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erro ao atualizar blocos')
      }

      toast.success('Aula atualizada com sucesso!')
      router.push('/admin/aulas')
      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar aula:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar aula')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja deletar esta aula? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)

      const { data, error } = await supabase.rpc('delete_aula_admin', {
        p_aula_id: aulaId
      })

      if (error) throw error

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erro ao deletar aula')
      }

      toast.success('Aula deletada com sucesso!')
      router.push('/admin/aulas')
      router.refresh()
    } catch (error) {
      console.error('Erro ao deletar aula:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar aula')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!aula) {
    return (
      <div className="text-center py-12">
        <p>Aula não encontrada</p>
      </div>
    )
  }

  // Filtrar blocos disponíveis
  const blocosFiltrados = blocosDisponiveis.filter(bloco => {
    const matchSearch = !searchTerm || 
      bloco.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bloco.codigo_bloco.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchDisciplina = !filtroDisciplina || 
      bloco.disciplinas?.codigo === filtroDisciplina

    const naoSelecionado = !blocosSelecionados.find(b => b.id === bloco.id)

    return matchSearch && matchDisciplina && naoSelecionado
  })

  const pontosTotais = blocosSelecionados.reduce((sum, b) => sum + (b.pontos_bloco || 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold text-slate-900">Editar Aula</h1>
              {aula.ano_nome && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                  {aula.ano_nome}
                </span>
              )}
              {aula.disciplina_codigo && (
                <span
                  className="px-2 py-1 rounded text-sm font-semibold text-white"
                  style={{ backgroundColor: disciplinas.find(d => d.codigo === aula.disciplina_codigo)?.cor_hex || '#64748b' }}
                >
                  {aula.disciplina_codigo}
                </span>
              )}
            </div>
            <p className="text-slate-600">Atualize as informações e blocos da aula</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? 'Deletando...' : 'Deletar Aula'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Título da Aula *
              </label>
              <input
                type="text"
                value={aula.titulo}
                onChange={(e) => setAula({ ...aula, titulo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrição
              </label>
              <textarea
                value={aula.descricao || ''}
                onChange={(e) => setAula({ ...aula, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva os objetivos e conteúdo da aula..."
              />
            </div>

            {/* Info: Ano e Disciplina */}
            {(aula.ano_nome || aula.disciplina_nome) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  📊 Ano e Disciplina da Aula
                </h3>
                <div className="flex flex-wrap gap-3">
                  {aula.ano_nome && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md">
                      <span className="text-xs font-medium text-slate-600">Ano:</span>
                      <span className="text-sm font-semibold text-blue-700">{aula.ano_nome}</span>
                    </div>
                  )}
                  {aula.disciplina_nome && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md">
                      <span className="text-xs font-medium text-slate-600">Disciplina:</span>
                      <span
                        className="text-sm font-semibold px-2 py-1 rounded text-white"
                        style={{ backgroundColor: disciplinas.find(d => d.codigo === aula.disciplina_codigo)?.cor_hex || '#64748b' }}
                      >
                        {aula.disciplina_nome}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  ℹ️ Baseado nos blocos vinculados. Para alterar, selecione blocos de outro ano ou disciplina.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Seleção de Blocos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blocos Disponíveis */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Blocos Disponíveis ({blocosFiltrados.length})
            </h2>

            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar blocos..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filtroDisciplina}
                onChange={(e) => setFiltroDisciplina(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as disciplinas</option>
                {disciplinas.map(disc => (
                  <option key={disc.id} value={disc.codigo}>{disc.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingBlocos ? (
                <p className="text-slate-500 text-center py-8">Carregando blocos...</p>
              ) : blocosFiltrados.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhum bloco encontrado</p>
              ) : (
                blocosFiltrados.map((bloco) => (
                  <div
                    key={bloco.id}
                    className="border border-slate-200 rounded-lg p-3 hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => handleAdicionarBloco(bloco)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{bloco.titulo}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {bloco.codigo_bloco} • {bloco.pontos_bloco} pts
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdicionarBloco(bloco)
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Blocos Selecionados */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Blocos Selecionados ({blocosSelecionados.length} blocos • {pontosTotais} pts)
            </h2>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {blocosSelecionados.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nenhum bloco selecionado
                </p>
              ) : (
                blocosSelecionados.map((bloco, index) => (
                  <div
                    key={bloco.id}
                    className="border border-slate-200 rounded-lg p-3 bg-blue-50"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoverBloco(index, 'up')}
                          disabled={index === 0}
                          className="h-6 px-2"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoverBloco(index, 'down')}
                          disabled={index === blocosSelecionados.length - 1}
                          className="h-6 px-2"
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {index + 1}. {bloco.titulo}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {bloco.codigo_bloco} • {bloco.pontos_bloco} pts
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoverBloco(bloco.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
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
            disabled={saving || blocosSelecionados.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}

