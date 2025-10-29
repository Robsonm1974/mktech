'use client'

import { useEffect, useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, X, Save, Search, Gamepad2 } from 'lucide-react'
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
  }[] | null
  ano_escolar_id?: string | null
}

// 🎮 NOVO: Interface para Jogos
interface Game {
  id: string
  codigo: string
  titulo: string
  descricao: string | null
  duracao_segundos: number
  publicado: boolean
  ano_escolar_id?: string | null
  disciplina_id?: string | null
}

// 🎮 NOVO: Tipo unificado para Blocos + Jogos
type ItemAula = {
  tipo: 'bloco' | 'jogo'
  id: string
  ordem: number
  dados: BlocoTemplate | Game
}

const TRILHA_PADRAO_ID = '00000000-0000-0000-0000-000000000001'

function CriarAulaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const anoParam = searchParams?.get('ano')
  
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [blocosDisponiveis, setBlocosDisponiveis] = useState<BlocoTemplate[]>([])
  
  // 🎮 NOVO: Estado para jogos
  const [jogosDisponiveis, setJogosDisponiveis] = useState<Game[]>([])
  const [loadingJogos, setLoadingJogos] = useState(false)
  
  // 🎮 NOVO: Estado unificado (substitui blocosSelecionados)
  const [itensSelecionados, setItensSelecionados] = useState<ItemAula[]>([])
  
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
  
  // 🎮 NOVO: Filtros para jogos
  const [searchTermJogos, setSearchTermJogos] = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadAnosEscolares()
    loadDisciplinas()
    loadBlocosDisponiveis()
    loadJogosDisponiveis() // 🎮 NOVO
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

  // 🎮 NOVO: Carregar jogos disponíveis
  const loadJogosDisponiveis = async () => {
    try {
      setLoadingJogos(true)
      const { data, error } = await supabase
        .from('games')
        .select('id, codigo, titulo, descricao, duracao_segundos, publicado, ano_escolar_id, disciplina_id')
        .eq('publicado', true)
        .order('titulo')
      
      if (error) {
        console.error('Erro ao carregar jogos:', error)
        return
      }
      
      setJogosDisponiveis(data || [])
      console.log('🎮 Jogos carregados:', data?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar jogos:', error)
    } finally {
      setLoadingJogos(false)
    }
  }

  // 🎮 NOVO: Adicionar bloco
  const handleAdicionarBloco = (bloco: BlocoTemplate) => {
    if (itensSelecionados.find(item => item.id === bloco.id && item.tipo === 'bloco')) {
      return // Já selecionado
    }
    
    const novaOrdem = itensSelecionados.length + 1
    setItensSelecionados([
      ...itensSelecionados,
      { tipo: 'bloco', id: bloco.id, ordem: novaOrdem, dados: bloco }
    ])
  }

  // 🎮 NOVO: Adicionar jogo
  const handleAdicionarJogo = (jogo: Game) => {
    if (itensSelecionados.find(item => item.id === jogo.id && item.tipo === 'jogo')) {
      return // Já selecionado
    }
    
    const novaOrdem = itensSelecionados.length + 1
    setItensSelecionados([
      ...itensSelecionados,
      { tipo: 'jogo', id: jogo.id, ordem: novaOrdem, dados: jogo }
    ])
  }

  // 🎮 NOVO: Remover item
  const handleRemoverItem = (id: string, tipo: 'bloco' | 'jogo') => {
    const novosItens = itensSelecionados
      .filter(item => !(item.id === id && item.tipo === tipo))
      .map((item, index) => ({ ...item, ordem: index + 1 })) // Recalcular ordens
    
    setItensSelecionados(novosItens)
  }

  // 🎮 NOVO: Mover item
  const handleMoverItem = (index: number, direction: 'up' | 'down') => {
    const novosItens = [...itensSelecionados]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= novosItens.length) return

    // Verificar se ambos os elementos existem
    const itemAtual = novosItens[index]
    const itemTarget = novosItens[targetIndex]

    if (!itemAtual || !itemTarget) return

    // Swap
    novosItens[index] = itemTarget
    novosItens[targetIndex] = itemAtual

    // Recalcular ordens
    novosItens.forEach((item, i) => item.ordem = i + 1)

    setItensSelecionados(novosItens)
  }

  // 🎮 ATUALIZADO: Submit com novo RPC
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!form.titulo.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    if (itensSelecionados.length === 0) {
      toast.error('Selecione pelo menos um bloco ou jogo')
      return
    }

    try {
      setLoading(true)

      // Preparar array JSONB para o RPC
      const itensParaRPC = itensSelecionados.map(item => ({
        tipo: item.tipo,
        id: item.id,
        ordem: item.ordem
      }))

      console.log('📤 Enviando dados para criar aula:', {
        p_trilha_id: TRILHA_PADRAO_ID,
        p_titulo: form.titulo,
        p_descricao: form.descricao || null,
        p_itens: itensParaRPC
      })

      // 🎮 NOVO RPC: insert_aula_with_itens_admin
      const { data, error } = await supabase.rpc('insert_aula_with_itens_admin', {
        p_trilha_id: TRILHA_PADRAO_ID,
        p_titulo: form.titulo,
        p_descricao: form.descricao || null,
        p_itens: itensParaRPC
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
      (bloco.disciplinas && Array.isArray(bloco.disciplinas) ?
        bloco.disciplinas.some(d => d.codigo === filtroDisciplina) :
        (bloco.disciplinas as { codigo: string } | null)?.codigo === filtroDisciplina)

    const matchAno = !filtroAno || 
      bloco.ano_escolar_id === filtroAno

    const naoSelecionado = !itensSelecionados.find(item => item.id === bloco.id && item.tipo === 'bloco')

    return matchSearch && matchDisciplina && matchAno && naoSelecionado
  })

  // 🎮 NOVO: Filtrar jogos disponíveis
  const jogosFiltrados = jogosDisponiveis.filter(jogo => {
    const matchSearch = !searchTermJogos || 
      jogo.titulo.toLowerCase().includes(searchTermJogos.toLowerCase()) ||
      jogo.codigo.toLowerCase().includes(searchTermJogos.toLowerCase())
    
    const naoSelecionado = !itensSelecionados.find(item => item.id === jogo.id && item.tipo === 'jogo')

    return matchSearch && naoSelecionado
  })

  // 🎮 ATUALIZADO: Calcular pontos totais (apenas blocos)
  const pontosTotais = itensSelecionados
    .filter(item => item.tipo === 'bloco')
    .reduce((sum, item) => sum + ((item.dados as BlocoTemplate).pontos_bloco || 0), 0)

  // Detectar ano e disciplina automaticamente do primeiro bloco
  const primeiroBloco = itensSelecionados.find(item => item.tipo === 'bloco')
  const blocoReferencia = primeiroBloco?.dados as BlocoTemplate | undefined
  const anoDetectado = blocoReferencia?.ano_escolar_id 
    ? anosEscolares.find(a => a.id === blocoReferencia.ano_escolar_id)
    : null
  const disciplinaDetectada = (() => {
    if (!blocoReferencia || !blocoReferencia.disciplinas) return null
    if (Array.isArray(blocoReferencia.disciplinas)) {
      const first = blocoReferencia.disciplinas[0]
      if (!first) return null
      return disciplinas.find(d => d.codigo === first.codigo) || null
    }
    const unica = blocoReferencia.disciplinas as { codigo?: string } | null
    if (!unica || !unica.codigo) return null
    return disciplinas.find(d => d.codigo === unica.codigo) || null
  })()

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
          <p className="text-slate-600 mt-1">Selecione blocos e jogos para compor a aula</p>
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
            {itensSelecionados.length > 0 && (anoDetectado || disciplinaDetectada) && (
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

        {/* 🎮 NOVO: Seleção de Blocos + Jogos (3 colunas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Blocos Disponíveis */}
          <div className="bg-white border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              📄 Blocos Disponíveis
              <span className="text-sm font-normal text-slate-600 ml-2">
                ({blocosFiltrados.length})
              </span>
            </h2>
            
            {/* Filtros */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar blocos..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <select
                value={filtroDisciplina}
                onChange={(e) => setFiltroDisciplina(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Todas as disciplinas</option>
                {disciplinas.map(disc => (
                  <option key={disc.id} value={disc.codigo}>{disc.nome}</option>
                ))}
              </select>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              >
                <option value="">Todos os anos</option>
                {anosEscolares.map(ano => (
                  <option key={ano.id} value={ano.id}>{ano.nome}</option>
                ))}
              </select>
            </div>

            {/* Lista de Blocos */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingBlocos ? (
                <p className="text-slate-500 text-center py-8 text-sm">Carregando...</p>
              ) : blocosFiltrados.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Nenhum bloco encontrado</p>
              ) : (
                blocosFiltrados.map((bloco) => (
                  <div
                    key={bloco.id}
                    className="border border-blue-200 rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => handleAdicionarBloco(bloco)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{bloco.titulo}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          {bloco.pontos_bloco} pts
                          {Array.isArray(bloco.disciplinas) && bloco.disciplinas.length > 0 && bloco.disciplinas[0]?.nome && ` • ${bloco.disciplinas[0].nome}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="ml-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdicionarBloco(bloco)
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 🎮 Coluna 2: Jogos Disponíveis (NOVO!) */}
          <div className="bg-white border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              🎮 Jogos Disponíveis
              <span className="text-sm font-normal text-slate-600 ml-2">
                ({jogosFiltrados.length})
              </span>
            </h2>
            
            {/* Filtros */}
            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTermJogos}
                  onChange={(e) => setSearchTermJogos(e.target.value)}
                  placeholder="Buscar jogos..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Lista de Jogos */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {loadingJogos ? (
                <p className="text-slate-500 text-center py-8 text-sm">Carregando jogos...</p>
              ) : jogosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Nenhum jogo publicado ainda</p>
                  <p className="text-xs text-slate-400 mt-1">Crie jogos na Fábrica de Jogos</p>
                </div>
              ) : (
                jogosFiltrados.map((jogo) => (
                  <div
                    key={jogo.id}
                    className="border border-green-200 rounded-lg p-3 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors"
                    onClick={() => handleAdicionarJogo(jogo)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm flex items-center gap-2">
                          <Gamepad2 className="w-3 h-3 text-green-600" />
                          {jogo.titulo}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {jogo.duracao_segundos}s
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="ml-2 bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdicionarJogo(jogo)
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna 3: Sequência da Aula (Itens Selecionados) */}
          <div className="bg-white border border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              ✨ Sequência da Aula
              <span className="text-sm font-normal text-slate-600 ml-2">
                ({itensSelecionados.length} • {pontosTotais} pts)
              </span>
            </h2>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {itensSelecionados.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-sm mb-2">Nenhum item selecionado</p>
                  <p className="text-xs text-slate-400">
                    Adicione blocos ou jogos para compor a aula
                  </p>
                </div>
              ) : (
                itensSelecionados
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((item, index) => {
                    const isBloco = item.tipo === 'bloco'
                    const dados = item.dados as BlocoTemplate | Game
                    
                    return (
                      <div
                        key={`${item.tipo}-${item.id}`}
                        className={`border rounded-lg p-3 ${
                          isBloco 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Botões ↑↓ */}
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoverItem(index, 'up')}
                              disabled={index === 0}
                              className="h-6 px-2 text-xs"
                            >
                              ↑
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleMoverItem(index, 'down')}
                              disabled={index === itensSelecionados.length - 1}
                              className="h-6 px-2 text-xs"
                            >
                              ↓
                            </Button>
                          </div>
                          
                          {/* Ícone indicando tipo */}
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-lg ${
                            isBloco ? 'bg-blue-200' : 'bg-green-200'
                          }`}>
                            {isBloco ? '📄' : '🎮'}
                          </div>
                          
                          {/* Info do item */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">
                              {index + 1}. {dados.titulo}
                            </p>
                            <p className="text-xs text-slate-600">
                              {isBloco
                                ? `${(dados as BlocoTemplate).pontos_bloco} pts`
                                : `${(dados as Game).duracao_segundos}s`
                              }
                            </p>
                          </div>
                          
                          {/* Botão remover */}
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoverItem(item.id, item.tipo)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
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
            disabled={loading || itensSelecionados.length === 0}
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

