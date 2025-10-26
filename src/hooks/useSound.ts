/**
 * Hook React para usar o SoundManager facilmente em componentes
 */

import { useEffect, useState, useCallback } from 'react'
import { getSoundManager, SoundType } from '@/lib/gamification/soundManager'

export function useSound() {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(1.0)
  const [isInitialized, setIsInitialized] = useState(false)

  const soundManager = getSoundManager()

  // Inicializar na montagem do componente
  useEffect(() => {
    if (!isInitialized) {
      soundManager.initialize()
      setIsMuted(soundManager.getMuted())
      setVolumeState(soundManager.getVolume())
      setIsInitialized(true)
    }

    // Cleanup ao desmontar
    return () => {
      // Não fazer unload aqui pois pode ser usado em outros lugares
    }
  }, [soundManager, isInitialized])

  /**
   * Toca um som
   */
  const playSound = useCallback(
    (type: SoundType, options?: { rate?: number; volume?: number }) => {
      soundManager.play(type, options)
    },
    [soundManager]
  )

  /**
   * Para todos os sons
   */
  const stopAll = useCallback(() => {
    soundManager.stopAll()
  }, [soundManager])

  /**
   * Para um som específico
   */
  const stop = useCallback(
    (type: SoundType) => {
      soundManager.stop(type)
    },
    [soundManager]
  )

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    const newMuted = soundManager.toggleMute()
    setIsMuted(newMuted)
    return newMuted
  }, [soundManager])

  /**
   * Define o volume
   */
  const setVolume = useCallback(
    (newVolume: number) => {
      soundManager.setVolume(newVolume)
      setVolumeState(newVolume)
    },
    [soundManager]
  )

  return {
    playSound,
    stopAll,
    stop,
    toggleMute,
    setVolume,
    isMuted,
    volume,
    isInitialized
  }
}

