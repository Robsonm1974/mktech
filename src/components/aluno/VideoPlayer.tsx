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
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&autohide=1&iv_load_policy=3`
    }
    if (originalUrl.includes('youtu.be/')) {
      const videoId = originalUrl.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&autohide=1&iv_load_policy=3`
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

  const withOrigin = `${embedUrl}${embedUrl.includes('?') ? '&' : '?'}fs=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(location.origin) : ''}`

  return (
    <div className="w-full">
      <div className="relative w-full pb-[56.25%] bg-black rounded-2xl overflow-hidden shadow-2xl">
        <iframe
          src={withOrigin}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title="Video Player"
          style={{ border: 'none' }}
        />
      </div>
      <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200 md:hidden">
        <p className="text-xs text-blue-800 text-center">Toque no botão de tela cheia para melhor experiência.</p>
      </div>
    </div>
  )
}

