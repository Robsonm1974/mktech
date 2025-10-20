'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface LottiePlayerProps {
  url: string
  onComplete?: () => void
}

export default function LottiePlayer({ url, onComplete }: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [animation, setAnimation] = useState<unknown>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Carregar Lottie dinamicamente
    import('lottie-web')
      .then((module) => {
        const lottie = module.default
        
        if (!containerRef.current) return

        try {
          const anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg' as const,
            loop: false,
            autoplay: true,
            path: url
          })

          anim.addEventListener('complete', () => {
            setIsPlaying(false)
            onComplete?.()
          })

          setAnimation(anim)
          setIsPlaying(true)
        } catch (err) {
          console.error('Erro ao carregar animação Lottie:', err)
          setError('Erro ao carregar animação')
        }
      })
      .catch((err) => {
        console.error('Erro ao importar lottie-web:', err)
        setError('Biblioteca Lottie não disponível. Execute: pnpm add lottie-web')
      })

    return () => {
      if (animation && typeof animation === 'object' && 'destroy' in animation) {
        (animation as { destroy: () => void }).destroy()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const handlePlayPause = () => {
    if (!animation || typeof animation !== 'object') return

    if (isPlaying) {
      if ('pause' in animation) {
        (animation as { pause: () => void }).pause()
      }
      setIsPlaying(false)
    } else {
      if ('play' in animation) {
        (animation as { play: () => void }).play()
      }
      setIsPlaying(true)
    }
  }

  const handleRestart = () => {
    if (!animation || typeof animation !== 'object') return
    
    if ('stop' in animation && 'play' in animation) {
      (animation as { stop: () => void; play: () => void }).stop()
      ;(animation as { stop: () => void; play: () => void }).play()
      setIsPlaying(true)
    }
  }

  if (error) {
    return (
      <div className="aspect-video bg-slate-800 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-2">{error}</p>
          <p className="text-sm text-slate-400">{url}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-slate-900">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Controles */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        <button
          onClick={handlePlayPause}
          className="bg-white/90 hover:bg-white rounded-full p-3 transition"
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-slate-900" />
          ) : (
            <Play className="h-5 w-5 text-slate-900" />
          )}
        </button>
        
        <button
          onClick={handleRestart}
          className="bg-white/90 hover:bg-white rounded-full p-3 transition"
          title="Reiniciar"
        >
          <RotateCcw className="h-5 w-5 text-slate-900" />
        </button>
      </div>
    </div>
  )
}

