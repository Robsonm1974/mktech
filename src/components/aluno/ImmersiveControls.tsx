'use client'

import { useCallback, useEffect, useState } from 'react'
import { Maximize2, Minimize2, X } from 'lucide-react'

interface ImmersiveControlsProps {
  onClose?: () => void
  containerSelector?: string // opcional: qual elemento entrar em fullscreen; padrão = document.documentElement
}

export default function ImmersiveControls({ onClose, containerSelector }: ImmersiveControlsProps) {
  const [isFs, setIsFs] = useState(false)

  const targetEl = useCallback((): HTMLElement => {
    if (containerSelector) {
      const el = document.querySelector(containerSelector)
      if (el instanceof HTMLElement) return el
    }
    return document.documentElement
  }, [containerSelector])

  const enterFs = async () => {
    try {
      const el = targetEl() as HTMLElement & { requestFullscreen?: () => Promise<void> | void }
      await el?.requestFullscreen?.()
    } catch {}
  }
  const exitFs = async () => {
    try {
      const doc = document as Document & { exitFullscreen?: () => Promise<void> | void }
      await doc?.exitFullscreen?.()
    } catch {}
  }

  useEffect(() => {
    const handler = () => setIsFs(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div className="fixed top-3 right-3 z-50 flex gap-2">
      {!isFs ? (
        <button
          aria-label="Entrar em tela cheia"
          onClick={enterFs}
          className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur text-slate-700 shadow hover:bg-white"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          aria-label="Sair de tela cheia"
          onClick={exitFs}
          className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur text-slate-700 shadow hover:bg-white"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      )}
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="px-3 py-2 rounded-lg bg-white/90 backdrop-blur text-slate-700 shadow hover:bg-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}


