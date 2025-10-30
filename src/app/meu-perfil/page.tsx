'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Target, Zap, Award, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

// Tipos
interface StudentSession {
  alunoId: string
  sessionId?: string
  tenantSlug: string
  authenticated: boolean
}

interface ProfileData {
  aluno: {
    id: string
    full_name: string
    icone_afinidade: string
    turma_nome: string
    escola_nome: string
  }
  estatisticas: {
    pontos_totais: number
    nivel: number
    aulas_completadas: number
    taxa_acerto: number
    sequencia_dias: number
  }
  disciplinas: Array<{
    nome: string
    emoji: string
    aulas_completadas: number
    aulas_totais: number
    pontos: number
    progresso: number
  }>
  ranking: {
    posicao: number
    total: number
    top5: Array<{
      nome: string
      pontos: number
      avatar: string
      isCurrentUser: boolean
    }>
  }
  atividades: Array<{
    tipo: 'aula' | 'quiz' | 'conquista'
    titulo: string
    tempo: string
    pontos: number
  }>
  badges: Array<{
    id: string
    nome: string
    icone: string
    desbloqueada: boolean
    data?: string
  }>
}

function MeuPerfilContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isSchoolAdmin, loading: authLoading } = useAuth()
  const supabase = createSupabaseBrowserClient()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Carregar dados do perfil
  useEffect(() => {
    // Aguardar autenticação carregar antes de executar
    if (authLoading) {
      return
    }
    
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, authLoading, user])

  const loadProfile = async () => {
    try {
      let alunoId: string | null = null
      const alunoIdParam = searchParams?.get('aluno_id')

      // CASO 1: Há aluno_id na URL (admin visualizando perfil de outro aluno)
      if (alunoIdParam) {
        // Aguardar autenticação carregar antes de verificar permissões
        if (authLoading) {
          return // Aguarda o próximo ciclo quando authLoading for false
        }

        // Verificar se é admin
        if (isSchoolAdmin() || user?.role === 'admin_escola') {
          alunoId = alunoIdParam
        } else {
          // Não é admin, redirecionar
          console.error('Acesso negado: apenas administradores podem visualizar perfis de outros alunos')
          toast.error('Acesso negado. Você precisa ser administrador para visualizar perfis de alunos.')
          router.push('/dashboard/admin-escola/alunos')
          return
        }
      } else {
        // CASO 2: NÃO há aluno_id (aluno visualizando seu próprio perfil) - LÓGICA ORIGINAL PRESERVADA
        // Compatibilidade: primeiro tenta sessionStorage (novo), depois localStorage (legado)
        let session: StudentSession | null = null

        // Buscar a última sessão de aluno ativa no sessionStorage (chaves studentSession:*)
        try {
          const keys: string[] = Object.keys(sessionStorage)
            .filter((k) => k.startsWith('studentSession:'))
          if (keys.length > 0) {
            // usa a mais recente (ordem do storage não é garantida, mas geralmente a última inserida fica no fim)
            const chosenKey = keys[keys.length - 1] as string
            const value = sessionStorage.getItem(chosenKey)
            if (value) session = JSON.parse(value)
          }
        } catch {}

        // Fallback legado
        if (!session) {
          const legacy = localStorage.getItem('studentSession')
          if (legacy) {
            try { session = JSON.parse(legacy) } catch {}
          }
        }

        if (!session || !session.alunoId) {
          router.push('/entrar')
          return
        }

        alunoId = session.alunoId
      }

      if (!alunoId) {
        router.push('/entrar')
        return
      }

      // Buscar dados do aluno usando RPC pública (bypass RLS)
      const { data: alunoData, error } = await supabase.rpc(
        'get_student_profile',
        { p_aluno_id: alunoId }
      )

      console.log('📊 Dados do perfil (RPC):', alunoData)
      console.log('❌ Erro (RPC):', error)

      if (error || !alunoData) {
        console.error('Erro ao carregar perfil:', error)
        toast.error('Erro ao carregar dados do aluno.')
        setLoading(false)
        return
      }

      // Dados já vêm no formato correto da RPC
      const turmaNome = alunoData.turma_nome
      const escolaNome = alunoData.escola_nome

      // MOCK DATA (substituir por dados reais quando backend estiver pronto)
      const mockProfile: ProfileData = {
        aluno: {
          id: alunoData.id,
          full_name: alunoData.full_name,
          icone_afinidade: alunoData.icone_afinidade || 'dog',
          turma_nome: turmaNome || 'Turma',
          escola_nome: escolaNome || 'Escola'
        },
        estatisticas: {
          pontos_totais: 2450,
          nivel: 12,
          aulas_completadas: 42,
          taxa_acerto: 87,
          sequencia_dias: 7
        },
        disciplinas: [
          { nome: 'Introdução à Programação', emoji: '💻', aulas_completadas: 17, aulas_totais: 20, pontos: 850, progresso: 85 },
          { nome: 'Lógica de Programação', emoji: '🧮', aulas_completadas: 12, aulas_totais: 20, pontos: 620, progresso: 60 },
          { nome: 'Inglês para Tech', emoji: '🌍', aulas_completadas: 9, aulas_totais: 20, pontos: 480, progresso: 45 },
          { nome: 'Matemática Aplicada', emoji: '📊', aulas_completadas: 6, aulas_totais: 20, pontos: 300, progresso: 30 }
        ],
        ranking: {
          posicao: 3,
          total: 25,
          top5: [
            { nome: 'M.S.', pontos: 3120, avatar: '👩‍💻', isCurrentUser: false },
            { nome: 'L.O.', pontos: 2890, avatar: '👨‍💻', isCurrentUser: false },
            { nome: alunoData.full_name, pontos: 2450, avatar: getAvatarEmoji(alunoData.icone_afinidade), isCurrentUser: true },
            { nome: 'A.C.', pontos: 2210, avatar: '👧', isCurrentUser: false },
            { nome: 'P.M.', pontos: 1980, avatar: '👦', isCurrentUser: false }
          ]
        },
        atividades: [
          { tipo: 'aula', titulo: 'Completou: Variáveis em Python', tempo: 'Há 2 horas', pontos: 50 },
          { tipo: 'quiz', titulo: 'Quiz: Estruturas de Repetição', tempo: 'Ontem às 15:30', pontos: 120 },
          { tipo: 'conquista', titulo: 'Conquistou: Primeira 100%', tempo: 'Ontem às 14:20', pontos: 200 },
          { tipo: 'aula', titulo: 'Completou: Introdução ao HTML', tempo: '2 dias atrás', pontos: 50 }
        ],
        badges: [
          { id: '1', nome: 'Iniciante', icone: '🚀', desbloqueada: true, data: '01/10/2025' },
          { id: '2', nome: '5 Aulas', icone: '🎯', desbloqueada: true, data: '05/10/2025' },
          { id: '3', nome: 'Primeira 100%', icone: '💯', desbloqueada: true, data: '23/10/2025' },
          { id: '4', nome: 'Sequência 7 dias', icone: '🔥', desbloqueada: true, data: '20/10/2025' },
          { id: '5', nome: 'Velocista', icone: '⚡', desbloqueada: true, data: '18/10/2025' },
          { id: '6', nome: 'Game Master', icone: '🎮', desbloqueada: true, data: '15/10/2025' },
          { id: '7', nome: 'Top 3', icone: '🏆', desbloqueada: false },
          { id: '8', nome: 'Rei do Quiz', icone: '👑', desbloqueada: false },
          { id: '9', nome: 'Perfeição', icone: '💎', desbloqueada: false },
          { id: '10', nome: 'Estrela', icone: '🌟', desbloqueada: false }
        ]
      }

      setProfileData(mockProfile)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvatarEmoji = (icone: string): string => {
    const icons: Record<string, string> = {
      dog: '🐶', cat: '🐱', lion: '🦁', tiger: '🐯', bear: '🐻',
      panda: '🐼', koala: '🐨', fox: '🦊', rabbit: '🐰', frog: '🐸',
      monkey: '🐵', pig: '🐷', cow: '🐮', horse: '🐴', unicorn: '🦄'
    }
    return icons[icone] || '👨‍💻'
  }

  const playSound = (soundName: string) => {
    if (audioRef.current) {
      audioRef.current.src = `/sounds/${soundName}.mp3`
      audioRef.current.play().catch(() => {
        // Silenciar erros de autoplay
      })
    }
  }

  const handleBadgeClick = (badge: ProfileData['badges'][0]) => {
    if (badge.desbloqueada) {
      playSound('achievement')
      alert(`Conquista desbloqueada em ${badge.data}! Continue assim! 🎉`)
    } else {
      playSound('click')
      alert('Continue estudando para desbloquear esta conquista! 💪')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="text-white text-2xl font-bold">Carregando perfil...</div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erro ao Carregar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Não foi possível carregar seu perfil.</p>
            <Button onClick={() => router.push('/entrar')}>Voltar ao Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <audio ref={audioRef} />
      
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Botão Voltar */}
          <Button
            variant="ghost"
            className="mb-4 text-white hover:bg-white/20"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* HEADER DO PERFIL */}
          <div className="bg-white rounded-3xl p-6 md:p-10 mb-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Avatar Section */}
              <div className="relative">
                <div 
                  className="w-36 h-36 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-7xl border-4 border-white shadow-xl cursor-pointer transition-transform hover:scale-105"
                  onClick={() => playSound('click')}
                >
                  {getAvatarEmoji(profileData.aluno.icone_afinidade)}
                </div>
                <div className="absolute bottom-0 right-0 bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  Nível {profileData.estatisticas.nivel}
                </div>
              </div>

              {/* Info do Aluno */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent mb-2">
                  {profileData.aluno.full_name}
                </h1>
                <p className="text-gray-600 text-lg mb-4 flex items-center justify-center md:justify-start gap-2">
                  🏫 {profileData.aluno.escola_nome} - {profileData.aluno.turma_nome}
                </p>

                {/* Stats Rápidas */}
                <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#667eea]">{profileData.estatisticas.pontos_totais.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wider">Pontos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#667eea]">{profileData.estatisticas.aulas_completadas}</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wider">Aulas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#667eea]">{profileData.badges.filter(b => b.desbloqueada).length}</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wider">Conquistas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-[#667eea]">{profileData.estatisticas.taxa_acerto}%</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wider">Precisão</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRID PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            
            {/* COLUNA ESQUERDA (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Minhas Disciplinas */}
              <Card className="rounded-3xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Target className="w-8 h-8 text-[#667eea]" />
                    Minhas Disciplinas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileData.disciplinas.map((disc, idx) => (
                    <div 
                      key={idx}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 transition-all hover:translate-x-2 hover:shadow-md cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-bold text-lg flex items-center gap-2">
                          <span className="text-2xl">{disc.emoji}</span>
                          {disc.nome}
                        </div>
                        <div className="text-2xl font-black text-[#667eea]">{disc.progresso}%</div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full transition-all duration-1000"
                          style={{ width: `${disc.progresso}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>✅ {disc.aulas_completadas}/{disc.aulas_totais} aulas</span>
                        <span>⭐ {disc.pontos} pontos</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>

            {/* COLUNA DIREITA (1/3) */}
            <div className="space-y-8">
              
              {/* Ranking */}
              <Card className="rounded-3xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-[#667eea]" />
                    Ranking da Turma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profileData.ranking.top5.map((user, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                        user.isCurrentUser 
                          ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl font-black w-10 text-center">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4facfe] to-[#00f2fe] flex items-center justify-center text-2xl">
                        {user.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold">{user.nome}</div>
                        <div className={`text-sm ${user.isCurrentUser ? 'text-white opacity-80' : 'text-gray-600'}`}>
                          {profileData.aluno.turma_nome}
                        </div>
                      </div>
                      <div className={`text-xl font-black ${user.isCurrentUser ? 'text-white' : 'text-[#667eea]'}`}>
                        {user.pontos.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Atividades Recentes */}
              <Card className="rounded-3xl shadow-xl border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-black flex items-center gap-3">
                    <Zap className="w-8 h-8 text-[#667eea]" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileData.atividades.map((ativ, idx) => (
                    <div key={idx} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                        ativ.tipo === 'aula' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white' :
                        ativ.tipo === 'quiz' ? 'bg-gradient-to-br from-[#f093fb] to-[#f5576c] text-white' :
                        'bg-gradient-to-br from-[#ffeaa7] to-[#fdcb6e]'
                      }`}>
                        {ativ.tipo === 'aula' ? '📺' : ativ.tipo === 'quiz' ? '🎮' : '🏆'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{ativ.titulo}</div>
                        <div className="text-xs text-gray-600">{ativ.tempo}</div>
                      </div>
                      <div className="font-bold text-green-500 whitespace-nowrap">+{ativ.pontos} pts</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* CONQUISTAS */}
          <Card className="rounded-3xl shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-black flex items-center gap-3">
                <Award className="w-8 h-8 text-[#667eea]" />
                Minhas Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {profileData.badges.map((badge) => (
                  <div
                    key={badge.id}
                    onClick={() => handleBadgeClick(badge)}
                    className={`rounded-2xl p-6 text-center cursor-pointer transition-all hover:-translate-y-2 border-4 ${
                      badge.desbloqueada
                        ? 'bg-gradient-to-br from-[#ffeaa7] to-[#fdcb6e] border-yellow-500 shadow-lg'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 border-transparent'
                    }`}
                  >
                    <div className={`text-5xl mb-2 ${!badge.desbloqueada && 'grayscale opacity-50'}`}>
                      {badge.icone}
                    </div>
                    <div className="font-bold text-sm text-gray-800">{badge.nome}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {badge.desbloqueada ? badge.data : 'Bloqueado'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botão Flutuante */}
          <button
            onClick={() => {
              playSound('success')
              router.push('/entrar')
            }}
            className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-2xl shadow-2xl hover:scale-110 transition-transform animate-pulse z-50"
            title="Continuar Aprendendo"
          >
            ▶️
          </button>

        </div>
      </div>
    </>
  )
}

export default function MeuPerfilPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="text-white text-2xl font-bold">Carregando perfil...</div>
      </div>
    }>
      <MeuPerfilContent />
    </Suspense>
  )
}
