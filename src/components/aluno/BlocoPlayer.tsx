'use client'

import { useEffect, useState } from 'react'
import VideoPlayer from './VideoPlayer'
import LottiePlayer from './LottiePlayer'
import PhaserPlayer from './PhaserPlayer'
import H5PPlayer from './H5PPlayer'
import ExternalEmbedPlayer from './ExternalEmbedPlayer'
import { Loader2 } from 'lucide-react'

interface BlocoPlayerProps {
  blocoId: string
  tipo_midia: string | null
  midia_url: string | null
  conteudo_texto: string | null
  onComplete?: () => void
}

export default function BlocoPlayer({
  tipo_midia,
  midia_url,
  conteudo_texto,
  onComplete
}: BlocoPlayerProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [tipo_midia, midia_url])

  // Se não tem mídia, mostrar apenas o conteúdo de texto
  if (!tipo_midia || !midia_url) {
    return (
      <div className="w-full bg-white rounded-lg p-6 shadow-sm">
        <div className="prose prose-slate max-w-none">
          {conteudo_texto ? (
            <div dangerouslySetInnerHTML={{ __html: conteudo_texto }} />
          ) : (
            <p className="text-slate-500 italic">Nenhum conteúdo disponível para este bloco.</p>
          )}
        </div>
        {onComplete && (
          <button
            onClick={onComplete}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Marcar como Concluído
          </button>
        )}
      </div>
    )
  }

  // Renderizar player específico baseado no tipo
  if (loading) {
    return (
      <div className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Player */}
      <div className={`w-full ${tipo_midia === 'video' ? 'bg-black rounded-none md:rounded-lg overflow-hidden' : 'bg-black rounded-lg overflow-hidden'}`}>
        {tipo_midia === 'video' && (
          <VideoPlayer url={midia_url} onComplete={onComplete} />
        )}
        {tipo_midia === 'lottie' && (
          <LottiePlayer url={midia_url} onComplete={onComplete} />
        )}
        {tipo_midia === 'phaser' && (
          <PhaserPlayer url={midia_url} onComplete={onComplete} />
        )}
        {tipo_midia === 'h5p' && (
          <H5PPlayer url={midia_url} onComplete={onComplete} />
        )}
        {tipo_midia === 'external_iframe' && (
          <ExternalEmbedPlayer
            url={midia_url}
            onComplete={onComplete}
          />
        )}
      </div>

      {/* Conteúdo de texto (se houver) */}
      {conteudo_texto && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="prose prose-slate max-w-none">
            <div dangerouslySetInnerHTML={{ __html: conteudo_texto }} />
          </div>
        </div>
      )}
    </div>
  )
}


