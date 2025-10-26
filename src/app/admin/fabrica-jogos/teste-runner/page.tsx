'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

// Importar dinamicamente para evitar SSR
const AdventureRunnerPlayer = dynamic(
  () => import('@/components/games/AdventureRunnerPlayer'),
  { ssr: false }
)

/**
 * Página de teste do Adventure Runner
 */
export default function TesteRunnerPage() {
  const router = useRouter()
  const [gameStarted, setGameStarted] = useState(false)
  const [gameResult, setGameResult] = useState<{ score: number; coins: number } | null>(null)

  // Perguntas de teste
  const testQuestions = [
    {
      id: '1',
      pergunta: 'O que é um algoritmo?',
      opcoes: [
        { id: 'a', texto: 'Uma sequência de passos para resolver um problema', correta: true },
        { id: 'b', texto: 'Um tipo de computador', correta: false },
        { id: 'c', texto: 'Uma linguagem de programação', correta: false }
      ],
      explicacao: 'Algoritmo é uma sequência finita de passos bem definidos para resolver um problema ou realizar uma tarefa.'
    },
    {
      id: '2',
      pergunta: 'Qual é a cor do céu em um dia claro?',
      opcoes: [
        { id: 'a', texto: 'Verde', correta: false },
        { id: 'b', texto: 'Azul', correta: true },
        { id: 'c', texto: 'Vermelho', correta: false }
      ],
      explicacao: 'O céu é azul porque a luz do sol é espalhada pelas moléculas de ar, e a luz azul se espalha mais!'
    },
    {
      id: '3',
      pergunta: 'Quantas pernas tem um inseto?',
      opcoes: [
        { id: 'a', texto: '4 pernas', correta: false },
        { id: 'b', texto: '6 pernas', correta: true },
        { id: 'c', texto: '8 pernas', correta: false }
      ],
      explicacao: 'Todos os insetos têm 6 pernas! Já as aranhas têm 8 pernas, mas elas não são insetos.'
    }
  ]

  const handleGameComplete = (score: number, coins: number) => {
    setGameResult({ score, coins })
    setGameStarted(false)
  }

  if (gameResult) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-8 text-white text-center">
          <h1 className="text-4xl font-bold mb-4">🎉 Parabéns!</h1>
          <div className="text-6xl font-black mb-6">{gameResult.coins} 🪙</div>
          <p className="text-2xl mb-6">Moedas coletadas!</p>
          <p className="text-xl mb-8">Pontuação final: {gameResult.score} pontos</p>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                setGameResult(null)
                setGameStarted(true)
              }}
              className="bg-white text-purple-600 hover:bg-purple-50 font-bold text-lg px-8 py-3"
            >
              Jogar Novamente
            </Button>
            <Button
              onClick={() => router.push('/admin/fabrica-jogos')}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/20 font-bold text-lg px-8 py-3"
            >
              Voltar ao Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!gameStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-4">🎮 Adventure Runner - Teste</h1>
          <p className="text-xl mb-6">
            Teste o primeiro jogo da Fábrica de Jogos MK-SMART!
          </p>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Como Jogar:</h2>
            <ul className="space-y-2 text-lg">
              <li>🎮 <strong>PC:</strong> Setas ←→ para correr, ↑ ou ESPAÇO para pular</li>
              <li>📱 <strong>Mobile:</strong> Toque e segure (esquerda) para correr, toque (direita/topo) para pular</li>
              <li>💰 Colete <strong>moedas</strong> pelo caminho</li>
              <li>📦 Encontre <strong>baús</strong> para responder perguntas</li>
              <li>✅ Responda <strong>corretamente</strong> para ganhar bônus!</li>
              <li>🚫 Pule os <strong>obstáculos vermelhos</strong> no caminho!</li>
              <li>⏱️ Você tem <strong>2 minutos</strong> para percorrer o maior caminho possível!</li>
            </ul>
          </div>

          <div className="bg-yellow-400/20 rounded-lg p-4 mb-6">
            <p className="text-lg">
              💡 <strong>Dica:</strong> Este é um teste com 3 perguntas de exemplo. 
              No jogo final, as perguntas virão do Banco de Perguntas!
            </p>
          </div>

          <Button
            onClick={() => setGameStarted(true)}
            className="bg-white text-purple-600 hover:bg-purple-50 font-bold text-2xl px-12 py-6 w-full"
          >
            🚀 Começar Jogo!
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">🎮 Adventure Runner - Teste</h1>
        <Button 
          variant="outline"
          onClick={() => setGameStarted(false)}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          Sair do Jogo
        </Button>
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl" style={{ height: '600px' }}>
        <AdventureRunnerPlayer
          questions={testQuestions}
          duration={120}
          onComplete={handleGameComplete}
        />
      </div>

      <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
        <p className="text-blue-900">
          <strong>ℹ️ Modo Teste:</strong> Este é um ambiente de desenvolvimento. 
          As perguntas são exemplos estáticos. No jogo final, elas virão do banco de dados.
        </p>
      </div>
    </div>
  )
}

