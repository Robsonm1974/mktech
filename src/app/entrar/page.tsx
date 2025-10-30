'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
// Removemos Alert visual vermelho; usaremos toasts
import { useToast } from '@/hooks/use-toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2, QrCode, Hash, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

type LoginMode = 'qr' | 'code'

// Helper para converter ícone em emoji
const getEmojiFromIcon = (icon: string): string => {
  const iconMap: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
    fruit: '🍎',
    flower: '🌸'
  }
  return iconMap[icon] || '🎯'
}

function EntrarPageContent() {
  const [mode, setMode] = useState<LoginMode>('qr')
  const [sessionCode, setSessionCode] = useState('')
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string>('')
  const [loading, setLoading] = useState(false)
  // Não exibimos erro em faixa vermelha; usamos toast
  const [, setError] = useState('')
  const [step, setStep] = useState<'session' | 'student' | 'auth'>('session')
  const { toast } = useToast()
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const sessionInputRef = useRef<HTMLInputElement | null>(null)
  const pinInputRef = useRef<HTMLInputElement | null>(null)

  // Modal lúdico de erro
  const [errorOpen, setErrorOpen] = useState(false)
  const [attemptsByStudent, setAttemptsByStudent] = useState<Record<string, number>>({})
  const [errorData, setErrorData] = useState<{
    type: 'pin' | 'session'
    title: string
    description: string
    studentName?: string
    icon?: string
    attemptsLeft?: number
  } | null>(null)

  const icons = ['dog', 'cat', 'fruit', 'flower']

  const alunoSelecionadoNome = (id?: string) => {
    if (!id) return undefined
    try {
      const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
      const aluno = sessionData.alunos?.find((a: { id: string; full_name: string }) => a.id === id)
      return aluno?.full_name as string | undefined
    } catch {
      return undefined
    }
  }

  // Ler código da URL se vier do QR Code
  useEffect(() => {
    const codeFromUrl = searchParams?.get('code')
    if (codeFromUrl && !sessionCode) {
      console.log('📱 QR Code detectado. Código:', codeFromUrl)
      setSessionCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams, sessionCode])

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionCode.trim()) {
      setError('Digite o código da sessão')
      toast({ title: 'Código da sessão', description: 'Digite o código para continuar.', duration: 2200 })
      return
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('🔍 Buscando sessão com código:', sessionCode.toUpperCase())
      
      // Buscar sessão ativa pelo código usando RPC pública (bypass RLS)
      console.time('⏱️ Tempo de busca da sessão')
      
      const { data: resultData, error: rpcError } = await supabase.rpc(
        'get_session_by_code_public',
        { p_session_code: sessionCode.toUpperCase() }
      )
      
      console.timeEnd('⏱️ Tempo de busca da sessão')

      console.log('📊 Resultado RPC:', resultData)
      console.log('❌ Erro RPC:', rpcError)

      if (rpcError || !resultData) {
        console.warn('Sessão não encontrada ou inativa:', rpcError)
        setLoading(false)
        setStep('session')
        setErrorData({
          type: 'session',
          title: 'Código inválido',
          description: 'Verifique o código ou peça um novo QR.'
        })
        setErrorOpen(true)
        return
      }

      // Extrair dados do JSON retornado (sessão + alunos + tenant)
      const session = resultData.session
      const alunos = resultData.alunos || []
      const tenant = resultData.tenant

      console.log('✅ Sessão:', session)
      console.log('✅ Alunos:', alunos)
      console.log('✅ Tenant:', tenant)

      if (!alunos || alunos.length === 0) {
        throw new Error('Nenhum aluno encontrado nesta turma')
      }

      // Salvar dados da sessão e ir para próximo passo
      sessionStorage.setItem('currentSession', JSON.stringify({
        sessionId: session.id,
        aulaId: session.aula_id,
        turmaId: session.turma_id,
        tenantSlug: tenant?.slug || '',
        tenantName: tenant?.name || '',
        alunos: alunos
      }))

      setStep('student')
    } catch (err) {
      console.warn('Falha ao validar sessão:', err)
      toast({ title: 'Falha na validação', description: 'Tente novamente em instantes.', duration: 2200 })
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (alunoId: string) => {
    setStudentId(alunoId)
    // Buscar ícone do aluno e setar automaticamente
    const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
    const aluno = sessionData.alunos?.find((a: { id: string; icone_afinidade: string }) => a.id === alunoId)
    
    if (aluno?.icone_afinidade) {
      setSelectedIcon(aluno.icone_afinidade)
      console.log('✅ Ícone do aluno setado automaticamente:', aluno.icone_afinidade)
    }
    
    // Limpar estados anteriores
    setPin('')
    setError('')
    
    setStep('auth')
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Bloqueio por excesso de tentativas (3)
      const attempts = attemptsByStudent[studentId] || 0
      if (attempts >= 3) {
        setLoading(false)
        setErrorData({
          type: 'pin',
          title: 'Muitas tentativas',
          description: 'Por segurança, reinicie o processo informando o código da sessão.',
          studentName: alunoSelecionadoNome(studentId),
          icon: selectedIcon,
          attemptsLeft: 0,
        })
        setErrorOpen(true)
        return
      }

      const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
      
      // Logging detalhado
      console.log('🔐 Tentando autenticar aluno...')
      console.log('📦 SessionData:', sessionData)
      console.log('👤 StudentId:', studentId)
      console.log('🔑 PIN fornecido:', pin.length, 'dígitos')
      console.log('🎨 Ícone selecionado:', selectedIcon)
      
      // Verificar se sessionData está válido
      if (!sessionData.sessionId) {
        throw new Error('SessionId não encontrado. Recomece o processo.')
      }
      
      // Validar PIN usando RPC pública (bypass RLS)
      const { data: validationResult, error: validationError } = await supabase.rpc(
        'validate_student_pin',
        { 
          p_aluno_id: studentId,
          p_pin: pin
        }
      )

      console.log('✅ Resultado validação:', validationResult)
      console.log('❌ Erro validação:', validationError)

      if (validationError || !validationResult) {
        setLoading(false)
        toast({ title: 'Erro na validação', description: 'Tente novamente.', duration: 2200 })
        return
      }

      if (!validationResult.valid) {
        const errorMsg = validationResult.error || 'Erro desconhecido'
        
        if (errorMsg === 'Aluno não encontrado') {
          setLoading(false)
          toast({ title: 'Aluno não encontrado', description: 'Volte e selecione novamente.', duration: 2200 })
          return
        }
        
        // PIN incorreto
        if (errorMsg === 'PIN incorreto') {
          const current = attemptsByStudent[studentId] || 0
          const next = current + 1
          const attemptsLeft = Math.max(0, 3 - next)
          setAttemptsByStudent({ ...attemptsByStudent, [studentId]: next })
          setPin('')
          setLoading(false)
          setErrorData({
            type: 'pin',
            title: 'Senha Incorreta',
            description: 'O PIN digitado não está correto. Verifique e tente novamente.',
            studentName: alunoSelecionadoNome(studentId),
            icon: selectedIcon,
            attemptsLeft
          })
          setErrorOpen(true)
          return
        }
      }

      // PIN válido, verificar se o ícone corresponde
      const alunoIcone = validationResult.icone_afinidade
      if (alunoIcone !== selectedIcon) {
        console.warn('Ícone divergente; retornando para seleção de aluno')
        setLoading(false)
        setStep('student')
        toast({ title: 'Confirme seu ícone', description: 'Selecione o aluno novamente para confirmar.', duration: 2500 })
        return
      }

      console.log('✅ Validação bem-sucedida!')

      // Criar sessão do aluno
      const studentSession = {
        alunoId: studentId,
        sessionId: sessionData.sessionId,
        tenantSlug: sessionData.tenantSlug,
        authenticated: true,
        timestamp: Date.now()
      }

      const storageKey = `studentSession:${sessionData.sessionId}`
      sessionStorage.setItem(storageKey, JSON.stringify(studentSession))
      
      console.log('✅ StudentSession salva:', studentSession)
      console.log('🚀 Redirecionando para:', `/sessao/${sessionData.sessionId}`)

      // Pequeno delay para garantir que o localStorage foi salvo
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirecionar para a sessão
      console.log('🔄 Executando router.push...')
      router.push(`/sessao/${sessionData.sessionId}`)
      
      console.log('✅ Router.push executado')
    } catch (err) {
      console.warn('Erro inesperado na autenticação:', err)
      toast({ title: 'Erro na autenticação', description: 'Tente novamente.', duration: 2200 })
      setLoading(false)
      setPin('')
    }
  }

  const renderSessionStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-3xl shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-center">
          <div className="text-6xl mb-3">🚀</div>
          <h2 className="text-3xl font-black text-white mb-2">Entrar na Aula</h2>
          <p className="text-white/90 font-medium">Escaneie o QR ou digite o código</p>
        </div>

        <CardContent className="p-8">
          {/* Toggle QR/Code */}
          <div className="flex gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('qr')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                mode === 'qr'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <QrCode className="inline-block w-5 h-5 mr-2" />
              QR Code
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMode('code')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                mode === 'code'
                  ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Hash className="inline-block w-5 h-5 mr-2" />
              Código
            </motion.button>
          </div>

          <form onSubmit={handleSessionSubmit} className="space-y-6">
            {mode === 'qr' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                  <QrCode className="w-32 h-32 text-[#667eea]" />
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  Posicione o QR Code na câmera
                </p>
              </motion.div>
            )}

            <div className="space-y-3">
              <Label htmlFor="sessionCode" className="text-lg font-bold text-gray-700">
                Código da Sessão
              </Label>
              <Input
                id="sessionCode"
                type="text"
                placeholder="Ex: AB-94"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                className="text-center text-3xl font-black py-6 rounded-2xl border-4 border-purple-200 focus:border-purple-500 transition-all"
                required
                ref={sessionInputRef}
              />
            </div>

            {/* Feedback visual via toast; removido alerta vermelho */}

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full py-6 rounded-2xl text-xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-2xl transition-all"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-3 h-6 w-6 animate-spin" />}
                {loading ? 'Validando...' : 'Continuar 🚀'}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderStudentStep = () => {
    const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="rounded-3xl shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-center">
            <div className="text-6xl mb-3">👋</div>
            <h2 className="text-3xl font-black text-white mb-2">Selecione seu nome</h2>
            <p className="text-white/90 font-medium">{sessionData.tenantName} - Turma da sessão</p>
          </div>

          <CardContent className="p-8 space-y-4">
            {sessionData.alunos?.map((aluno: { id: string; full_name: string; icone_afinidade: string }, index: number) => (
              <motion.button
                key={aluno.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 8 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleStudentSelect(aluno.id)}
                className="w-full p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl border-4 border-transparent hover:border-purple-300 transition-all shadow-md hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                    {getEmojiFromIcon(aluno.icone_afinidade)}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-2xl font-black text-gray-800">{aluno.full_name}</p>
                    <p className="text-sm text-gray-600 font-medium">Clique para continuar</p>
                  </div>
                  <div className="text-3xl">→</div>
                </div>
              </motion.button>
            ))}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep('session')}
              className="w-full mt-6 py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const renderAuthStep = () => {
    const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
    const alunoSelecionado = sessionData.alunos?.find((a: { id: string; full_name: string; icone_afinidade: string }) => a.id === studentId)
    const attempts = attemptsByStudent[studentId] || 0
    const attemptsLeft = Math.max(0, 3 - attempts)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="rounded-3xl shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-center">
            <div className="text-6xl mb-3">🔐</div>
            <h2 className="text-3xl font-black text-white mb-2">Autenticação</h2>
            <p className="text-white/90 font-medium">Confirme sua identidade</p>
          </div>

          <CardContent className="p-8">
            {/* Mostrar aluno selecionado */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl border-4 border-purple-200"
            >
              <p className="text-sm text-gray-600 font-medium text-center mb-3">Você selecionou:</p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center text-5xl shadow-lg">
                  {getEmojiFromIcon(alunoSelecionado?.icone_afinidade || '')}
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-gray-800">{alunoSelecionado?.full_name}</p>
                  <p className="text-sm text-gray-600 font-medium">Este é seu ícone</p>
                </div>
              </div>
            </motion.div>

            <form onSubmit={handleAuthSubmit} className="space-y-6">
              {/* PIN */}
              <div className="space-y-3">
                <Label htmlFor="pin" className="text-lg font-bold text-gray-700 text-center block">
                  Digite seu PIN (4 dígitos)
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  maxLength={4}
                  className="text-center text-4xl font-black py-6 rounded-2xl border-4 border-purple-200 focus:border-purple-500 transition-all tracking-widest"
                  required
                  autoFocus
                  ref={pinInputRef}
                />
              </div>

              {/* Feedback visual via toast; removido alerta vermelho */}

              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full py-6 rounded-2xl text-xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-2xl transition-all"
                  disabled={loading || pin.length !== 4 || attemptsLeft === 0}
                  >
                    {loading && <Loader2 className="mr-3 h-6 w-6 animate-spin" />}
                    {loading ? 'Entrando...' : 'Entrar na Aula 🎯'}
                  </Button>
                </motion.div>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep('student')
                    setPin('')
                    setError('')
                  }}
                  className="w-full py-4 rounded-2xl bg-gray-100 hover:bg-gray-200 font-bold text-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Voltar
                </motion.button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] py-8 px-4 flex items-center justify-center">
      <div className="max-w-lg w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-6xl font-black text-white mb-3 drop-shadow-lg">
            🚀 MK-SMART
          </h1>
          <p className="text-2xl text-white/90 font-bold">
            Acesso Rápido para Alunos
          </p>
        </motion.div>

        {step === 'session' && renderSessionStep()}
        {step === 'student' && renderStudentStep()}
        {step === 'auth' && renderAuthStep()}
      </div>

      {/* Modal lúdico para erros de sessão/PIN */}
      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent className="p-0 bg-transparent border-0 shadow-none">
          {/* Acessibilidade: Title/Description para Radix */}
          <DialogTitle className="sr-only">{errorData?.title || 'Aviso'}</DialogTitle>
          <DialogDescription className="sr-only">{errorData?.description || 'Mensagem do sistema'}</DialogDescription>
          <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  <line x1="12" y1="15" x2="12" y2="18"></line>
                </svg>
              </div>
              <h2 className="text-white text-2xl font-black">{errorData?.title || 'Algo deu errado'}</h2>
              <p className="text-white/90 mt-1">{errorData?.type === 'pin' ? 'Não foi possível acessar' : 'Tente novamente'}</p>
            </div>

            <div className="p-6 space-y-4">
              {errorData?.type === 'pin' && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-3xl">
                    {getEmojiFromIcon(errorData?.icon || '')}
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-gray-800">{errorData?.studentName || 'Aluno'}</div>
                    <div className="text-sm text-gray-600">Tentando entrar...</div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 text-center">
                <div className="text-4xl mb-1">❌</div>
                <div className="text-red-700 font-bold mb-1">{errorData?.title}</div>
                <div className="text-gray-600 text-sm">{errorData?.description}</div>
              </div>

              {typeof errorData?.attemptsLeft === 'number' && (
                <div className="text-center mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold">
                  ⚠️ Tentativas restantes: {errorData?.attemptsLeft} de 3
                </div>
              )}

              <div className="flex flex-col gap-3 mt-2">
                <Button
                  className="w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                  onClick={() => {
                    setErrorOpen(false)
                    setTimeout(() => {
                      if (errorData?.type === 'pin' && (errorData?.attemptsLeft ?? 1) > 0) {
                        pinInputRef.current?.focus()
                      } else {
                        setStep('session')
                        sessionInputRef.current?.focus()
                      }
                    }, 60)
                  }}
                >
                  🔄 Tentar Novamente
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-4 rounded-xl text-base font-bold"
                  onClick={() => {
                    toast({ title: 'Chamando Professor', description: 'Seu professor foi avisado.', duration: 2000 })
                    setErrorOpen(false)
                  }}
                >
                  🙋 Chamar Professor
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function EntrarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-white mx-auto mb-4" />
          <p className="text-2xl font-black text-white">Carregando...</p>
        </div>
      </div>
    }>
      <EntrarPageContent />
    </Suspense>
  )
}
