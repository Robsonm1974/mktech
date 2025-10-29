'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, ArrowLeft, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface AnoEscolar {
  id: string
  nome: string
}

interface Disciplina {
  id: string
  nome: string
  codigo: string
}

interface Pergunta {
  id: string
  codigo: string
  pergunta: string
  opcoes: { id: string; texto: string; correta: boolean }[]
  explicacao: string
  ano_escolar_id: string
  disciplina_id: string
  dificuldade: string
  ativa: boolean
  anos_escolares?: { nome: string }
  disciplinas?: { nome: string }
}

export default function BancoPerguntasPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroAno, setFiltroAno] = useState('')
  const [filtroDisciplina, setFiltroDisciplina] = useState('')
  const [filtroDificuldade, setFiltroDificuldade] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Formulário de Nova Pergunta
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    pergunta: '',
    ano_escolar_id: '',
    disciplina_id: '',
    dificuldade: 'medio',
    explicacao: '',
    opcoes: [
      { id: 'a', texto: '', correta: false },
      { id: 'b', texto: '', correta: false },
      { id: 'c', texto: '', correta: false }
    ]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // PRIMEIRO: Carregar anos escolares e disciplinas
      const { data: anosData, error: anosError } = await supabase.rpc('get_anos_escolares')
      
      if (anosError) {
        console.error('Erro ao carregar anos:', anosError)
      }
      const anosCarregados = anosData || []
      setAnosEscolares(anosCarregados)

      const { data: disciplinasData, error: disciplinasError } = await supabase
        .from('disciplinas')
        .select('id, nome, codigo')
        .eq('ativa', true)
        .order('nome')
      
      if (disciplinasError) {
        console.error('Erro ao carregar disciplinas:', disciplinasError)
      }
      const disciplinasCarregadas = disciplinasData || []
      setDisciplinas(disciplinasCarregadas)

      // DEPOIS: Carregar perguntas (SEM join para evitar problema de RLS)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: perguntasData, error: perguntasError } = await supabase
        .from('banco_perguntas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (perguntasError) {
        console.error('❌ Erro ao carregar perguntas:', perguntasError)
        toast.error(`Erro ao carregar perguntas: ${perguntasError.message}`)
        setPerguntas([])
        setLoading(false)
        return
      }

      // Buscar nomes de anos e disciplinas separadamente se houver perguntas
      if (perguntasData && perguntasData.length > 0) {
        const perguntasComNomes = perguntasData.map((p) => {
          let anoNome = null
          let disciplinaNome = null

          if (p.ano_escolar_id) {
            const ano = anosCarregados.find((a: { id: string; nome: string }) => a.id === p.ano_escolar_id)
            anoNome = ano?.nome || null
          }

          if (p.disciplina_id) {
            const disc = disciplinasCarregadas.find((d: { id: string; nome: string }) => d.id === p.disciplina_id)
            disciplinaNome = disc?.nome || null
          }

          return {
            ...p,
            anos_escolares: anoNome ? { nome: anoNome } : null,
            disciplinas: disciplinaNome ? { nome: disciplinaNome } : null
          }
        })
        setPerguntas(perguntasComNomes)
      } else {
        setPerguntas(perguntasData || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!formData.pergunta || !formData.explicacao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const opcoesPreenchidas = formData.opcoes.filter(o => o.texto.trim())
    if (opcoesPreenchidas.length < 2) {
      toast.error('Adicione pelo menos 2 opções de resposta')
      return
    }

    const temCorreta = formData.opcoes.some(o => o.correta)
    if (!temCorreta) {
      toast.error('Marque pelo menos uma resposta como correta')
      return
    }

    try {
      // Gerar código automático se não preenchido
      const codigo = formData.codigo || `PERG-${Date.now()}`

      const { error } = await supabase
        .from('banco_perguntas')
        .insert({
          codigo,
          pergunta: formData.pergunta,
          ano_escolar_id: formData.ano_escolar_id,
          disciplina_id: formData.disciplina_id || null,
          dificuldade: formData.dificuldade,
          explicacao: formData.explicacao,
          opcoes: formData.opcoes.filter(o => o.texto.trim()),
          ativa: true
        })
        .select()

      if (error) {
        console.error('Erro ao salvar pergunta:', error)
        toast.error(`Erro ao salvar: ${error.message}`)
        throw error
      }

      toast.success('Pergunta cadastrada com sucesso!')
      setShowForm(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('❌ Erro ao salvar pergunta:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao salvar pergunta: ${errorMessage}`)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      pergunta: '',
      ano_escolar_id: '',
      disciplina_id: '',
      dificuldade: 'medio',
      explicacao: '',
      opcoes: [
        { id: 'a', texto: '', correta: false },
        { id: 'b', texto: '', correta: false },
        { id: 'c', texto: '', correta: false }
      ]
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return

    try {
      const { error } = await supabase
        .from('banco_perguntas')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Pergunta excluída!')
      loadData()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir pergunta')
    }
  }

  // Filtrar perguntas
  const perguntasFiltradas = perguntas.filter(p => {
    const matchAno = !filtroAno || p.ano_escolar_id === filtroAno
    const matchDisciplina = !filtroDisciplina || p.disciplina_id === filtroDisciplina
    const matchDificuldade = !filtroDificuldade || p.dificuldade === filtroDificuldade
    const matchSearch = !searchTerm || 
      p.pergunta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())

    return matchAno && matchDisciplina && matchDificuldade && matchSearch
  })

  const getDificuldadeColor = (dif: string) => {
    if (dif === 'facil') return 'bg-green-100 text-green-700'
    if (dif === 'medio') return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Banco de Perguntas</h1>
          <p className="text-slate-600 mt-1">
            {perguntas.length} perguntas cadastradas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Pergunta
        </Button>
      </div>

      {/* Formulário de Nova Pergunta */}
      {showForm && (
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle>Nova Pergunta</CardTitle>
            <CardDescription>
              Preencha todos os campos para cadastrar uma nova pergunta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Código (opcional)</Label>
                  <Input
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: PROG-2ANO-01"
                  />
                </div>
                <div>
                  <Label>Ano Escolar *</Label>
                  <select
                    required
                    value={formData.ano_escolar_id}
                    onChange={(e) => setFormData({ ...formData, ano_escolar_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="">Selecione...</option>
                    {anosEscolares.map(ano => (
                      <option key={ano.id} value={ano.id}>{ano.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Disciplina</Label>
                  <select
                    value={formData.disciplina_id}
                    onChange={(e) => setFormData({ ...formData, disciplina_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="">Todas as disciplinas</option>
                    {disciplinas.map(disc => (
                      <option key={disc.id} value={disc.id}>{disc.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Dificuldade *</Label>
                  <select
                    required
                    value={formData.dificuldade}
                    onChange={(e) => setFormData({ ...formData, dificuldade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Pergunta *</Label>
                <textarea
                  required
                  value={formData.pergunta}
                  onChange={(e) => setFormData({ ...formData, pergunta: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  rows={3}
                  placeholder="Digite a pergunta..."
                />
              </div>

              <div className="space-y-3">
                <Label>Opções de Resposta *</Label>
                {formData.opcoes.map((opcao, index) => (
                  <div key={opcao.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={opcao.correta}
                      onChange={(e) => {
                        const novasOpcoes = [...formData.opcoes]
                        if (!novasOpcoes[index]) return
                        novasOpcoes[index].correta = e.target.checked
                        setFormData({ ...formData, opcoes: novasOpcoes })
                      }}
                      className="w-5 h-5"
                    />
                    <Input
                      value={opcao.texto}
                      onChange={(e) => {
                        const novasOpcoes = [...formData.opcoes]
                        if (!novasOpcoes[index]) return
                        novasOpcoes[index].texto = e.target.value
                        setFormData({ ...formData, opcoes: novasOpcoes })
                      }}
                      placeholder={`Opção ${opcao.id.toUpperCase()}`}
                    />
                    {opcao.correta && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const novaLetra = String.fromCharCode(97 + formData.opcoes.length)
                    setFormData({
                      ...formData,
                      opcoes: [...formData.opcoes, { id: novaLetra, texto: '', correta: false }]
                    })
                  }}
                >
                  + Adicionar Opção
                </Button>
              </div>

              <div>
                <Label>Explicação (mostrada ao errar) *</Label>
                <textarea
                  required
                  value={formData.explicacao}
                  onChange={(e) => setFormData({ ...formData, explicacao: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  rows={3}
                  placeholder="Explique por que a resposta correta está certa..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Salvar Pergunta</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar pergunta..."
                className="pl-10"
              />
            </div>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">Todos os anos</option>
              {anosEscolares.map(ano => (
                <option key={ano.id} value={ano.id}>{ano.nome}</option>
              ))}
            </select>
            <select
              value={filtroDisciplina}
              onChange={(e) => setFiltroDisciplina(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">Todas as disciplinas</option>
              {disciplinas.map(disc => (
                <option key={disc.id} value={disc.id}>{disc.nome}</option>
              ))}
            </select>
            <select
              value={filtroDificuldade}
              onChange={(e) => setFiltroDificuldade(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md"
            >
              <option value="">Todas as dificuldades</option>
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Perguntas */}
      <div className="space-y-4">
        {perguntasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              Nenhuma pergunta encontrada
            </CardContent>
          </Card>
        ) : (
          perguntasFiltradas.map((pergunta) => (
            <Card key={pergunta.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{pergunta.codigo}</Badge>
                      <Badge className={getDificuldadeColor(pergunta.dificuldade)}>
                        {pergunta.dificuldade}
                      </Badge>
                      <Badge variant="secondary">
                        {pergunta.anos_escolares?.nome}
                      </Badge>
                      {pergunta.disciplinas?.nome && (
                        <Badge variant="secondary">
                          {pergunta.disciplinas.nome}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{pergunta.pergunta}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(pergunta.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pergunta.opcoes.map((opcao: { id: string; texto: string; correta: boolean }) => (
                    <div 
                      key={opcao.id}
                      className={`p-2 rounded-md flex items-center gap-2 ${
                        opcao.correta ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                      }`}
                    >
                      {opcao.correta ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={opcao.correta ? 'font-medium text-green-900' : 'text-slate-700'}>
                        {opcao.id.toUpperCase()}) {opcao.texto}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-xs font-semibold text-blue-700 mb-1">💡 Explicação</div>
                  <div className="text-sm text-blue-900">{pergunta.explicacao}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

