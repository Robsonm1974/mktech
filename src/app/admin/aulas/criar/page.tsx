'use client'

import { useEffect, useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, X, Save, Search } from 'lucide-react'
import { toast } from 'sonner'

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
  conteudo_texto: string | null
  tipo_midia: string | null
  pontos_bloco: number
  status: string
  disciplinas?: {
    codigo: string
    nome: string
    cor_hex?: string
    icone?: string
  } | null
  ano_escolar_id?: string | null
}

const TRILHA_PADRAO_ID = '00000000-0000-0000-0000-000000000001'

function CriarAulaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const anoParam = searchParams?.get('ano')
  
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [blocosDisponiveis, setBlocosDisponiveis] = useState<BlocoTemplate[]>([])
  const [blocosSelecionados, setBlocosSelecionados] = useState<BlocoTemplate[]>([])
  
  const [loading, setLoading] = useState(false)
  const [loadingBlocos, setLoadingBlocos] = useState(false)
  
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    ano_escolar_id: anoParam || ''
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroAno, setFiltroAno] = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadAnosEscolares()
    loadDisciplinas()
    loadBlocosDisponiveis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAnosEscolares = async () => {
    const { data } = await supabase.rpc('get_anos_escolares')
    setAnosEscolares(data || [])
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
    try {
      setLoadingBlocos(true)
      const { data, error } = await supabase.rpc('get_blocos_with_relations_admin')
      
      if (error) {
        console.error('Erro ao carregar blocos:', error)
        toast.error('Erro ao carregar blocos')
        return
      }
      
      setBlocosDisponiveis(data || [])
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
    
    if (!form.titulo.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    if (blocosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um bloco')
      return
    }

    try {
      setLoading(true)

      console.log('📤 Enviando dados para criar aula:', {
        p_trilha_id: TRILHA_PADRAO_ID,
        p_titulo: form.titulo,
        p_descricao: form.descricao || null,
        p_blocos_ids: blocosSelecionados.map(b => b.id)
      })

      const { data, error } = await supabase.rpc('insert_aula_with_blocos_admin', {
        p_trilha_id: TRILHA_PADRAO_ID,
        p_titulo: form.titulo,
        p_descricao: form.descricao || null,
        p_blocos_ids: blocosSelecionados.map(b => b.id)
      })

      console.log('📥 Resposta do RPC:', { data, error })

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      if (!data || !data.success) {
        const errorMsg = data?.message || 'Erro ao criar aula: resposta inválida'
        console.error('❌ Resposta inválida:', data)
        throw new Error(errorMsg)
      }

      toast.success('Aula criada com sucesso!')
      router.push('/admin/aulas')
      router.refresh()
    } catch (error) {
      console.error('❌ Erro ao criar aula:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar aula')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar blocos disponíveis
  const blocosFiltrados = blocosDisponiveis.filter(bloco => {
    const matchSearch = !searchTerm || 
      bloco.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bloco.codigo_bloco.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchDisciplina = !filtroDisciplina || 
      bloco.disciplinas?.codigo === filtroDisciplina

    const matchAno = !filtroAno || 
      bloco.ano_escolar_id === filtroAno

    const naoSelecionado = !blocosSelecionados.find(b => b.id === bloco.id)

    return matchSearch && matchDisciplina && matchAno && naoSelecionado
  })

  // Calcular pontos totais
  const pontosTotais = blocosSelecionados.reduce((sum, b) => sum + (b.pontos_bloco || 0), 0)

  // Detectar ano e disciplina automaticamente do primeiro bloco
  const blocoReferencia = blocosSelecionados[0]
  const anoDetectado = blocoReferencia?.ano_escolar_id 
    ? anosEscolares.find(a => a.id === blocoReferencia.ano_escolar_id)
    : null
  const disciplinaDetectada = blocoReferencia?.disciplinas 
    ? disciplinas.find(d => d.codigo === blocoReferencia.disciplinas?.codigo)
    : null

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Criar Nova Aula</h1>
          <p className="text-slate-600 mt-1">Selecione blocos templates para compor a aula</p>
        </div>
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
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Introdução aos Algoritmos"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrição
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva os objetivos e conteúdo da aula..."
              />
            </div>

            {/* Preview Automático: Ano e Disciplina */}
            {blocosSelecionados.length > 0 && (anoDetectado || disciplinaDetectada) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  📊 Ano e Disciplina Detectados Automaticamente
                </h3>
                <div className="flex flex-wrap gap-3">
                  {anoDetectado && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md">
                      <span className="text-xs font-medium text-slate-600">Ano:</span>
                      <span className="text-sm font-semibold text-blue-700">{anoDetectado.nome}</span>
                    </div>
                  )}
                  {disciplinaDetectada && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md">
                      <span className="text-xs font-medium text-slate-600">Disciplina:</span>
                      <span
                        className="text-sm font-semibold px-2 py-1 rounded text-white"
                        style={{ backgroundColor: disciplinaDetectada.cor_hex }}
                      >
                        {disciplinaDetectada.nome}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  ℹ️ Baseado no primeiro bloco selecionado. Ao salvar, a aula será automaticamente vinculada a este ano e disciplina.
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
              Blocos Disponíveis
              <span className="text-sm font-normal text-slate-600 ml-2">
                ({blocosFiltrados.length} encontrados)
              </span>
            </h2>
              <>
                {/* Filtros */}
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
                  <select
                    value={filtroAno}
                    onChange={(e) => setFiltroAno(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os anos escolares</option>
                    {anosEscolares.map(ano => (
                      <option key={ano.id} value={ano.id}>{ano.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Lista de Blocos */}
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
                              {bloco.disciplinas?.nome && ` • ${bloco.disciplinas.nome}`}
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
              </>
          </div>

          {/* Blocos Selecionados */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Blocos Selecionados
              <span className="text-sm font-normal text-slate-600 ml-2">
                ({blocosSelecionados.length} blocos • {pontosTotais} pts)
              </span>
            </h2>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {blocosSelecionados.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nenhum bloco selecionado ainda
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
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || blocosSelecionados.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Criando...' : 'Criar Aula'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function CriarAulaPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-12"><p>Carregando...</p></div>}>
      <CriarAulaForm />
    </Suspense>
  )
}

