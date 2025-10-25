'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface LottieAnimationProps {
  src: string
  size?: number
  loop?: boolean
  autoplay?: boolean
  className?: string
}

export function LottieAnimation({ 
  src, 
  size = 300, 
  loop = true, 
  autoplay = true,
  className = ''
}: LottieAnimationProps) {
  return (
    <DotLottieReact
      src={src}
      loop={loop}
      autoplay={autoplay}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={className}
    />
  )
}

// URLs das animações disponíveis
export const LOTTIE_ANIMATIONS = {
  celebration: 'https://lottie.host/embed/59edbcda-5b0b-4a8f-8228-b7d521a9bb95/zM7IdUMP1H.lottie',
  trophy: 'https://lottie.host/embed/bb18fea0-862a-406e-b6cf-65c1d69479dd/skyOmKzABs.lottie',
  levelUp: 'https://lottie.host/embed/f11962b6-0326-43ed-9b75-a6ab3b506aef/q1WjUzTzyI.lottie',
  badgeUnlock: 'https://lottie.host/embed/7abc20b2-d477-46f8-a354-fb03967c2d22/YnZUONT07W.lottie',
  starSparkle: 'https://lottie.host/embed/ca08eec7-2daf-4e04-b7f5-2273f65c09e5/L96CABt2YT.lottie',
  fireStreak: 'https://lottie.host/embed/c35ab7b2-4c8d-4543-9373-8ede4a45d751/r9x63ZiBLe.lottie',
  rocketProgress: 'https://lottie.host/embed/33234ea3-a1df-43d0-81e9-84846401918c/ZKP8vn0Otf.lottie'
}

