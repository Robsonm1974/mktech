'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<Record<string, unknown> | null>(null)
  const [disciplinasInfo, setDisciplinasInfo] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    runDiagnostics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    
    // 1. Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    setSessionInfo({
      hasSession: !!session,
      sessionError: sessionError?.message || null,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      userRole: session?.user?.role || null,
      accessToken: session?.access_token?.substring(0, 50) + '...' || null,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null
    })

    // 2. Tentar buscar disciplinas
    const { data: disciplinas, error: discError, status, statusText } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('ativa', true)
      .order('nome')
    
    setDisciplinasInfo({
      hasData: !!disciplinas,
      dataLength: disciplinas?.length || 0,
      data: disciplinas,
      hasError: !!discError,
      error: discError,
      errorCode: discError?.code || null,
      errorMessage: discError?.message || null,
      errorDetails: discError?.details || null,
      errorHint: discError?.hint || null,
      status,
      statusText
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Diagnóstico de Sessão</h1>
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Diagnóstico de Sessão e Acesso</h1>
        <Button onClick={runDiagnostics}>🔄 Recarregar</Button>
      </div>

      {/* Sessão */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          {sessionInfo?.hasSession ? '✅' : '❌'} Sessão de Autenticação
        </h2>
        <pre className="bg-slate-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </Card>

      {/* Disciplinas */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          {disciplinasInfo?.hasData ? '✅' : '❌'} Query Disciplinas
        </h2>
        
        {disciplinasInfo?.hasError ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="font-bold text-red-700">ERRO DETECTADO:</p>
            <p className="text-sm text-red-600 mt-2">
              <strong>Code:</strong> {String(disciplinasInfo.errorCode || 'N/A')}
            </p>
            <p className="text-sm text-red-600">
              <strong>Message:</strong> {String(disciplinasInfo.errorMessage || 'N/A')}
            </p>
            <p className="text-sm text-red-600">
              <strong>Details:</strong> {String(disciplinasInfo.errorDetails || 'N/A')}
            </p>
            <p className="text-sm text-red-600">
              <strong>Hint:</strong> {String(disciplinasInfo.errorHint || 'N/A')}
            </p>
            <p className="text-sm text-red-600">
              <strong>Status:</strong> {String(disciplinasInfo.status)} {String(disciplinasInfo.statusText)}
            </p>
          </div>
        ) : null}

        <pre className="bg-slate-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
          {JSON.stringify(disciplinasInfo, null, 2)}
        </pre>
      </Card>

      {/* Interpretação */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-bold mb-4">🔍 Interpretação</h2>
        
        {!sessionInfo?.hasSession && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded">
            <p className="font-bold text-red-800">❌ SEM SESSÃO ATIVA</p>
            <p className="text-sm text-red-700 mt-2">
              Você não está autenticado no browser. Faça login novamente em <code>/admin/login</code>
            </p>
          </div>
        )}

        {sessionInfo?.hasSession && !disciplinasInfo?.hasData && disciplinasInfo?.hasError ? (
          <div className="mb-4 p-4 bg-orange-100 border border-orange-300 rounded">
            <p className="font-bold text-orange-800">⚠️ SESSÃO OK, MAS QUERY FALHOU</p>
            <p className="text-sm text-orange-700 mt-2">
              Sua sessão está ativa, mas a query para buscar disciplinas está falhando.
              <br />
              <strong>Possível causa:</strong> RLS bloqueando acesso ou role incorreto.
            </p>
            <p className="text-sm text-orange-700 mt-2">
              <strong>Solução:</strong> Verifique se você executou <code>20241017_rls_disciplinas.sql</code>
            </p>
          </div>
        ) : null}

        {sessionInfo?.hasSession && disciplinasInfo?.hasData ? (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded">
            <p className="font-bold text-green-800">✅ TUDO FUNCIONANDO!</p>
            <p className="text-sm text-green-700 mt-2">
              Sessão ativa e {String(disciplinasInfo.dataLength)} disciplinas carregadas com sucesso.
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}


