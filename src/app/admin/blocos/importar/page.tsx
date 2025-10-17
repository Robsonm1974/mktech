'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { importPlanejamentoSchema } from '@/lib/admin/validations'
import { parsearDocumentoPlanejamento, validarEstruturaPlanejamento, type ParsedDocument } from '@/lib/admin/planejamento-parser'
import type { Disciplina } from '@/types/admin'
import { toast } from 'sonner'

export default function ImportarPlanejamentoPage() {
  const [form, setForm] = useState({
    disciplina_id: '',
    turma: '',
    titulo: '',
    documento_md: '',
    num_blocos: 30,
    pontos_totais: 300,
    pontos_por_quiz: 10,
    codigo_base: '',
    substituir_existentes: false
  })
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(true)
  const [parsedData, setParsedData] = useState<ParsedDocument | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    checkSessionAndLoadDisciplinas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkSessionAndLoadDisciplinas = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔐 Verificação de sessão:', {
      hasSession: !!session,
      sessionError,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (!session) {
      console.error('❌ Nenhuma sessão ativa! Redirecionando para login...')
      setErrors({ ...errors, disciplina_id: 'Sessão expirada. Faça login novamente.' })
      setLoadingDisciplinas(false)
      return
    }

    loadDisciplinas()
  }

  const loadDisciplinas = async () => {
    console.log('🔍 Carregando disciplinas via RPC...')
    
    try {
      const { data, error } = await supabase.rpc('get_disciplinas_admin')
      
      console.log('📊 RPC get_disciplinas_admin:', { 
        hasData: !!data, 
        dataLength: data?.length, 
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        rawData: data
      })
      
      if (error) {
        console.error('❌ Erro ao carregar disciplinas via RPC:', error)
        const errorMsg = error.message || error.toString() || 'Erro ao chamar RPC'
        setErrors({ 
          ...errors, 
          disciplina_id: `Erro RPC: ${errorMsg}. Execute a migration RPC_BYPASS_RLS_DISCIPLINAS.sql` 
        })
      }
      
      if (data && data.length > 0) {
        console.log('✅ Disciplinas carregadas via RPC:', data.length, data)
        setDisciplinas(data)
      } else if (!error) {
        console.warn('⚠️ Nenhuma disciplina encontrada (sem erro)')
        setErrors({ ...errors, disciplina_id: 'Nenhuma disciplina encontrada. Verifique se a migration foi executada.' })
      }
    } catch (err) {
      console.error('💥 Exceção ao carregar disciplinas:', err)
      setErrors({ ...errors, disciplina_id: 'Erro inesperado ao carregar disciplinas' })
    } finally {
      setLoadingDisciplinas(false)
    }
  }

  // Parsear documento e preencher form automaticamente
  const handleParsearDocumento = () => {
    if (!form.documento_md.trim()) {
      setErrors({ ...errors, documento_md: 'Cole o documento antes de parsear' })
      return
    }

    // Validar estrutura primeiro
    const validacao = validarEstruturaPlanejamento(form.documento_md)
    if (!validacao.valido) {
      setErrors({ 
        documento_md: `Documento inválido:\n${validacao.erros.join('\n')}` 
      })
      return
    }

    try {
      const parsed = parsearDocumentoPlanejamento(form.documento_md)
      setParsedData(parsed)
      
      // Preencher form automaticamente
      setForm(prev => ({
        ...prev,
        titulo: parsed.metadados.titulo,
        turma: parsed.metadados.turma,
        codigo_base: parsed.metadados.codigoBase,
        num_blocos: parsed.metadados.numBlocos,
        pontos_totais: parsed.metadados.pontosTotais,
        pontos_por_quiz: parsed.metadados.pontosPorQuiz
      }))

      // Tentar encontrar disciplina correspondente
      const disciplinaEncontrada = disciplinas.find(d => 
        d.nome.toLowerCase().includes(parsed.metadados.disciplina.toLowerCase()) ||
        parsed.metadados.disciplina.toLowerCase().includes(d.nome.toLowerCase())
      )
      
      if (disciplinaEncontrada) {
        setForm(prev => ({ ...prev, disciplina_id: disciplinaEncontrada.id }))
      }

      setShowPreview(true)
      setErrors({})
    } catch (error) {
      console.error('Erro ao parsear:', error)
      setErrors({ 
        documento_md: `Erro ao parsear: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      })
      setParsedData(null)
    }
  }

  const verificarBlocosExistentes = async (codigoBase: string) => {
    const { data, error } = await supabase
      .from('blocos_templates')
      .select('codigo_bloco, id, titulo, quiz_id')
      .like('codigo_bloco', `${codigoBase}-%`)
    
    if (error) {
      console.error('Erro ao verificar blocos existentes:', error)
      return []
    }
    
    return data || []
  }

  const parsearECriarBlocos = async (
    planejamentoId: string,
    codigoBase: string,
    disciplinaId: string,
    pontosPorQuiz: number,
    substituirExistentes: boolean = false
  ) => {
    if (!parsedData) {
      throw new Error('Dados parseados não disponíveis')
    }

    console.log('📦 Criando blocos a partir dos dados parseados...')
    
    // Verificar blocos existentes
    const blocosExistentes = await verificarBlocosExistentes(codigoBase)
    
    if (blocosExistentes.length > 0 && !substituirExistentes) {
      console.log(`⚠️ Encontrados ${blocosExistentes.length} blocos existentes com código base ${codigoBase}`)
      throw new Error(`Já existem ${blocosExistentes.length} blocos com o código ${codigoBase}. Use a opção "Substituir Existentes" ou altere o Código Base.`)
    }

    // Se deve substituir, deletar blocos existentes primeiro
    if (substituirExistentes && blocosExistentes.length > 0) {
      console.log(`🗑️ Deletando ${blocosExistentes.length} blocos existentes...`)
      
      // Deletar quizzes relacionados primeiro
      const quizIds = blocosExistentes
        .map(b => b.quiz_id)
        .filter(id => id !== null)
      
      if (quizIds.length > 0) {
        await supabase.from('quizzes').delete().in('id', quizIds)
      }
      
      // Deletar blocos
      await supabase
        .from('blocos_templates')
        .delete()
        .like('codigo_bloco', `${codigoBase}-%`)
      
      console.log('✅ Blocos existentes deletados')
    }
    
    const blocosData = parsedData.blocos.map((bloco) => ({
      planejamento_id: planejamentoId,
      disciplina_id: disciplinaId,
      codigo_bloco: `${codigoBase}-${bloco.numero}`,
      numero_sequencia: bloco.numero,
      titulo: bloco.titulo,
      conteudo_texto: bloco.conteudo,
      pontos_bloco: pontosPorQuiz,
      status: 'incompleto'
    }))

    console.log(`📦 ${blocosData.length} blocos preparados, inserindo via RPC...`)

    const { data: insertedCount, error } = await supabase.rpc('insert_blocos_templates_admin', {
      blocos_json: blocosData
    })

    console.log('📦 RPC insert_blocos_templates_admin:', { insertedCount, error })

    if (error) {
      console.error('❌ Erro detalhado ao criar blocos:', JSON.stringify(error, null, 2))
      return { blocosData, error }
    }

    // Criar quizzes para blocos que têm quiz parseado
    console.log('🎯 Criando quizzes automaticamente...')
    await criarQuizzes(codigoBase, pontosPorQuiz)

    return { blocosData, error: null }
  }

  const criarQuizzes = async (codigoBase: string, pontosPorQuiz: number) => {
    if (!parsedData) {
      console.log('❌ parsedData não disponível')
      return
    }

    console.log('📊 Parsed Data:', {
      totalBlocos: parsedData.blocos.length,
      primeiroBloco: parsedData.blocos[0]
    })

    const blocosComQuiz = parsedData.blocos.filter(b => b.quiz !== null)
    
    if (blocosComQuiz.length === 0) {
      console.log('⚠️ Nenhum quiz encontrado nos blocos')
      console.log('📊 Exemplo de bloco:', parsedData.blocos[0])
      return
    }

    console.log(`🎯 Encontrados ${blocosComQuiz.length} blocos com quiz`)
    console.log('📊 Primeiro bloco com quiz:', blocosComQuiz[0])

    // Buscar os blocos criados para obter os IDs
    const { data: blocosCreated, error: fetchError } = await supabase
      .from('blocos_templates')
      .select('id, codigo_bloco')
      .like('codigo_bloco', `${codigoBase}-%`)

    if (fetchError || !blocosCreated) {
      console.error('Erro ao buscar blocos criados:', fetchError)
      return
    }

    // Preparar dados dos quizzes
    console.log('📊 Blocos criados no DB:', blocosCreated)
    
    const quizzesData = blocosComQuiz.map((bloco) => {
      const codigoBloco = `${codigoBase}-${bloco.numero}`
      console.log(`🔍 Procurando bloco com código: ${codigoBloco}`)
      
      const blocoCreated = blocosCreated.find(
        b => b.codigo_bloco === codigoBloco
      )
      
      if (!blocoCreated) {
        console.log(`❌ Bloco ${codigoBloco} não encontrado no DB`)
        return null
      }
      
      if (!bloco.quiz) {
        console.log(`❌ Bloco ${codigoBloco} não tem quiz`)
        return null
      }

      console.log(`✅ Bloco ${codigoBloco} encontrado:`, {
        id: blocoCreated.id,
        quiz: bloco.quiz
      })

      return {
        bloco_template_id: blocoCreated.id,
        titulo: `Quiz - ${bloco.titulo}`,
        pergunta: bloco.quiz.pergunta,
        opcoes: bloco.quiz.opcoes,
        correct_index: bloco.quiz.respostaCorretaIndex,
        pontos: pontosPorQuiz
      }
    }).filter(q => q !== null)

    if (quizzesData.length === 0) {
      console.log('⚠️ Nenhum quiz válido para inserir')
      return
    }

    console.log(`🎯 Inserindo ${quizzesData.length} quizzes...`)
    console.log('📊 Dados dos quizzes:', quizzesData)

    const { data: result, error: quizError } = await supabase.rpc('insert_quizzes_batch', {
      quizzes_data: quizzesData
    })

    if (quizError) {
      console.error('❌ Erro ao criar quizzes:', quizError)
      console.error('❌ Erro detalhado:', JSON.stringify(quizError, null, 2))
      const errorMsg = quizError?.message || 'Erro desconhecido ao criar quizzes'
      toast.error(`Blocos criados, mas erro ao criar quizzes: ${errorMsg}`)
    } else {
      console.log('✅ Quizzes criados com sucesso:', result)
      toast.success(`${quizzesData.length} quizzes criados automaticamente!`)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validar com Zod
    const validation = importPlanejamentoSchema.safeParse(form)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message
        }
      })
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    // Verificar se foi parseado
    if (!parsedData) {
      setErrors({ submit: 'Clique em "Parsear Documento" antes de importar' })
      setLoading(false)
      return
    }

    try {
      console.log('📝 Iniciando inserção de planejamento via RPC...')
      
      // 1. Inserir planejamento via RPC
      const rpcPromise = supabase.rpc('insert_planejamento_admin', {
        p_disciplina_id: form.disciplina_id,
        p_turma: form.turma,
        p_titulo: form.titulo,
        p_documento_md: form.documento_md,
        p_num_blocos: form.num_blocos,
        p_pontos_totais: form.pontos_totais,
        p_pontos_por_quiz: form.pontos_por_quiz,
        p_codigo_base: form.codigo_base,
        p_status: 'processado'
      })

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: RPC demorou mais de 30 segundos')), 30000)
      )

      console.log('📝 Aguardando resposta do RPC...')
      const { data: planejamento, error: planError } = await Promise.race([
        rpcPromise,
        timeoutPromise
      ]) as { data: { id: string }[] | null, error: Error | null }

      if (planError || !planejamento || planejamento.length === 0) {
        console.error('❌ Erro ao criar planejamento:', planError)
        setErrors({ submit: planError?.message || 'Erro ao criar planejamento' })
        setLoading(false)
        return
      }

      const planejamentoData = Array.isArray(planejamento) ? planejamento[0] : planejamento
      
      if (!planejamentoData?.id) {
        setErrors({ submit: 'Erro: planejamento criado mas sem ID retornado' })
        setLoading(false)
        return
      }
      
      console.log('✅ Planejamento criado:', planejamentoData.id)

      // 2. Criar blocos com parsing
      const { error: blocosError } = await parsearECriarBlocos(
        planejamentoData.id,
        form.codigo_base,
        form.disciplina_id,
        form.pontos_por_quiz,
        form.substituir_existentes
      )

      if (blocosError) {
        console.error('❌ Erro ao criar blocos:', blocosError)
        console.error('❌ Erro detalhado:', JSON.stringify(blocosError, null, 2))
        const errorMsg = blocosError.message || blocosError.details || 'Erro desconhecido'
        setErrors({ submit: `Planejamento criado, mas erro ao criar blocos: ${errorMsg}` })
        toast.error(`Erro ao criar blocos: ${errorMsg}`)
        setLoading(false)
        return
      }

      console.log('🎉 Importação concluída com sucesso!')
      router.push('/admin/blocos')
      router.refresh()
    } catch (err: unknown) {
      console.error('💥 Exceção ao importar:', err)
      
      const errorMessage = err instanceof Error && err?.message?.includes('Timeout') 
        ? 'Operação demorou muito tempo. O servidor pode estar sobrecarregado. Verifique se o planejamento foi criado no banco de dados.'
        : err instanceof Error ? err.message : 'Erro inesperado ao importar planejamento'
      
      setErrors({ submit: errorMessage })
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/admin/blocos" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para blocos
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Importar Planejamento</h1>
        <p className="text-slate-600 mt-1">
          Cole o documento markdown e importe automaticamente
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Textarea do documento */}
          <div>
            <label htmlFor="documento_md" className="block text-sm font-medium text-slate-700 mb-1">
              Documento Base (Markdown) *
            </label>
            <textarea
              id="documento_md"
              rows={12}
              value={form.documento_md}
              onChange={(e) => {
                setForm({ ...form, documento_md: e.target.value })
                setParsedData(null)
                setShowPreview(false)
              }}
              required
              disabled={loading}
              placeholder="Cole aqui o planejamento em markdown..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            {errors.documento_md && (
              <p className="text-sm text-red-600 mt-1 whitespace-pre-line">{errors.documento_md}</p>
            )}
            
            <div className="mt-3 flex gap-2">
              <Button 
                type="button" 
                onClick={handleParsearDocumento}
                disabled={!form.documento_md.trim() || loading}
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Parsear Documento
              </Button>
              
              {parsedData && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {parsedData.blocos.length} blocos detectados
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Preview dos dados parseados */}
          {showPreview && parsedData && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Dados Extraídos Automaticamente
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Título:</span>
                  <p className="text-blue-900">{parsedData.metadados.titulo}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Disciplina:</span>
                  <p className="text-blue-900">{parsedData.metadados.disciplina}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Turma:</span>
                  <p className="text-blue-900">{parsedData.metadados.turma}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Código Base:</span>
                  <p className="text-blue-900">{parsedData.metadados.codigoBase}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Blocos:</span>
                  <p className="text-blue-900">{parsedData.blocos.length}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Com Quiz:</span>
                  <p className="text-blue-900">
                    {parsedData.blocos.filter(b => b.quiz !== null).length}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Formulário com campos preenchidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">
                Título do Planejamento *
              </label>
              <Input
                id="titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                required
                disabled={loading}
                placeholder="Ex: Algoritmos 1º Ano - 30 Semanas"
              />
              {errors.titulo && <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>}
            </div>

            <div>
              <label htmlFor="disciplina_id" className="block text-sm font-medium text-slate-700 mb-1">
                Disciplina *
              </label>
              <div className="flex gap-2">
                <select
                  id="disciplina_id"
                  value={form.disciplina_id}
                  onChange={(e) => setForm({ ...form, disciplina_id: e.target.value })}
                  required
                  disabled={loading || loadingDisciplinas}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {loadingDisciplinas ? 'Carregando...' : disciplinas.length === 0 ? 'Nenhuma disciplina encontrada' : 'Selecione...'}
                  </option>
                  {disciplinas.map((disc) => (
                    <option key={disc.id} value={disc.id}>
                      {disc.icone} {disc.nome}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLoadingDisciplinas(true)
                    loadDisciplinas()
                  }}
                  disabled={loadingDisciplinas}
                  className="px-3"
                  title="Recarregar disciplinas"
                >
                  🔄
                </Button>
              </div>
              {errors.disciplina_id && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">{errors.disciplina_id}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="turma" className="block text-sm font-medium text-slate-700 mb-1">
                Turma *
              </label>
              <Input
                id="turma"
                type="text"
                value={form.turma}
                onChange={(e) => setForm({ ...form, turma: e.target.value })}
                required
                disabled={loading}
                placeholder="Ex: EF2-5"
              />
              <p className="text-xs text-slate-500 mt-1">Formato: EF1-3, EF2-5, etc.</p>
              {errors.turma && <p className="text-sm text-red-600 mt-1">{errors.turma}</p>}
            </div>

            <div>
              <label htmlFor="codigo_base" className="block text-sm font-medium text-slate-700 mb-1">
                Código Base *
              </label>
              <Input
                id="codigo_base"
                type="text"
                value={form.codigo_base}
                onChange={(e) => setForm({ ...form, codigo_base: e.target.value.toUpperCase() })}
                required
                disabled={loading}
                placeholder="Ex: ALG-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Blocos serão numerados como: {form.codigo_base || 'ALG-1'}-1, {form.codigo_base || 'ALG-1'}-2, etc.
              </p>
              {errors.codigo_base && <p className="text-sm text-red-600 mt-1">{errors.codigo_base}</p>}
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="substituir_existentes"
                checked={form.substituir_existentes}
                onChange={(e) => setForm({ ...form, substituir_existentes: e.target.checked })}
                disabled={loading}
                className="w-5 h-5 text-yellow-600 border-yellow-300 rounded focus:ring-yellow-500"
              />
              <label htmlFor="substituir_existentes" className="text-sm text-slate-700 cursor-pointer">
                <span className="font-semibold">Substituir blocos existentes</span>
                <p className="text-xs text-slate-600 mt-1">
                  Se já existirem blocos com o mesmo Código Base, eles serão deletados e recriados.
                  Use isso para atualizar blocos ou corrigir erros.
                </p>
              </label>
            </div>

            <div>
              <label htmlFor="num_blocos" className="block text-sm font-medium text-slate-700 mb-1">
                Número de Blocos *
              </label>
              <Input
                id="num_blocos"
                type="number"
                min="1"
                max="100"
                value={form.num_blocos}
                onChange={(e) => setForm({ ...form, num_blocos: parseInt(e.target.value) || 1 })}
                required
                disabled={loading}
              />
              {errors.num_blocos && <p className="text-sm text-red-600 mt-1">{errors.num_blocos}</p>}
            </div>

            <div>
              <label htmlFor="pontos_totais" className="block text-sm font-medium text-slate-700 mb-1">
                Pontos Totais *
              </label>
              <Input
                id="pontos_totais"
                type="number"
                min="1"
                value={form.pontos_totais}
                onChange={(e) => setForm({ ...form, pontos_totais: parseInt(e.target.value) || 1 })}
                required
                disabled={loading}
              />
              {errors.pontos_totais && <p className="text-sm text-red-600 mt-1">{errors.pontos_totais}</p>}
            </div>

            <div>
              <label htmlFor="pontos_por_quiz" className="block text-sm font-medium text-slate-700 mb-1">
                Pontos por Quiz *
              </label>
              <Input
                id="pontos_por_quiz"
                type="number"
                min="1"
                value={form.pontos_por_quiz}
                onChange={(e) => setForm({ ...form, pontos_por_quiz: parseInt(e.target.value) || 1 })}
                required
                disabled={loading}
              />
              {errors.pontos_por_quiz && <p className="text-sm text-red-600 mt-1">{errors.pontos_por_quiz}</p>}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || !parsedData}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Importar e Gerar Blocos'
              )}
            </Button>
            <Link href="/admin/blocos">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
