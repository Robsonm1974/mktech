'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2, QrCode, Hash } from 'lucide-react'

type LoginMode = 'qr' | 'code'

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
    if (!sessionCode.trim()) return
    
    setLoading(true)
    setError('')

    try {
      // Buscar sessão ativa pelo código
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          status,
          aula_id,
          turma_id,
          tenants(id, name, slug)
        `)
        .eq('session_code', sessionCode.toUpperCase())
        .eq('status', 'active')
        .single()

      if (sessionError || !session) {
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

      // Salvar dados da sessão e ir para próximo passo
      const tenantData = (session.tenants as Array<{ slug: string; name: string }>)?.[0] || null
      sessionStorage.setItem('currentSession', JSON.stringify({
        sessionId: session.id,
        aulaId: session.aula_id,
        turmaId: session.turma_id,
        tenantSlug: tenantData?.slug || '',
        tenantName: tenantData?.name || '',
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

      // Registrar aluno na sessão (atualizar array de participantes)
      try {
        const { data: currentSession } = await supabase
          .from('sessions')
          .select('alunos_participantes')
          .eq('id', sessionData.sessionId)
          .single()

        const participantes = currentSession?.alunos_participantes || []
        if (!participantes.includes(studentId)) {
          participantes.push(studentId)
          
          const { error: updateError } = await supabase
            .from('sessions')
            .update({ alunos_participantes: participantes })
            .eq('id', sessionData.sessionId)

          if (updateError) {
            console.warn('⚠️ Não foi possível registrar aluno na sessão:', updateError)
          } else {
            console.log('✅ Aluno registrado na sessão')
          }
        }
      } catch (err) {
        console.warn('⚠️ Erro ao registrar aluno:', err)
      }

      console.log('🚀 Redirecionando para:', `/sessao/${sessionData.sessionId}`)

      // Redirecionar para a sessão
      router.push(`/sessao/${sessionData.sessionId}`)
    } catch (err) {
      console.error('❌ Erro na autenticação:', err)
      setError(err instanceof Error ? err.message : 'Erro na autenticação')
    } finally {
      setLoading(false)
    }
  }

  const renderSessionStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Entrar na Aula
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code ou digite o código da sessão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle QR/Code */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'qr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('qr')}
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
          <Button
            variant={mode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('code')}
            className="flex items-center gap-2"
          >
            <Hash className="h-4 w-4" />
            Código
          </Button>
        </div>

        <form onSubmit={handleSessionSubmit} className="space-y-4">
          {mode === 'qr' ? (
            <div className="text-center py-8">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                Posicione o QR Code na câmera ou digite o código abaixo
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="sessionCode">
              {mode === 'qr' ? 'Código da Sessão' : 'Digite o código da sessão'}
            </Label>
            <Input
              id="sessionCode"
              type="text"
              placeholder="Ex: AB-94"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              className="text-center text-lg font-mono"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Validando...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderStudentStep = () => {
    const sessionData = JSON.parse(sessionStorage.getItem('currentSession') || '{}')
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selecione seu nome</CardTitle>
          <CardDescription>
            {sessionData.tenantName} - Turma da sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessionData.alunos?.map((aluno: { id: string; full_name: string; icone_afinidade: string }) => (
              <Button
                key={aluno.id}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => handleStudentSelect(aluno.id)}
              >
                <div className="text-left">
                  <div className="font-medium">{aluno.full_name}</div>
                  <div className="text-sm text-gray-500">
                    Ícone: {aluno.icone_afinidade}
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <div className="mt-4">
            <Button
              variant="ghost"
              onClick={() => setStep('session')}
              className="w-full"
            >
              ← Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAuthStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Autenticação</CardTitle>
        <CardDescription>
          Confirme seu ícone e digite seu PIN
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {/* Seleção de Ícone */}
          <div className="space-y-2">
            <Label>Seu ícone de afinidade</Label>
            <div className="grid grid-cols-2 gap-2">
              {icons.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={selectedIcon === icon ? 'default' : 'outline'}
                  onClick={() => setSelectedIcon(icon)}
                  className="h-16 text-lg"
                >
                  {icon === 'dog' && '🐕'}
                  {icon === 'cat' && '🐱'}
                  {icon === 'fruit' && '🍎'}
                  {icon === 'flower' && '🌸'}
                </Button>
              ))}
            </div>
          </div>

          {/* PIN */}
          <div className="space-y-2">
            <Label htmlFor="pin">PIN (4 dígitos)</Label>
            <Input
              id="pin"
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              className="text-center text-lg font-mono"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading || !selectedIcon || pin.length !== 4}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar na Aula'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('student')}
              className="w-full"
            >
              ← Voltar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">MKTECH</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acesso rápido para alunos
          </p>
        </div>

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <EntrarPageContent />
    </Suspense>
  )
}
