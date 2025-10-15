'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface JoinResponse {
  success: boolean
  data?: {
    student: {
      id: string
      name: string
      studentId: string
    }
    session: {
      id: string
      title: string
      startedAt: string
      lesson: {
        id: string
        title: string
        collection: {
          id: string
          name: string
        }
      }
    }
    quizzes: Array<{
      id: string
      title: string
      description: string
    }>
    hasAnswered: boolean
    joinedAt: string
  }
  error?: string
}

export default function JoinPageClient({ tenant }: { tenant: string }) {
  const sp = useSearchParams()
  const sessionId = sp.get('session') ?? ''
  const code = sp.get('code') ?? ''
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<JoinResponse['data'] | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant,
          sessionId: sessionId || undefined,
          code: code || undefined,
          studentId,
          pin,
        }),
      })

      const result: JoinResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao entrar na sessão')
      }

      if (result.success && result.data) {
        setSuccess(result.data)
      } else {
        throw new Error('Resposta inválida do servidor')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="p-6 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Entrou com sucesso!</CardTitle>
            <CardDescription>
              Bem-vindo, {success.student.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Sessão:</h3>
              <p className="text-sm text-gray-600">{success.session.title}</p>
            </div>
            <div>
              <h3 className="font-semibold">Aula:</h3>
              <p className="text-sm text-gray-600">{success.session.lesson.title}</p>
              <p className="text-xs text-gray-500">Trilha: {success.session.lesson.collection.name}</p>
            </div>
            <div>
              <h3 className="font-semibold">Quizzes disponíveis:</h3>
              <p className="text-sm text-gray-600">{success.quizzes.length} quiz(zes)</p>
            </div>
            {success.hasAnswered && (
              <Alert>
                <AlertDescription>
                  Você já respondeu quizzes nesta sessão.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-sm mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Entrar na Aula</CardTitle>
          <CardDescription>
            Digite seus dados para participar da sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p><strong>Escola:</strong> {tenant}</p>
              <p><strong>Sessão:</strong> {sessionId || code || '—'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium mb-1">
                  ID do Aluno
                </label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Ex: STU001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium mb-1">
                  PIN
                </label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Ex: 1234"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  inputMode="numeric"
                  maxLength={6}
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
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
