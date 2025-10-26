'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'
import { ArrowLeft, Save, PlayCircle, Wand2 } from 'lucide-react'

interface AnoEscolar {
  id: string
  nome: string
}

interface Disciplina {
  id: string
  nome: string
  codigo: string
}

export default function CriarJogoPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [loading, setLoading] = useState(false)
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  
  const [formData, setFormData] = useState({
    codigo: '',
    titulo: '',
    descricao: '',
    ano_escolar_id: '',
    disciplina_id: '',
    duracao_segundos: 120,
    quantidade_perguntas: 3,
    dificuldades: ['facil', 'medio'] as string[],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar anos escolares
      const { data: anosData } = await supabase.rpc('get_anos_escolares')
      setAnosEscolares(anosData || [])

      // Carregar disciplinas
      const { data: disciplinasData } = await supabase
        .from('disciplinas')
        .select('id, nome, codigo')
        .eq('ativa', true)
        .order('nome')
      
      setDisciplinas(disciplinasData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  const generateCodigo = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 7)
    return `GAME-${timestamp}-${random}`.toUpperCase()
  }

  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault()

    // Validações
    if (!formData.titulo) {
      toast.error('Título é obrigatório')
      return
    }

    if (!formData.ano_escolar_id) {
      toast.error('Selecione um ano escolar')
      return
    }

    if (formData.dificuldades.length === 0) {
      toast.error('Selecione pelo menos uma dificuldade')
      return
    }

    try {
      setLoading(true)

      // Gerar código automático se não preenchido
      const codigo = formData.codigo || generateCodigo()

      // Configuração padrão do jogo
      const configuracao = {
        velocidade_personagem: 250,
        quantidade_moedas: 20,
        quantidade_inimigos: 6,
        pontos_por_acerto: 10,
        mostrar_explicacao_erro: true
      }

      // Filtro de perguntas
      const filtro_perguntas = {
        ano_escolar_id: formData.ano_escolar_id,
        disciplina_id: formData.disciplina_id || null,
        dificuldades: formData.dificuldades,
        quantidade: formData.quantidade_perguntas
      }

      const { data, error } = await supabase
        .from('games')
        .insert({
          template_id: null, // Por enquanto sem template
          codigo,
          titulo: formData.titulo,
          descricao: formData.descricao,
          ano_escolar_id: formData.ano_escolar_id,
          disciplina_id: formData.disciplina_id || null,
          duracao_segundos: formData.duracao_segundos,
          configuracao,
          filtro_perguntas,
          status: publish ? 'publicado' : 'rascunho',
          publicado: publish,
          published_at: publish ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar jogo:', error)
        toast.error(`Erro ao criar jogo: ${error.message}`)
        return
      }

      toast.success(publish ? 'Jogo criado e publicado!' : 'Jogo criado como rascunho!')
      router.push('/admin/fabrica-jogos/jogos')
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao criar jogo')
    } finally {
      setLoading(false)
    }
  }

  const handleDificuldadeToggle = (dificuldade: string) => {
    const current = formData.dificuldades
    if (current.includes(dificuldade)) {
      setFormData({
        ...formData,
        dificuldades: current.filter(d => d !== dificuldade)
      })
    } else {
      setFormData({
        ...formData,
        dificuldades: [...current, dificuldade]
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold text-slate-900">Criar Novo Jogo</h1>
          <p className="text-slate-600 mt-1">Adventure Runner com perguntas educacionais</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Título, descrição e configurações gerais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Código (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Será gerado automaticamente"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, codigo: generateCodigo() })}
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duração (segundos) *
                </label>
                <select
                  value={formData.duracao_segundos}
                  onChange={(e) => setFormData({ ...formData, duracao_segundos: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={60}>1 minuto (60s)</option>
                  <option value={120}>2 minutos (120s)</option>
                  <option value={180}>3 minutos (180s)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título do Jogo *
              </label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Aventura Matemática - 2º Ano"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descreva o objetivo do jogo..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Público-Alvo */}
        <Card>
          <CardHeader>
            <CardTitle>Público-Alvo</CardTitle>
            <CardDescription>Para qual ano escolar e disciplina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ano Escolar *
                </label>
                <select
                  value={formData.ano_escolar_id}
                  onChange={(e) => setFormData({ ...formData, ano_escolar_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {anosEscolares.map((ano) => (
                    <option key={ano.id} value={ano.id}>
                      {ano.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Disciplina (opcional)
                </label>
                <select
                  value={formData.disciplina_id}
                  onChange={(e) => setFormData({ ...formData, disciplina_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as disciplinas</option>
                  {disciplinas.map((disc) => (
                    <option key={disc.id} value={disc.id}>
                      {disc.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração de Perguntas */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Perguntas</CardTitle>
            <CardDescription>
              As perguntas serão sorteadas do banco de acordo com esses filtros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantidade de Baús (Perguntas) *
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.quantidade_perguntas}
                onChange={(e) => setFormData({ ...formData, quantidade_perguntas: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-sm text-slate-500 mt-1">
                Número de baús que o aluno encontrará no jogo (cada baú = 1 pergunta)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Dificuldades *
              </label>
              <div className="flex gap-3">
                {['facil', 'medio', 'dificil'].map((dif) => (
                  <label
                    key={dif}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.dificuldades.includes(dif)}
                      onChange={() => handleDificuldadeToggle(dif)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium capitalize">
                      {dif === 'facil' ? 'Fácil' : dif === 'medio' ? 'Médio' : 'Difícil'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-2">
                Perguntas dessas dificuldades serão sorteadas aleatoriamente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-blue-600" />
              Preview do Jogo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-700">
              <p>✅ <strong>Template:</strong> Adventure Runner</p>
              <p>⏱️ <strong>Duração:</strong> {formData.duracao_segundos}s ({Math.floor(formData.duracao_segundos / 60)}min)</p>
              <p>📦 <strong>Baús:</strong> {formData.quantidade_perguntas} perguntas</p>
              <p>🎯 <strong>Dificuldades:</strong> {formData.dificuldades.map(d => d === 'facil' ? 'Fácil' : d === 'medio' ? 'Médio' : 'Difícil').join(', ')}</p>
              {formData.ano_escolar_id && (
                <p>🎓 <strong>Público:</strong> {anosEscolares.find(a => a.id === formData.ano_escolar_id)?.nome}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex gap-3">
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
            variant="secondary"
            disabled={loading}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar como Rascunho
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Publicar Jogo
          </Button>
        </div>
      </form>
    </div>
  )
}

