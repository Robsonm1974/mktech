'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft, Play } from 'lucide-react'
import { useEffect, useState, Suspense } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { useRouter, useSearchParams } from 'next/navigation'

interface Turma {
  id: string
  name: string
  grade_level: string
}

interface Aula {
  id: string
  titulo: string
  descricao: string
  ano_escolar_id: string
  ano_nome: string
  disciplina_codigo: string
  disciplina_nome: string
}

function IniciarSessaoContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  
  // Captura turmaId da URL (se vier do card da turma)
  const turmaIdFromUrl = searchParams.get('turmaId')
  
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [turmaSelected, setTurmaSelected] = useState<string>(turmaIdFromUrl || '')
  const [aulaSelected, setAulaSelected] = useState<string>('')
  const [loadingTurmas, setLoadingTurmas] = useState(true)
  const [loadingAulas, setLoadingAulas] = useState(true)
  const [creating, setCreating] = useState(false)

  // Carregar turmas do professor
  useEffect(() => {
    const loadTurmas = async () => {
      if (!user) return

      try {
        console.log('📋 Carregando turmas do professor:', user.id)
        
        const { data, error } = await supabase
          .from('turmas')
          .select('id, name, grade_level')
          .eq('professor_id', user.id)
          .order('name')

        if (error) {
          console.error('❌ Erro ao carregar turmas:', error)
          return
        }

        console.log('✅ Turmas carregadas:', data)
        setTurmas(data || [])
        
        // Se veio turmaId da URL, validar que essa turma pertence ao professor
        if (turmaIdFromUrl) {
          const turmaExists = data?.some(t => t.id === turmaIdFromUrl)
          if (!turmaExists) {
            console.error('❌ Turma não pertence ao professor')
            setTurmaSelected('')
          } else {
            console.log('✅ Turma pré-selecionada validada:', turmaIdFromUrl)
          }
        }
      } catch (error) {
        console.error('💥 Erro:', error)
      } finally {
        setLoadingTurmas(false)
      }
    }

    loadTurmas()
  }, [user, supabase, turmaIdFromUrl])

  // Carregar aulas disponíveis
  useEffect(() => {
    const loadAulas = async () => {
      if (!user?.tenant_id || !turmaSelected) {
        setLoadingAulas(false)
        return
      }

      try {
        // Buscar ano escolar da turma selecionada
        const turmaData = turmas.find(t => t.id === turmaSelected)
        if (!turmaData) {
          setLoadingAulas(false)
          return
        }

        // Buscar aulas usando RPC
        const { data, error } = await supabase.rpc('get_aulas_with_relations_admin', {
          p_tenant_id: user.tenant_id,
          p_turma_id: null,
          p_active: null
        })

        if (error) {
          console.error('Erro ao carregar aulas:', error)
          setLoadingAulas(false)
          return
        }

        // Filtrar aulas pelo ano escolar da turma
        const aulasFiltered = (data || []).filter(
          (aula: Aula) => aula.ano_escolar_id === turmaData.grade_level
        )

        setAulas(aulasFiltered)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setLoadingAulas(false)
      }
    }

    loadAulas()
  }, [supabase, user, turmaSelected, turmas])

  const handleIniciarSessao = async () => {
    if (!turmaSelected || !aulaSelected || !user) {
      alert('Selecione uma turma e uma aula')
      return
    }

    setCreating(true)

    try {
      console.log('🚀 Iniciando criação de sessão...')
      console.log('👤 User ID (da tabela users):', user.id)
      console.log('🏢 Tenant ID:', user.tenant_id)
      
      // Gerar código único para a sessão (ex: AB-94)
      const sessionCode = generateSessionCode()

      console.log('📝 Criando sessão com dados:', {
        tenant_id: user.tenant_id,
        aula_id: aulaSelected,
        turma_id: turmaSelected,
        professor_id: user.id,
        session_code: sessionCode
      })

      // Criar sessão (user.id já é o ID da tabela users!)
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          tenant_id: user.tenant_id!,
          aula_id: aulaSelected,
          turma_id: turmaSelected,
          professor_id: user.id,
          session_code: sessionCode,
          session_qr_data: {
            sessionId: '', // Será preenchido após inserção
            aulaId: aulaSelected,
            turmaId: turmaSelected,
            code: sessionCode
          },
          bloco_ativo_numero: 1,
          status: 'active'
        })
        .select()
        .single()

      console.log('✅ Sessão criada:', session)
      console.log('❌ Erro ao criar sessão:', error)

      if (error) {
        console.error('💥 Erro completo ao criar sessão:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        alert('Erro ao criar sessão: ' + error.message)
        return
      }

      // Atualizar QR data com session ID
      await supabase
        .from('sessions')
        .update({
          session_qr_data: {
            sessionId: session.id,
            aulaId: aulaSelected,
            turmaId: turmaSelected,
            code: sessionCode
          }
        })
        .eq('id', session.id)

      console.log('✅ Redirecionando para:', `/dashboard/professor/sessao/${session.id}`)

      // Redirecionar para dashboard da sessão
      router.push(`/dashboard/professor/sessao/${session.id}`)
    } catch (error) {
      console.error('💥 Erro ao criar sessão:', error)
      alert('Erro ao criar sessão: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setCreating(false)
    }
  }

  // Gerar código de sessão único (ex: AB-94)
  const generateSessionCode = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    
    const letter1 = letters.charAt(Math.floor(Math.random() * letters.length))
    const letter2 = letters.charAt(Math.floor(Math.random() * letters.length))
    const num1 = numbers.charAt(Math.floor(Math.random() * numbers.length))
    const num2 = numbers.charAt(Math.floor(Math.random() * numbers.length))
    
    return `${letter1}${letter2}-${num1}${num2}`
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

  const aulaSelectedData = aulas.find(a => a.id === aulaSelected)
  const turmaSelectedData = turmas.find(t => t.id === turmaSelected)
  const isTurmaPreSelected = !!turmaIdFromUrl

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard/professor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Iniciar Nova Sessão
        </h1>
        <p className="text-gray-600 mt-2">
          {isTurmaPreSelected 
            ? 'Selecione uma aula para começar' 
            : 'Selecione uma turma e uma aula para começar'}
        </p>
      </div>

      {/* Formulário */}
      <div className="grid gap-6">
        {/* Selecionar Turma */}
        <Card>
          <CardHeader>
            <CardTitle>1. {isTurmaPreSelected ? 'Turma Selecionada' : 'Selecione a Turma'}</CardTitle>
            <CardDescription>
              {isTurmaPreSelected 
                ? 'Turma já selecionada do card anterior'
                : 'Escolha a turma que participará da aula'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTurmas ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Carregando turmas...</p>
              </div>
            ) : turmas.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Nenhuma turma encontrada</p>
              </div>
            ) : isTurmaPreSelected ? (
              // Turma pré-selecionada (vindo do card)
              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      {turmaSelectedData?.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      {turmaSelectedData?.grade_level}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTurmaSelected('')
                      router.push('/dashboard/professor/iniciar-sessao')
                    }}
                  >
                    Alterar Turma
                  </Button>
                </div>
              </div>
            ) : (
              // Dropdown normal para selecionar turma
              <Select value={turmaSelected} onValueChange={setTurmaSelected}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} - {turma.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Selecionar Aula */}
        <Card>
          <CardHeader>
            <CardTitle>2. Selecione a Aula</CardTitle>
            <CardDescription>
              Escolha o conteúdo que será apresentado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAulas ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Carregando aulas...</p>
              </div>
            ) : aulas.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Nenhuma aula disponível</p>
              </div>
            ) : (
              <Select value={aulaSelected} onValueChange={setAulaSelected}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma aula" />
                </SelectTrigger>
                <SelectContent>
                  {aulas.map((aula) => (
                    <SelectItem key={aula.id} value={aula.id}>
                      {aula.titulo} {aula.disciplina_codigo ? `(${aula.disciplina_codigo})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {aulaSelectedData && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  {aulaSelectedData.titulo}
                </h4>
                <p className="text-sm text-blue-700">
                  {aulaSelectedData.descricao}
                </p>
                <div className="flex gap-4 mt-3 text-sm text-blue-600">
                  <span>📚 {aulaSelectedData.disciplina_nome || 'Disciplina'}</span>
                  <span>📅 {aulaSelectedData.ano_nome || 'Ano'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo e Iniciar */}
        {turmaSelected && aulaSelected && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">3. Confirmar e Iniciar</CardTitle>
              <CardDescription className="text-green-700">
                Revise as informações antes de iniciar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Turma:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {turmaSelectedData?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Aula:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {aulaSelectedData?.titulo}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Disciplina:</span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {aulaSelectedData?.disciplina_nome || 'N/A'}
                  </span>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full h-12 text-lg" 
                    onClick={handleIniciarSessao}
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Criando sessão...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Iniciar Sessão Agora
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-gray-600 mt-2">
                    Um QR Code será gerado para os alunos entrarem
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function IniciarSessaoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <IniciarSessaoContent />
    </Suspense>
  )
}
