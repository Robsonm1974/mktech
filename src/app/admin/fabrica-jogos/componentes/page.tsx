'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Image, Music, Volume2, Sparkles } from 'lucide-react'

export default function ComponentesPage() {
  const router = useRouter()

  const assetCategories = [
    {
      id: 'backgrounds',
      title: 'Cenários',
      description: 'Fundos e backgrounds para os jogos',
      icon: Image,
      color: 'from-blue-500 to-blue-700',
      count: '2 disponíveis',
      items: [
        { nome: 'Sky Background', path: '/games/assets/backgrounds/temp/sky.svg', tipo: 'SVG' }
      ]
    },
    {
      id: 'characters',
      title: 'Personagens',
      description: 'Sprites de personagens animados',
      icon: Sparkles,
      color: 'from-purple-500 to-purple-700',
      count: '175 sprites',
      items: [
        { nome: 'Ninja Frog', path: '/games/assets/characters/Ninja Frog/', tipo: 'Spritesheet' },
        { nome: 'Pink Man', path: '/games/assets/characters/Pink Man/', tipo: 'Spritesheet' },
        { nome: 'Virtual Guy', path: '/games/assets/characters/Virtual Guy/', tipo: 'Spritesheet' }
      ]
    },
    {
      id: 'items',
      title: 'Itens',
      description: 'Moedas, baús e coletáveis',
      icon: Sparkles,
      color: 'from-yellow-500 to-orange-700',
      count: '1204 itens',
      items: [
        { nome: 'Baú (Chest)', path: '/games/assets/items/treasure-hunters/Palm Tree Island/Sprites/Objects/Chest/', tipo: 'Sprite' },
        { nome: 'Moeda (Gold Coin)', path: '/games/assets/items/treasure-hunters/Pirate Treasure/Sprites/Gold Coin/', tipo: 'Sprite' }
      ]
    },
    {
      id: 'music',
      title: 'Músicas',
      description: 'Trilhas sonoras de fundo',
      icon: Music,
      color: 'from-green-500 to-emerald-700',
      count: '1 música',
      items: [
        { nome: 'Fluffing a Duck', path: '/games/assets/music/Fluffing a Duck.mp3', tipo: 'MP3' }
      ]
    },
    {
      id: 'sounds',
      title: 'Efeitos Sonoros',
      description: 'Sons de ações e eventos',
      icon: Volume2,
      color: 'from-red-500 to-pink-700',
      count: '5 sons',
      items: [
        { nome: 'Moeda', path: '/games/assets/sounds/coin.mp3', tipo: 'MP3' },
        { nome: 'Baú', path: '/games/assets/sounds/chest.mp3', tipo: 'MP3' },
        { nome: 'Pulo', path: '/games/assets/sounds/jump.mp3', tipo: 'MP3' },
        { nome: 'Correto', path: '/games/assets/sounds/correct.mp3', tipo: 'MP3' },
        { nome: 'Errado', path: '/games/assets/sounds/wrong.mp3', tipo: 'MP3' }
      ]
    }
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Biblioteca de Componentes</h1>
          <p className="text-slate-600 mt-1">
            Assets reutilizáveis para criar jogos educacionais
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Assets Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-slate-700">
            <p>✅ <strong>175 personagens animados</strong> (Pixel Adventure)</p>
            <p>✅ <strong>1204 itens coletáveis</strong> (Treasure Hunters)</p>
            <p>✅ <strong>Músicas e sons</strong> prontos para uso</p>
            <p>✅ <strong>Cenários e backgrounds</strong> para diferentes temas</p>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
            <p className="text-sm font-semibold text-blue-900">
              💡 <strong>Todos os assets estão organizados em:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-xs">/public/games/assets/</code>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Categorias de Assets */}
      <div className="space-y-6">
        {assetCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">
                    {category.count}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{item.nome}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.path}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-1 rounded">
                        {item.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Future Feature */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            🚀 Em Breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-purple-800">
            <p>• Upload de novos assets personalizados</p>
            <p>• Organização por tags e categorias</p>
            <p>• Preview de sprites animados</p>
            <p>• Player de áudio para sons e músicas</p>
            <p>• Sistema de favoritos</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

