'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface FloatingPointsProps {
  points: number
  position: { x: number; y: number }
  onComplete?: () => void
  color?: 'gold' | 'orange' | 'yellow' | 'rainbow'
  size?: 'small' | 'medium' | 'large' | 'xlarge'
}

const COLOR_MAP = {
  gold: 'text-yellow-500',
  orange: 'text-orange-500',
  yellow: 'text-yellow-400',
  rainbow: 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-transparent bg-clip-text'
}

const SIZE_MAP = {
  small: 'text-2xl',
  medium: 'text-3xl',
  large: 'text-4xl',
  xlarge: 'text-5xl'
}

export function FloatingPoints({
  points,
  position,
  onComplete,
  color = 'gold',
  size = 'medium'
}: FloatingPointsProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Determinar cor e tamanho automaticamente baseado nos pontos
  const autoColor = points <= 5 ? 'yellow' : points <= 10 ? 'orange' : points <= 20 ? 'gold' : 'rainbow'
  const autoSize = points <= 5 ? 'small' : points <= 10 ? 'medium' : points <= 20 ? 'large' : 'xlarge'

  const finalColor = color || autoColor
  const finalSize = size || autoSize

  useEffect(() => {
    // Auto-hide após a animação
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        onComplete()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            y: [-20, -80, -120, -150]
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{
            duration: 2,
            ease: 'easeOut',
            times: [0, 0.2, 0.8, 1]
          }}
          className="fixed pointer-events-none z-50"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          <div className={`font-black ${SIZE_MAP[finalSize]} ${COLOR_MAP[finalColor]} drop-shadow-2xl`}>
            +{points} pts
          </div>
          
          {/* Sparkles effect para valores altos */}
          {points > 10 && (
            <>
              <motion.div
                className="absolute top-0 left-0 w-2 h-2 bg-yellow-300 rounded-full"
                animate={{
                  x: [-10, -20, -30],
                  y: [-10, -20, -30],
                  opacity: [1, 0.5, 0]
                }}
                transition={{ duration: 1 }}
              />
              <motion.div
                className="absolute top-0 right-0 w-2 h-2 bg-yellow-300 rounded-full"
                animate={{
                  x: [10, 20, 30],
                  y: [-10, -20, -30],
                  opacity: [1, 0.5, 0]
                }}
                transition={{ duration: 1 }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

