/**
 * Sistema centralizado de gerenciamento de áudio para gamificação
 * Usa Howler.js para controle avançado de sons
 */

import { Howl } from 'howler'

// Tipos de sons disponíveis
export type SoundType =
  | 'click'
  | 'select'
  | 'correct'
  | 'incorrect'
  | 'achievement'
  | 'level-up'
  | 'perfect'
  | 'streak'
  | 'countdown'
  | 'complete-session'
  | 'confetti'
  | 'badge-unlock'
  | 'success'

// Configuração de cada som
interface SoundConfig {
  src: string
  volume?: number
  loop?: boolean
  sprite?: Record<string, [number, number]> // Para sprite sheets
}

// Mapeamento de sons
const SOUND_MAP: Record<SoundType, SoundConfig> = {
  click: {
    src: '/sounds/click.mp3',
    volume: 0.3
  },
  select: {
    src: '/sounds/click.mp3',
    volume: 0.4
  },
  correct: {
    src: '/sounds/success.mp3',
    volume: 0.6
  },
  incorrect: {
    src: '/sounds/click.mp3',
    volume: 0.5
  },
  achievement: {
    src: '/sounds/badge-unlock.mp3',
    volume: 0.7
  },
  'level-up': {
    src: '/sounds/success.mp3',
    volume: 0.8
  },
  perfect: {
    src: '/sounds/success.mp3',
    volume: 0.9
  },
  streak: {
    src: '/sounds/success.mp3',
    volume: 0.8
  },
  countdown: {
    src: '/sounds/click.mp3',
    volume: 0.6
  },
  'complete-session': {
    src: '/sounds/success.mp3',
    volume: 1.0
  },
  confetti: {
    src: '/sounds/success.mp3',
    volume: 0.7
  },
  'badge-unlock': {
    src: '/sounds/badge-unlock.mp3',
    volume: 0.7
  },
  success: {
    src: '/sounds/success.mp3',
    volume: 0.6
  }
}

class SoundManager {
  private sounds: Map<SoundType, Howl> = new Map()
  private globalVolume: number = 1.0
  private isMuted: boolean = false
  private initialized: boolean = false

  constructor() {
    // Carregar preferências do localStorage
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('mktech-volume')
      const savedMuted = localStorage.getItem('mktech-muted')

      if (savedVolume) {
        this.globalVolume = parseFloat(savedVolume)
      }

      if (savedMuted) {
        this.isMuted = savedMuted === 'true'
      }
    }
  }

  /**
   * Inicializa e precarrega todos os sons
   */
  initialize(): void {
    if (this.initialized) return

    Object.entries(SOUND_MAP).forEach(([type, config]) => {
      const howl = new Howl({
        src: [config.src],
        volume: (config.volume || 1.0) * this.globalVolume,
        loop: config.loop || false,
        preload: true,
        html5: true, // Usar HTML5 Audio para melhor compatibilidade
        sprite: config.sprite
      })

      this.sounds.set(type as SoundType, howl)
    })

    this.initialized = true
    console.log('🔊 SoundManager initialized with', this.sounds.size, 'sounds')
  }

  /**
   * Toca um som específico
   */
  play(type: SoundType, options?: { rate?: number; volume?: number }): void {
    if (this.isMuted) return

    const sound = this.sounds.get(type)
    if (!sound) {
      console.warn(`Sound "${type}" not found`)
      return
    }

    // Configurações opcionais
    if (options?.rate) {
      sound.rate(options.rate)
    }

    if (options?.volume !== undefined) {
      sound.volume(options.volume * this.globalVolume)
    }

    // Parar instâncias anteriores do mesmo som (evita sobreposição)
    sound.stop()
    
    // Tocar
    sound.play()
  }

  /**
   * Para todos os sons
   */
  stopAll(): void {
    this.sounds.forEach(sound => sound.stop())
  }

  /**
   * Para um som específico
   */
  stop(type: SoundType): void {
    const sound = this.sounds.get(type)
    if (sound) {
      sound.stop()
    }
  }

  /**
   * Define o volume global (0.0 - 1.0)
   */
  setVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume))

    // Atualizar todos os sons
    this.sounds.forEach((sound, type) => {
      const config = SOUND_MAP[type]
      sound.volume((config.volume || 1.0) * this.globalVolume)
    })

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mktech-volume', this.globalVolume.toString())
    }
  }

  /**
   * Retorna o volume atual
   */
  getVolume(): number {
    return this.globalVolume
  }

  /**
   * Muta/desmuta todos os sons
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mktech-muted', this.isMuted.toString())
    }

    return this.isMuted
  }

  /**
   * Define o estado de mute
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted

    if (typeof window !== 'undefined') {
      localStorage.setItem('mktech-muted', muted.toString())
    }
  }

  /**
   * Retorna se está mutado
   */
  getMuted(): boolean {
    return this.isMuted
  }

  /**
   * Libera recursos (cleanup)
   */
  cleanup(): void {
    this.sounds.forEach(sound => {
      sound.unload()
    })
    this.sounds.clear()
    this.initialized = false
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null

/**
 * Retorna a instância singleton do SoundManager
 */
export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager()
  }
  return soundManagerInstance
}

export default getSoundManager

