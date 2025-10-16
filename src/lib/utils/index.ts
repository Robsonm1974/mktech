import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateSessionCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  const letter1 = letters[Math.floor(Math.random() * letters.length)]
  const letter2 = letters[Math.floor(Math.random() * letters.length)]
  const num1 = numbers[Math.floor(Math.random() * numbers.length)]
  const num2 = numbers[Math.floor(Math.random() * numbers.length)]
  
  return `${letter1}${letter2}-${num1}${num2}`
}

export function calculatePoints(attempts: number, maxPoints: number): number {
  const multipliers = [1.0, 0.75, 0.5] // Tentativa 1, 2, 3+
  const multiplier = multipliers[Math.min(attempts - 1, 2)] || 0.5
  return Math.round(maxPoints * multiplier)
}

export function getRankingPositionText(position: number, total: number): string {
  if (position === 1) return '1º lugar'
  if (position === 2) return '2º lugar'
  if (position === 3) return '3º lugar'
  return `${position}º de ${total}`
}

export function getPerformanceLevel(points: number): {
  level: string
  color: string
  description: string
} {
  if (points >= 90) {
    return {
      level: 'Excelente',
      color: 'text-green-600',
      description: 'Desempenho excepcional!'
    }
  } else if (points >= 70) {
    return {
      level: 'Bom',
      color: 'text-blue-600',
      description: 'Bom desempenho!'
    }
  } else if (points >= 50) {
    return {
      level: 'Regular',
      color: 'text-yellow-600',
      description: 'Continue praticando!'
    }
  } else {
    return {
      level: 'Precisa Melhorar',
      color: 'text-red-600',
      description: 'Não desista, você consegue!'
    }
  }
}

export function abbreviateName(name: string): string {
  const words = name.split(' ')
  if (words.length === 1) return words[0] || ''
  
  const first = words[0]
  const last = words[words.length - 1]
  
  return `${first} ${last?.charAt(0) || ''}.`
}

export function validatePIN(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

export function validateStudentCode(code: string): boolean {
  return /^[A-Z0-9-]+$/.test(code.toUpperCase())
}

export function getIconEmoji(icon: string): string {
  switch (icon) {
    case 'dog': return '🐕'
    case 'cat': return '🐱'
    case 'fruit': return '🍎'
    case 'flower': return '🌸'
    default: return '👤'
  }
}
