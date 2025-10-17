'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Loader2, Trophy, TrendingUp, BookOpen } from 'lucide-react'

export default function RelatorioAlunoPage() {
  const [studentCode, setStudentCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'select' | 'login' | 'report'>('select')
  const [studentData, setStudentData] = useState<{
    id: string
    full_name: string
    email_pais: string
    turmas: { name: string }
    tenants: { name: string }
  } | null>(null)
  const [reportData, setReportData] = useState<{
    progress: { pontos_totais: number; aulas_completadas: number }
    badges: Array<{ id: string; titulo: string }>
    ranking: { posicao: number; total: number }
    recentAulas: Array<{ sessions: { aulas: { titulo: string } }; pontos_ganhos: number; criada_em: string }>
  } | null>(null)
  
  const supabase = createSupabaseBrowserClient()

  const handleStudentSelect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentCode.trim()) return
    
    setLoading(true)
    setError('')

    try {
      // Buscar aluno pelo código
      const { data: aluno, error: alunoError } = await supabase
        .from('alunos')
        .select(`
          id,
          full_name,
          email_pais,
          turmas!inner(id, name, grade_level),
          tenants!inner(id, name, slug)
        `)
        .eq('numero_matricula', studentCode)
        .single()

      if (alunoError || !aluno) {
        throw new Error('Código do aluno não encontrado')
      }

      setStudentData({
        id: aluno.id,
        full_name: aluno.full_name,
        email_pais: aluno.email_pais,
        turmas: { name: (aluno.turmas as Array<{ name: string }>)?.[0]?.name || '' },
        tenants: { name: (aluno.tenants as Array<{ name: string }>)?.[0]?.name || '' }
      })
      setStep('login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar aluno')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar credenciais (simplificado para MVP)
      if (!studentData || email !== studentData.email_pais) {
        throw new Error('Email não confere com o cadastrado')
      }

      // Buscar dados do progresso do aluno
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('aluno_id', studentData.id)
        .single()

      // Buscar badges conquistadas
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .in('id', progress?.badges_conquistadas || [])

      // Buscar histórico de aulas recentes
      const { data: aulas } = await supabase
        .from('quiz_responses')
        .select(`
          pontos_ganhos,
          criada_em,
          sessions!inner(
            aula_id,
            aulas!inner(titulo)
          )
        `)
        .eq('aluno_id', studentData.id)
        .order('criada_em', { ascending: false })
        .limit(10)

      // Buscar ranking na turma
      const { data: ranking } = await supabase
        .from('user_progress')
        .select(`
          aluno_id,
          pontos_totais,
          alunos!inner(full_name, turma_id)
        `)
        .eq('alunos.turma_id', studentData.id)
        .order('pontos_totais', { ascending: false })

      const alunoRanking = (ranking?.findIndex(r => r.aluno_id === studentData.id) ?? -1) + 1
      const totalNaTurma = ranking?.length || 0

      setReportData({
        progress,
        badges: badges || [],
        recentAulas: (aulas || []) as unknown as Array<{ sessions: { aulas: { titulo: string } }; pontos_ganhos: number; criada_em: string }>,
        ranking: {
          posicao: alunoRanking,
          total: totalNaTurma
        }
      })

      setStep('report')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const renderSelectStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Relatório do Aluno</CardTitle>
        <CardDescription>
          Digite o código do seu filho para acessar o relatório
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleStudentSelect} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentCode">Código do Aluno</Label>
            <Input
              id="studentCode"
              type="text"
              placeholder="Ex: 12345 ou JO-1234"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Este código foi fornecido pela escola
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Buscando...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderLoginStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Confirmação de Acesso</CardTitle>
        <CardDescription>
          Aluno: {studentData?.full_name} - {studentData?.turmas?.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Responsável</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha do Aluno</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Use a senha do aluno (PIN ou senha definida)
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Acessando...' : 'Acessar Relatório'}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep('select')}
              className="w-full"
            >
              ← Voltar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )

  const renderReportStep = () => (
    <div className="space-y-6">
      {/* Header do Aluno */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{studentData?.full_name}</CardTitle>
              <CardDescription>
                {studentData?.turmas?.name} - {studentData?.tenants?.name}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              {reportData?.progress?.pontos_totais} pts
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportData?.progress?.pontos_totais || 0}
            </div>
            <div className="text-sm text-gray-600">Pontos Totais</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reportData?.progress?.aulas_completadas || 0}
            </div>
            <div className="text-sm text-gray-600">Aulas Completadas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {reportData?.badges?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Badges Conquistadas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {reportData?.ranking?.posicao || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Posição na Turma</div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {(reportData?.badges?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Badges Conquistadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {reportData?.badges?.map((badge: { id: string; titulo: string }) => (
                <div key={badge.id} className="text-center p-4 border rounded-lg">
                  <div className="text-3xl mb-2">🏅</div>
                  <div className="font-medium">{badge.titulo}</div>
                  <div className="text-sm text-gray-600">Badge conquistada</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Aulas */}
      {(reportData?.recentAulas?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Últimas Aulas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.recentAulas?.slice(0, 5).map((aula: { sessions: { aulas: { titulo: string } }; pontos_ganhos: number; criada_em: string }, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{aula.sessions?.aulas?.titulo || 'Aula'}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(aula.criada_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {aula.pontos_ganhos} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ranking da Turma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {reportData?.ranking?.posicao}º de {reportData?.ranking?.total}
            </div>
            <div className="text-gray-600">
              Seu filho está entre os {Math.round(((reportData?.ranking?.posicao || 1) / (reportData?.ranking?.total || 1)) * 100)}% melhores da turma
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => {
            setStep('select')
            setStudentData(null)
            setReportData(null)
          }}
        >
          ← Ver Outro Aluno
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MKTECH</h1>
          <p className="mt-2 text-lg text-gray-600">
            Relatório de Progresso do Aluno
          </p>
        </div>

        {step === 'select' && renderSelectStep()}
        {step === 'login' && renderLoginStep()}
        {step === 'report' && renderReportStep()}
      </div>
    </div>
  )
}
