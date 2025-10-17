'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function ParallaxHero() {
  const containerRef = useRef<HTMLElement>(null)
  const [scrollDelta, setScrollDelta] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  
  // Refs para cada camada de imagem
  const aliensRef = useRef<HTMLDivElement>(null)
  const planetRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)
  const rocketRef = useRef<HTMLDivElement>(null)

  // Gera estrelas de forma consistente apenas no cliente
  const stars = useRef<Array<{
    width: number
    height: number
    left: number
    top: number
    animationDelay: number
    animationDuration: number
  }>>([])

  useEffect(() => {
    // Marca componente como montado e gera estrelas apenas no cliente
    if (stars.current.length === 0) {
      stars.current = Array.from({ length: 50 }, () => ({
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 3,
        animationDuration: Math.random() * 3 + 2
      }))
    }
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      // Calcula a posição relativa do mouse (de -0.5 a 0.5)
      const xPos = (clientX / innerWidth - 0.5)
      const yPos = (clientY / innerHeight - 0.5)

      // Aplica movimento parallax com intensidades diferentes para cada camada
      // Aliens - movimento moderado
      if (aliensRef.current) {
        const moveX = xPos * 20
        const moveY = yPos * 20
        aliensRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }

      // Planet - movimento lento (mais ao fundo)
      if (planetRef.current) {
        const moveX = xPos * 15
        const moveY = yPos * 15
        planetRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }

      // Type (PHASER) - movimento mínimo (mais ao fundo)
      if (typeRef.current) {
        const moveX = xPos * 10
        const moveY = yPos * 10
        typeRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }

      // Rocket - movimento rápido (mais na frente)
      if (rocketRef.current) {
        const moveX = xPos * 30
        const moveY = yPos * 30
        rocketRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }
    }

    const handleScroll = () => {
      const scrolled = window.scrollY
      const delta = Math.min(scrolled / 500, 1)
      setScrollDelta(delta)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <section 
      ref={containerRef}
      className="relative container mx-auto px-4 py-16 md:py-24 text-center overflow-hidden min-h-[400px] md:min-h-[700px] flex items-center"
      style={{ 
        background: 'linear-gradient(to bottom, #1a0b2e 0%, #2d1b4e 50%, #4a2d6e 100%)'
      }}
    >
      {/* Estrelas de fundo - renderizadas apenas no cliente */}
      {isMounted && (
        <div className="absolute inset-0 overflow-hidden">
          {stars.current.map((star, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${star.width}px`,
                height: `${star.height}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.animationDelay}s`,
                animationDuration: `${star.animationDuration}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Camadas de imagens com parallax */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Aliens - camada frontal */}
        <div
          ref={aliensRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ 
            opacity: 1 - scrollDelta * 0.2,
          }}
        >
          <img 
            srcSet="
              https://phaser.io/build/assets/phaser_logo-final-aliens-360-mUtnMqU4.png 360w,
              https://phaser.io/build/assets/phaser_logo-final-aliens-600-G90uHZL2.png 600w,
              https://phaser.io/build/assets/phaser_logo-final-aliens-900-wJQVnvOL.png 900w,
              https://phaser.io/build/assets/phaser_logo-final-aliens-1200-xjspl6qQ.png 1200w
            "
            sizes="(min-width: 768px) 50vw, 90vw"
            src="https://phaser.io/build/assets/phaser_logo-final-aliens-600-G90uHZL2.png"
            alt=""
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>
       
        {/* Planet - camada mais ao fundo */}
        <div
          ref={planetRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ 
            opacity: 1 - scrollDelta * 0.5,
            transform: `scale(${0.8 + scrollDelta * 0.2})`
          }}
        >
          <img 
            srcSet="
              https://phaser.io/build/assets/phaser_logo-final-planet-360-9E-PdOn1.png 360w,
              https://phaser.io/build/assets/phaser_logo-final-planet-600-ywzEaICO.png 600w,
              https://phaser.io/build/assets/phaser_logo-final-planet-900-uyQ60Hzb.png 900w,
              https://phaser.io/build/assets/phaser_logo-final-planet-1200-yh8IJQYb.png 1200w
            "
            sizes="(min-width: 768px) 50vw, 90vw"
            src="https://phaser.io/build/assets/phaser_logo-final-planet-600-ywzEaICO.png"
            alt=""
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>

        

       
{/* Type (PHASER text) - camada intermediária */}
<div
          ref={typeRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ 
            opacity: 1 - scrollDelta * 0.4,
          }}
        >
          <img 
            srcSet="
              https://phaser.io/build/assets/phaser_logo-final-type-360-zutj7cEj.png 360w,
              https://phaser.io/build/assets/phaser_logo-final-type-600-4100CRBK.png 600w,
              https://phaser.io/build/assets/phaser_logo-final-type-900-xuAX-WUU.png 900w,
              https://phaser.io/build/assets/phaser_logo-final-type-1200-XQKU2aye.png 1200w
            "
            sizes="(min-width: 768px) 50vw, 90vw"
            src="https://phaser.io/build/assets/phaser_logo-final-type-600-4100CRBK.png"
            alt=""
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>
        {/* Rocket - camada mais frontal */}
        <div
          ref={rocketRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ 
            opacity: 1 - scrollDelta * 0.1,
          }}
        >
          <img 
            srcSet="
              https://phaser.io/build/assets/phaser_logo-final-rocket-360-Yvclq0Dg.png 360w,
              https://phaser.io/build/assets/phaser_logo-final-rocket-600-SQMv9Hra.png 600w,
              https://phaser.io/build/assets/phaser_logo-final-rocket-900-_HEGTvrp.png 900w,
              https://phaser.io/build/assets/phaser_logo-final-rocket-1200-JS7SCT7o.png 1200w
            "
            sizes="(min-width: 768px) 50vw, 90vw"
            src="https://phaser.io/build/assets/phaser_logo-final-rocket-600-SQMv9Hra.png"
            alt=""
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>
      </div>

      {/* Conteúdo principal - fixo e sempre visível */}
      <div className="relative z-10 max-w-4xl mx-auto mt-[500px] md:mt-[550px]">
        <div className="bg-gradient-to-b from-transparent via-[#1a0b2e]/50 to-[#1a0b2e] py-8 px-4 rounded-lg backdrop-blur-sm">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg">
            Aulas de Tecnologia <br /> Preparando o Aluno para o Futuro!
          </h1>
          <p className="text-base md:text-xl text-gray-200 mb-6 md:mb-8 drop-shadow-md">
            Programação, lógica, inglês e matemática aplicada — tudo em microlições divertidas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/login">Agendar Demonstração</Link>
            </Button>
            <Button variant="outline" size="lg" className="px-8 bg-white/10 text-white border-white/30 hover:bg-white/20">
              Falar com Especialista
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

