'use client'

import { useState, useEffect } from 'react'

interface VideoPlayerProps {
  url: string
  onComplete?: () => void
}

export default function VideoPlayer({ url, onComplete }: VideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState('')

  useEffect(() => {
    const converted = convertToEmbedUrl(url)
    setEmbedUrl(converted)
  }, [url])

  const convertToEmbedUrl = (originalUrl: string): string => {
    // YouTube
    if (originalUrl.includes('youtube.com/watch?v=')) {
      const videoId = originalUrl.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
    }
    if (originalUrl.includes('youtu.be/')) {
      const videoId = originalUrl.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`
    }
    
    // Vimeo
    if (originalUrl.includes('vimeo.com/')) {
      const videoId = originalUrl.split('vimeo.com/')[1]?.split('/')[0]
      return `https://player.vimeo.com/video/${videoId}`
    }

    // URL direta (assume que já é um embed ou vídeo direto)
    return originalUrl
  }

  // Hook para detectar quando o vídeo terminar (YouTube API)
  useEffect(() => {
    if (!onComplete || !embedUrl.includes('youtube.com')) return

    // Para YouTube, poderíamos usar a API do YouTube IFrame
    // Por enquanto, vamos deixar o onComplete manual ou após um tempo
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://www.youtube.com') {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'onStateChange' && data.info === 0) {
            // Estado 0 = vídeo terminou
            onComplete?.()
          }
        } catch {
          // Ignorar erros de parsing
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [embedUrl, onComplete])

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-slate-800 flex items-center justify-center text-white">
        <p>URL de vídeo inválida</p>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video Player"
      />
    </div>
  )
}

