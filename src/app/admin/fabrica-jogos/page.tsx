'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpCircle, Gamepad2, Sparkles, ArrowRight, PlayCircle } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'

export default function FabricaJogosPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const [stats, setStats] = useState({
    perguntas: 0,
    jogos: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Contar perguntas
      const { count: perguntasCount } = await supabase
        .from('banco_perguntas')
        .select('*', { count: 'exact', head: true })
      
      // Contar jogos
      const { count: jogosCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })

      setStats({
        perguntas: perguntasCount || 0,
        jogos: jogosCount || 0
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const sections = [
    {
      id: 'perguntas',
      title: 'Banco de Perguntas',
      description: 'Gerencie perguntas, respostas e explicações para os jogos',
      icon: HelpCircle,
      color: 'from-purple-500 to-purple-700',
      href: '/admin/fabrica-jogos/perguntas',
      stats: `${stats.perguntas} ${stats.perguntas === 1 ? 'pergunta' : 'perguntas'}`
    },
    {
      id: 'componentes',
      title: 'Biblioteca de Componentes',
      description: 'Sprites, cenários, sons e músicas reutilizáveis',
      icon: Sparkles,
      color: 'from-blue-500 to-blue-700',
      href: '/admin/fabrica-jogos/componentes',
      stats: 'Em breve'
    },
    {
      id: 'jogos',
      title: 'Gerenciar Jogos',
      description: 'Criar, editar e publicar jogos educacionais',
      icon: Gamepad2,
      color: 'from-green-500 to-green-700',
      href: '/admin/fabrica-jogos/jogos',
      stats: `${stats.jogos} ${stats.jogos === 1 ? 'jogo criado' : 'jogos criados'}`
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          🎮 Fábrica de Jogos
        </h1>
        <p className="text-slate-600">
          Sistema completo para criar jogos educacionais gamificados com perguntas e respostas
        </p>
      </div>

      {/* Cards de Seções */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card 
              key={section.id}
              className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500"
              onClick={() => router.push(section.href)}
            >
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{section.stats}</span>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Resumo do Sistema */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="font-bold text-purple-700 mb-2">1. Perguntas</div>
              <p className="text-sm text-slate-600">
                Cadastre perguntas por ano, disciplina e dificuldade. Elas serão sorteadas nos jogos.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="font-bold text-blue-700 mb-2">2. Componentes</div>
              <p className="text-sm text-slate-600">
                Upload de sprites, cenários e sons que serão reutilizados em diferentes jogos.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="font-bold text-green-700 mb-2">3. Criar Jogos</div>
              <p className="text-sm text-slate-600">
                Monte jogos escolhendo template, componentes e configurando perguntas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teste do Jogo */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-green-600" />
            🎮 Testar Adventure Runner
          </CardTitle>
          <CardDescription>
            Experimente o primeiro jogo da Fábrica - Um runner com perguntas educacionais!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-700 mb-2">
                ✅ <strong>Assets organizados:</strong> 175 personagens + 1204 ítens
              </p>
              <p className="text-slate-700 mb-4">
                🎯 <strong>Status:</strong> Pronto para testar com perguntas de exemplo
              </p>
            </div>
            <Button 
              onClick={() => router.push('/admin/fabrica-jogos/teste-runner')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Jogar Agora!
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info do Mascote */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎭 Sistema de Mascote
          </CardTitle>
          <CardDescription>
            Personagem único da plataforma que evolui com o progresso do aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { nivel: 1, nome: 'Aprendiz', acertos: 0, cor: 'bg-gray-400' },
              { nivel: 2, nome: 'Estudante', acertos: 50, cor: 'bg-blue-400' },
              { nivel: 3, nome: 'Mestre', acertos: 150, cor: 'bg-purple-400' },
              { nivel: 4, nome: 'Sábio', acertos: 300, cor: 'bg-orange-400' },
              { nivel: 5, nome: 'Lenda', acertos: 500, cor: 'bg-yellow-400' }
            ].map((mascote) => (
              <div key={mascote.nivel} className="text-center p-3 bg-white rounded-lg border">
                <div className={`w-12 h-12 ${mascote.cor} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                  {mascote.nivel}
                </div>
                <div className="font-bold text-sm">{mascote.nome}</div>
                <div className="text-xs text-slate-500">{mascote.acertos}+ acertos</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

