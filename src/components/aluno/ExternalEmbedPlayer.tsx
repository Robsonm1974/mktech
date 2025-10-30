'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface ExternalEmbedPlayerProps {
  url: string
  onComplete?: () => void
  onScore?: (scorePercent: number | null) => void
  fallbackSecondsToComplete?: number // se nenhum evento chegar, habilita botão de concluir
}

function isHttpsUrl(u: string): boolean {
  try {
    const parsed = new URL(u)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function extractHost(u: string): string | null {
  try {
    return new URL(u).host
  } catch {
    return null
  }
}

export default function ExternalEmbedPlayer({ url, onComplete, onScore, fallbackSecondsToComplete = 30 }: ExternalEmbedPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [allowFallback, setAllowFallback] = useState(false)

  const trustedHost = useMemo(() => extractHost(url), [url])

  // Listener de mensagens: game:score
  useEffect(() => {
    type GameScoreMessage = {
      source?: string
      type?: string
      score?: number
      completed?: boolean
      meta?: Record<string, unknown>
    }

    const handler = (e: MessageEvent) => {
      if (!trustedHost) return
      try {
        const originHost = new URL(e.origin).host
        if (originHost !== trustedHost) return
      } catch {
        return
      }

      const data: unknown = e.data
      if (typeof data !== 'object' || data === null) return
      const msg = data as GameScoreMessage
      if (msg.source === 'mktech' && msg.type === 'game:score') {
        if (typeof msg.score === 'number' && onScore) {
          onScore(Math.max(0, Math.min(100, msg.score)))
        } else if (onScore) {
          onScore(null)
        }
        if (msg.completed && onComplete) onComplete()
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onComplete, onScore, trustedHost])

  // Fallback: botão de concluir se nada chegar após N segundos
  useEffect(() => {
    if (!loaded || fallbackSecondsToComplete <= 0) return
    const t = setTimeout(() => setAllowFallback(true), fallbackSecondsToComplete * 1000)
    return () => clearTimeout(t)
  }, [loaded, fallbackSecondsToComplete])

  const handleFallback = useCallback(() => {
    if (onScore) onScore(null)
    onComplete?.()
  }, [onComplete, onScore])

  if (!isHttpsUrl(url)) {
    return (
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-700">
        URL inválida. Somente links HTTPS são permitidos.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden shadow-xl">
      <iframe
        ref={iframeRef}
        src={url}
        title="Conteúdo Externo"
        className="absolute top-0 left-0 w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="fullscreen; autoplay; clipboard-write; encrypted-media"
        referrerPolicy="no-referrer-when-downgrade"
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />

      {allowFallback && (
        <div className="absolute bottom-3 right-3">
          <button
            onClick={handleFallback}
            className="px-4 py-2 rounded-lg bg-white/90 text-slate-800 font-semibold shadow hover:bg-white"
          >
            Marcar como Concluído
          </button>
        </div>
      )}
    </div>
  )
}


