'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  const [error, setError] = useState('')
  const [step, setStep] = useState<'session' | 'student' | 'auth'>('session')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()

  const icons = ['dog', 'cat', 'fruit', 'flower']

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
      return
    }
    
    setLoading(true)
    setError('')

    try {
      console.log('🔍 Buscando sessão com código:', sessionCode.toUpperCase())
      
      // Buscar sessão ativa pelo código (sem timeout para debug)
      console.time('⏱️ Tempo de busca da sessão')
      
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, status, aula_id, turma_id, tenant_id')
        .eq('session_code', sessionCode.toUpperCase())
        .eq('status', 'active')
        .single()
      
      console.timeEnd('⏱️ Tempo de busca da sessão')

      console.log('📊 Sessão encontrada:', session)
      console.log('❌ Erro:', sessionError)

      if (sessionError || !session) {
        console.error('❌ Erro completo:', sessionError)
        throw new Error('Sessão não encontrada ou inativa')
      }

      // Buscar alunos da turma
      console.log('🔍 Buscando alunos da turma:', session.turma_id)
      
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('id, full_name, icone_afinidade, active')
        .eq('turma_id', session.turma_id)
        .eq('active', true)
      
      console.log('✅ Alunos encontrados:', alunos)
      console.log('❌ Erro ao buscar alunos:', alunosError)

      if (alunosError || !alunos?.length) {
        throw new Error('Nenhum aluno encontrado nesta turma')
      }

      // Buscar tenant (separadamente para evitar problemas)
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('id', session.tenant_id)
        .single()

      console.log('🏢 Tenant encontrado:', tenant)

      // Salvar dados da sessão e ir para próximo passo
      sessionStorage.setItem('currentSession', JSON.stringify({
        sessionId: session.id,
        aulaId: session.aula_id,
        turmaId: session.turma_id,
        tenantSlug: tenant?.slug || '',
        tenantName: tenant?.name || '',
        alunos
      }))

      setStep('student')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar sessão')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (alunoId: string) => {
    setStudentId(alunoId)
    // Buscar ícone do aluno
    const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
    const aluno = sessionData.alunos?.find((a: { id: string; icone_afinidade: string }) => a.id === alunoId)
    
    if (aluno?.icone_afinidade) {
      setSelectedIcon(aluno.icone_afinidade)
    }
    
    setStep('auth')
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
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
      
      // Buscar dados do aluno
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select('id, pin_code, icone_afinidade')
        .eq('id', studentId)
        .single()

      console.log('✅ Aluno encontrado:', aluno)
      console.log('❌ Erro ao buscar aluno:', alunoError)

      if (alunoError || !aluno) {
        throw new Error('Aluno não encontrado')
      }

      // Validar PIN e ícone
      if (aluno.pin_code !== pin) {
        console.error('❌ PIN incorreto. Esperado:', aluno.pin_code, 'Fornecido:', pin)
        throw new Error('PIN incorreto')
      }

      if (aluno.icone_afinidade !== selectedIcon) {
        console.error('❌ Ícone incorreto. Esperado:', aluno.icone_afinidade, 'Fornecido:', selectedIcon)
        throw new Error('Ícone incorreto')
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

      localStorage.setItem('studentSession', JSON.stringify(studentSession))
      
      console.log('✅ StudentSession salva:', studentSession)
      console.log('🚀 Redirecionando para:', `/sessao/${sessionData.sessionId}`)

      // Pequeno delay para garantir que o localStorage foi salvo
      await new Promise(resolve => setTimeout(resolve, 100))

      // Redirecionar para a sessão
      console.log('🔄 Executando router.push...')
      router.push(`/sessao/${sessionData.sessionId}`)
      
      console.log('✅ Router.push executado')
    } catch (err) {
      console.error('❌ Erro na autenticação:', err)
      setError(err instanceof Error ? err.message : 'Erro na autenticação')
      setLoading(false)
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
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

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

  const renderAuthStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="rounded-3xl shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 text-center">
          <div className="text-6xl mb-3">🔐</div>
          <h2 className="text-3xl font-black text-white mb-2">Autenticação</h2>
          <p className="text-white/90 font-medium">Confirme seu ícone e digite seu PIN</p>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleAuthSubmit} className="space-y-6">
            {/* Seleção de Ícone */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-700">Seu ícone de afinidade</Label>
              <div className="grid grid-cols-2 gap-4">
                {icons.map((icon) => (
                  <motion.button
                    key={icon}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedIcon(icon)}
                    className={`h-24 rounded-2xl text-5xl transition-all ${
                      selectedIcon === icon
                        ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] shadow-xl scale-105 border-4 border-purple-300'
                        : 'bg-white border-4 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {getEmojiFromIcon(icon)}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* PIN */}
            <div className="space-y-3">
              <Label htmlFor="pin" className="text-lg font-bold text-gray-700">
                PIN (4 dígitos)
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
              />
            </div>

            {error && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full py-6 rounded-2xl text-xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:shadow-2xl transition-all"
                  disabled={loading || !selectedIcon || pin.length !== 4}
                >
                  {loading && <Loader2 className="mr-3 h-6 w-6 animate-spin" />}
                  {loading ? 'Entrando...' : 'Entrar na Aula 🎯'}
                </Button>
              </motion.div>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('student')}
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
