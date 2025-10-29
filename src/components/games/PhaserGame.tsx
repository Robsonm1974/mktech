'use client'

import { useEffect, useRef } from 'react'
import * as Phaser from 'phaser'

interface PhaserGameProps {
  gameConfig: Phaser.Types.Core.GameConfig
  onGameReady?: (game: Phaser.Game) => void
}

/**
 * Componente wrapper para jogos Phaser.js
 * 
 * Gerencia o ciclo de vida do Phaser e integração com React
 */
export default function PhaserGame({ gameConfig, onGameReady }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    // Configuração padrão mesclada com a customizada
    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
      // Garantir que funcione em mobile
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: gameConfig.scale?.width || 800,
        height: gameConfig.scale?.height || 600,
        ...gameConfig.scale
      }
    }

    // Criar instância do jogo
    gameRef.current = new Phaser.Game(config)

    // Callback quando o jogo estiver pronto
    if (onGameReady && gameRef.current) {
      onGameReady(gameRef.current)
    }

    // Cleanup: destruir o jogo ao desmontar
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [gameConfig, onGameReady])

  return (
    <div
      ref={containerRef}
      className="phaser-game-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    />
  )
}

