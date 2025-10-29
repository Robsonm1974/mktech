'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, X, Save, Search, Trash2, Gamepad2 } from 'lucide-react'
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
  pontos_bloco: number
  disciplinas?: {
    codigo: string
    nome: string
  }[] | null
  ano_escolar_id?: string | null
}

// 🎮 Interface para Jogos
interface Game {
  id: string
  codigo: string
  titulo: string
  descricao: string | null
  duracao_segundos: number
  publicado: boolean
}

// 🎮 Tipo unificado para Blocos + Jogos
type ItemAula = {
  tipo: 'bloco' | 'jogo'
  id: string
  ordem: number
  dados: BlocoTemplate | Game
}

export default function EditarAulaPage() {
  const router = useRouter()
  const params = useParams()
  const aulaId = params?.id as string

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [anoNome, setAnoNome] = useState<string | null>(null)
  const [disciplinaCodigo, setDisciplinaCodigo] = useState<string | null>(null)
  
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [blocosDisponiveis, setBlocosDisponiveis] = useState<BlocoTemplate[]>([])
  const [jogosDisponiveis, setJogosDisponiveis] = useState<Game[]>([])
  
  // 🎮 Estado unificado (blocos + jogos)
  const [itensSelecionados, setItensSelecionados] = useState<ItemAula[]>([])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loadingBlocos, setLoadingBlocos] = useState(false)
  const [loadingJogos, setLoadingJogos] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroAno, setFiltroAno] = useState('')
  const [searchTermJogos, setSearchTermJogos] = useState('')

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (aulaId) {
      loadAnosEscolares()
      loadDisciplinas()
      loadAula()
      loadBlocosDisponiveis()
      loadJogosDisponiveis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId])

  const loadAula = async () => {
    try {
      setLoading(true)
      
      console.log('🔄 Iniciando carregamento da aula:', aulaId)
      
      // 1. Carregar dados básicos da aula
      const { data: aulaData, error: aulaError } = await supabase
        .from('aulas')
        .select('id, titulo, descricao')
        .eq('id', aulaId)
        .single()
      
      if (aulaError) {
        console.error('❌ Erro ao carregar aula:', aulaError)
        toast.error('Erro ao carregar aula: ' + aulaError.message)
        router.push('/admin/aulas')
        return
      }

      if (!aulaData) {
        console.error('❌ Aula não encontrada')
        toast.error('Aula não encontrada')
        router.push('/admin/aulas')
        return
      }

      setTitulo(aulaData.titulo)
      setDescricao(aulaData.descricao || '')

      console.log('✅ Aula carregada:', aulaData)

      // 2. Carregar BLOCOS da aula
      console.log('📦 Carregando blocos da aula...')
      const { data: blocosData, error: blocosError } = await supabase
        .from('aulas_blocos')
        .select(`
          ordem_na_aula,
          bloco_template_id,
          blocos_templates (
            id,
            codigo_bloco,
            titulo,
            pontos_bloco,
            ano_escolar_id,
            disciplinas (codigo, nome)
          )
        `)
        .eq('aula_id', aulaId)
        .order('ordem_na_aula')

      if (blocosError) {
        console.error('❌ Erro ao carregar blocos:', blocosError)
        toast.error('Erro ao carregar blocos: ' + blocosError.message)
      } else {
        console.log('✅ Blocos carregados:', blocosData?.length || 0, 'blocos')
        console.log('   Dados brutos:', JSON.stringify(blocosData, null, 2))
      }

      // 3. Carregar JOGOS da aula
      console.log('🎮 Carregando jogos da aula...')
      const { data: jogosData, error: jogosError } = await supabase
        .from('aulas_jogos')
        .select(`
          ordem_na_aula,
          game_id,
          games (
            id,
            codigo,
            titulo,
            descricao,
            duracao_segundos,
            publicado
          )
        `)
        .eq('aula_id', aulaId)
        .order('ordem_na_aula')

      if (jogosError) {
        console.error('❌ Erro ao carregar jogos:', jogosError)
        toast.error('Erro ao carregar jogos: ' + jogosError.message)
      } else {
        console.log('✅ Jogos carregados:', jogosData?.length || 0, 'jogos')
        console.log('   Dados brutos:', JSON.stringify(jogosData, null, 2))
      }

      // 4. Transformar blocos em ItemAula
      const itensBlocos: ItemAula[] = []
      
      if (blocosData && blocosData.length > 0) {
        console.log('🔄 Transformando blocos em ItemAula...')
        for (const b of blocosData) {
          try {
            if (!b.blocos_templates) {
              console.warn('⚠️ Bloco sem dados de template:', b)
              continue
            }

            // Garantir que blocos_templates é um objeto único, não um array
            const templateData = Array.isArray(b.blocos_templates) ? b.blocos_templates[0] : b.blocos_templates

            if (!templateData) {
              console.warn('⚠️ Template data não encontrado:', b)
              continue
            }

            const item: ItemAula = {
              tipo: 'bloco' as const,
              id: b.bloco_template_id,
              ordem: b.ordem_na_aula,
              dados: {
                id: templateData.id,
                codigo_bloco: templateData.codigo_bloco,
                titulo: templateData.titulo,
                pontos_bloco: templateData.pontos_bloco,
                disciplinas: templateData.disciplinas,
                ano_escolar_id: templateData.ano_escolar_id
              } as BlocoTemplate
            }
            itensBlocos.push(item)
            console.log('  ✅ Bloco transformado:', item.dados.titulo)
          } catch (err) {
            console.error('❌ Erro ao transformar bloco:', b, err)
          }
        }
      } else {
        console.log('⚠️ Nenhum bloco encontrado para esta aula')
      }

      // 5. Transformar jogos em ItemAula
      const itensJogos: ItemAula[] = []
      
      if (jogosData && jogosData.length > 0) {
        console.log('🔄 Transformando jogos em ItemAula...')
        for (const j of jogosData) {
          try {
            if (!j.games) {
              console.warn('⚠️ Jogo sem dados de game:', j)
              continue
            }

            // Garantir que games é um objeto único, não um array
            const gameData = Array.isArray(j.games) ? j.games[0] : j.games

            if (!gameData) {
              console.warn('⚠️ Game data não encontrado:', j)
              continue
            }

            const item: ItemAula = {
              tipo: 'jogo' as const,
              id: j.game_id,
              ordem: j.ordem_na_aula,
              dados: {
                id: gameData.id,
                codigo: gameData.codigo,
                titulo: gameData.titulo,
                descricao: gameData.descricao,
                duracao_segundos: gameData.duracao_segundos,
                publicado: gameData.publicado
              } as Game
            }
            itensJogos.push(item)
            console.log('  ✅ Jogo transformado:', item.dados.titulo)
          } catch (err) {
            console.error('❌ Erro ao transformar jogo:', j, err)
          }
        }
      } else {
        console.log('⚠️ Nenhum jogo encontrado para esta aula')
      }

      // 6. Combinar e ordenar
      const todosItens = [...itensBlocos, ...itensJogos]
        .sort((a, b) => a.ordem - b.ordem)

      console.log('🎯 RESULTADO FINAL:')
      console.log('   Total de itens:', todosItens.length)
      console.log('   Blocos:', itensBlocos.length)
      console.log('   Jogos:', itensJogos.length)
      console.log('   Itens ordenados:', todosItens.map(i => `${i.ordem}. [${i.tipo}] ${i.dados.titulo}`))

      setItensSelecionados(todosItens)
      
      if (todosItens.length === 0) {
        toast.warning('Esta aula não possui blocos ou jogos configurados')
      }

      // Detectar ano e disciplina do primeiro bloco
      if (itensBlocos.length > 0) {
        const primeiroItem = itensBlocos[0]
        if (!primeiroItem || !primeiroItem.dados) {
          // sem dados
        } else {
          const primeiroBloco = primeiroItem.dados as BlocoTemplate
          const disc = primeiroBloco.disciplinas
        if (Array.isArray(disc) && disc.length > 0) {
          if (disc[0]?.codigo) setDisciplinaCodigo(disc[0].codigo)
        }
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
    const { data } = await supabase.rpc('get_anos_escolares')
    setAnosEscolares(data || [])
  }

  const loadDisciplinas = async () => {
    const { data } = await supabase
      .from('disciplinas')
      .select('id, codigo, nome, cor_hex')
      .eq('ativa', true)
      .order('nome')
    setDisciplinas(data || [])
  }

  const loadBlocosDisponiveis = async () => {
    try {
      setLoadingBlocos(true)
      const { data } = await supabase.rpc('get_blocos_with_relations_admin')
      setBlocosDisponiveis(data || [])
    } catch (error) {
      console.error('Erro ao carregar blocos:', error)
    } finally {
      setLoadingBlocos(false)
    }
  }

  const loadJogosDisponiveis = async () => {
    try {
      setLoadingJogos(true)
      const { data } = await supabase
        .from('games')
        .select('id, codigo, titulo, descricao, duracao_segundos, publicado')
        .eq('publicado', true)
        .order('titulo')
      setJogosDisponiveis(data || [])
      console.log('🎮 Jogos disponíveis carregados:', data?.length || 0)
    } catch (error) {
      console.error('Erro ao carregar jogos:', error)
    } finally {
      setLoadingJogos(false)
    }
  }

  const handleAdicionarBloco = (bloco: BlocoTemplate) => {
    if (itensSelecionados.find(item => item.id === bloco.id && item.tipo === 'bloco')) {
      return
    }
    const novaOrdem = itensSelecionados.length + 1
    setItensSelecionados([
      ...itensSelecionados,
      { tipo: 'bloco', id: bloco.id, ordem: novaOrdem, dados: bloco }
    ])
  }

  const handleAdicionarJogo = (jogo: Game) => {
    if (itensSelecionados.find(item => item.id === jogo.id && item.tipo === 'jogo')) {
      return
    }
    const novaOrdem = itensSelecionados.length + 1
    setItensSelecionados([
      ...itensSelecionados,
      { tipo: 'jogo', id: jogo.id, ordem: novaOrdem, dados: jogo }
    ])
  }

  const handleRemoverItem = (id: string, tipo: 'bloco' | 'jogo') => {
    const novosItens = itensSelecionados
      .filter(item => !(item.id === id && item.tipo === tipo))
      .map((item, index) => ({ ...item, ordem: index + 1 }))
    setItensSelecionados(novosItens)
  }

  const handleMoverItem = (index: number, direction: 'up' | 'down') => {
    const novosItens = [...itensSelecionados]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= novosItens.length) return
    
    const atual = novosItens[index]
    const alvo = novosItens[targetIndex]
    if (!atual || !alvo) return
    novosItens[index] = alvo
    novosItens[targetIndex] = atual
    novosItens.forEach((item, i) => item.ordem = i + 1)
    
    setItensSelecionados(novosItens)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!titulo.trim()) {
      toast.error('Título é obrigatório')
      return
    }

    if (itensSelecionados.length === 0) {
      toast.error('Selecione pelo menos um bloco ou jogo')
      return
    }

    try {
      setSaving(true)

      console.log('🔄 Iniciando atualização da aula...')
      console.log('   Aula ID:', aulaId)
      console.log('   Título:', titulo)
      console.log('   Itens selecionados:', itensSelecionados.length)

      // 1. Atualizar informações básicas da aula
      console.log('1️⃣ Atualizando informações básicas...')
      const { error: updateError } = await supabase
        .from('aulas')
        .update({
          titulo: titulo,
          descricao: descricao || null
        })
        .eq('id', aulaId)

      if (updateError) {
        console.error('❌ Erro ao atualizar informações básicas:', updateError)
        throw new Error(`Erro ao atualizar informações: ${updateError.message}`)
      }
      console.log('✅ Informações básicas atualizadas')

      // 2. Deletar associações antigas
      console.log('2️⃣ Deletando associações antigas...')
      
      const { error: deleteBlocosError } = await supabase
        .from('aulas_blocos')
        .delete()
        .eq('aula_id', aulaId)
      
      if (deleteBlocosError) {
        console.error('❌ Erro ao deletar blocos antigos:', deleteBlocosError)
        throw new Error(`Erro ao deletar blocos: ${deleteBlocosError.message}`)
      }
      
      const { error: deleteJogosError } = await supabase
        .from('aulas_jogos')
        .delete()
        .eq('aula_id', aulaId)
      
      if (deleteJogosError) {
        console.error('❌ Erro ao deletar jogos antigos:', deleteJogosError)
        throw new Error(`Erro ao deletar jogos: ${deleteJogosError.message}`)
      }
      
      console.log('✅ Associações antigas deletadas')

      // 3. Inserir novos blocos
      const blocos = itensSelecionados
        .filter(i => i.tipo === 'bloco')
        .map((item) => ({
          aula_id: aulaId,
          bloco_template_id: item.id,
          ordem_na_aula: item.ordem
        }))

      console.log('3️⃣ Inserindo blocos:', blocos.length)
      
      if (blocos.length > 0) {
        console.log('   Dados dos blocos:', blocos)
        const { error: blocosError, data: blocosData } = await supabase
          .from('aulas_blocos')
          .insert(blocos)
          .select()
        
        if (blocosError) {
          console.error('❌ Erro ao inserir blocos:', blocosError)
          throw new Error(`Erro ao inserir blocos: ${blocosError.message}`)
        }
        console.log('✅ Blocos inseridos:', blocosData?.length || 0)
      }

      // 4. Inserir novos jogos
      const jogos = itensSelecionados
        .filter(i => i.tipo === 'jogo')
        .map((item) => ({
          aula_id: aulaId,
          game_id: item.id,
          ordem_na_aula: item.ordem,
          obrigatorio: true
        }))

      console.log('4️⃣ Inserindo jogos:', jogos.length)
      
      if (jogos.length > 0) {
        console.log('   Dados dos jogos:', jogos)
        const { error: jogosError, data: jogosData } = await supabase
          .from('aulas_jogos')
          .insert(jogos)
          .select()
        
        if (jogosError) {
          console.error('❌ Erro ao inserir jogos:', jogosError)
          throw new Error(`Erro ao inserir jogos: ${jogosError.message}`)
        }
        console.log('✅ Jogos inseridos:', jogosData?.length || 0)
      }

      // 5. Atualizar pontos_totais da aula
      const pontos = itensSelecionados
        .filter(i => i.tipo === 'bloco')
        .reduce((sum, i) => sum + ((i.dados as BlocoTemplate).pontos_bloco || 0), 0)

      console.log('5️⃣ Atualizando pontos totais:', pontos)
      
      const { error: pontosError } = await supabase
        .from('aulas')
        .update({ pontos_totais: pontos })
        .eq('id', aulaId)

      if (pontosError) {
        console.error('❌ Erro ao atualizar pontos:', pontosError)
        // Não é crítico, só avisar
        console.warn('⚠️ Pontos não atualizados, mas aula foi salva')
      } else {
        console.log('✅ Pontos totais atualizados')
      }

      console.log('🎉 Aula atualizada com sucesso!')
      toast.success('Aula atualizada com sucesso!')
      router.push('/admin/aulas')
      router.refresh()
    } catch (error) {
      console.error('❌ ERRO COMPLETO:', error)
      console.error('❌ Tipo do erro:', typeof error)
      console.error('❌ Nome do erro:', error instanceof Error ? error.name : 'unknown')
      console.error('❌ Mensagem:', error instanceof Error ? error.message : JSON.stringify(error))
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'no stack')
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro ao atualizar aula. Verifique o console para mais detalhes.'
      
      toast.error(errorMessage)
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

      // Deletar associações primeiro
      await supabase.from('aulas_blocos').delete().eq('aula_id', aulaId)
      await supabase.from('aulas_jogos').delete().eq('aula_id', aulaId)
      
      // Deletar aula
      const { error } = await supabase
        .from('aulas')
        .delete()
        .eq('id', aulaId)

      if (error) throw error

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

  // Filtrar blocos disponíveis
  const blocosFiltrados = blocosDisponiveis.filter(bloco => {
    const matchSearch = !searchTerm || 
      bloco.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bloco.codigo_bloco.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchDisciplina = !filtroDisciplina || 
      (Array.isArray(bloco.disciplinas)
        ? bloco.disciplinas.some(d => d.codigo === filtroDisciplina)
        : false)

    const matchAno = !filtroAno || 
      bloco.ano_escolar_id === filtroAno

    const naoSelecionado = !itensSelecionados.find(item => item.id === bloco.id && item.tipo === 'bloco')

    return matchSearch && matchDisciplina && matchAno && naoSelecionado
  })

  // Filtrar jogos disponíveis
  const jogosFiltrados = jogosDisponiveis.filter(jogo => {
    const matchSearch = !searchTermJogos || 
      jogo.titulo.toLowerCase().includes(searchTermJogos.toLowerCase()) ||
      jogo.codigo.toLowerCase().includes(searchTermJogos.toLowerCase())
    
    const naoSelecionado = !itensSelecionados.find(item => item.id === jogo.id && item.tipo === 'jogo')

    return matchSearch && naoSelecionado
  })

  const pontosTotais = itensSelecionados
    .filter(item => item.tipo === 'bloco')
    .reduce((sum, item) => sum + ((item.dados as BlocoTemplate).pontos_bloco || 0), 0)

  const totalBlocos = itensSelecionados.filter(i => i.tipo === 'bloco').length
  const totalJogos = itensSelecionados.filter(i => i.tipo === 'jogo').length

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
            <h1 className="text-3xl font-bold text-slate-900">Editar Aula</h1>
            <p className="text-slate-600">Atualize as informações, blocos e jogos da aula</p>
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
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva os objetivos e conteúdo da aula..."
              />
            </div>
          </div>
        </div>

        {/* 3 Colunas: Blocos | Jogos | Sequência */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA 1: Blocos Disponíveis */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              📄 Blocos ({blocosFiltrados.length})
            </h2>

            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar blocos..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">Todos os anos</option>
                {anosEscolares.map(ano => (
                  <option key={ano.id} value={ano.id}>{ano.nome}</option>
                ))}
              </select>
              <select
                value={filtroDisciplina}
                onChange={(e) => setFiltroDisciplina(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              >
                <option value="">Todas as disciplinas</option>
                {disciplinas.map(disc => (
                  <option key={disc.id} value={disc.codigo}>{disc.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingBlocos ? (
                <p className="text-slate-500 text-center py-8 text-sm">Carregando...</p>
              ) : blocosFiltrados.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Nenhum bloco encontrado</p>
              ) : (
                blocosFiltrados.map((bloco) => (
                  <div
                    key={bloco.id}
                    className="border border-slate-200 rounded-lg p-3 hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-colors"
                    onClick={() => handleAdicionarBloco(bloco)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 text-sm">{bloco.titulo}</p>
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
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUNA 2: Jogos Disponíveis */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-purple-600" />
              Jogos ({jogosFiltrados.length})
            </h2>

            <div className="space-y-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTermJogos}
                  onChange={(e) => setSearchTermJogos(e.target.value)}
                  placeholder="Buscar jogos..."
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {loadingJogos ? (
                <p className="text-slate-500 text-center py-8 text-sm">Carregando...</p>
              ) : jogosFiltrados.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Nenhum jogo encontrado</p>
              ) : (
                jogosFiltrados.map((jogo) => (
                  <div
                    key={jogo.id}
                    className="border border-purple-200 bg-purple-50 rounded-lg p-3 hover:border-purple-500 hover:bg-purple-100 cursor-pointer transition-colors"
                    onClick={() => handleAdicionarJogo(jogo)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="w-4 h-4 text-purple-600" />
                          <p className="font-medium text-slate-900 text-sm">{jogo.titulo}</p>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {jogo.codigo} • {Math.floor(jogo.duracao_segundos / 60)}min
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdicionarJogo(jogo)
                        }}
                        className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUNA 3: Sequência da Aula */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Sequência da Aula ({totalBlocos + totalJogos})
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              {totalBlocos} blocos • {totalJogos} jogos • {pontosTotais} pts
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {itensSelecionados.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">
                  Nenhum item selecionado
                </p>
              ) : (
                itensSelecionados.map((item, index) => (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    className={`border rounded-lg p-3 ${
                      item.tipo === 'jogo' 
                        ? 'border-purple-300 bg-purple-50' 
                        : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoverItem(index, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleMoverItem(index, 'down')}
                          disabled={index === itensSelecionados.length - 1}
                          className="h-6 w-6 p-0 text-xs"
                        >
                          ↓
                        </Button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.tipo === 'jogo' ? (
                            <Gamepad2 className="w-4 h-4 text-purple-600" />
                          ) : (
                            <span className="text-orange-600">📄</span>
                          )}
                          <p className="font-medium text-slate-900 text-sm">
                            {index + 1}. {item.tipo === 'bloco' 
                              ? (item.dados as BlocoTemplate).titulo
                              : (item.dados as Game).titulo
                            }
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {item.tipo === 'bloco' 
                            ? `${(item.dados as BlocoTemplate).codigo_bloco} • ${(item.dados as BlocoTemplate).pontos_bloco} pts`
                            : `${(item.dados as Game).codigo} • ${Math.floor((item.dados as Game).duracao_segundos / 60)}min`
                          }
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoverItem(item.id, item.tipo)}
                        className="h-6 w-6 p-0"
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
            disabled={saving || itensSelecionados.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
