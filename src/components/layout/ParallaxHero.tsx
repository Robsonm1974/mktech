'use client'

import { useEffect, useRef, useState } from 'react'

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
    moveX: number  // ⬅️ NOVO: Velocidade horizontal
    moveY: number  // ⬅️ NOVO: Velocidade vertical
  }>>([])

  useEffect(() => {
    // Marca componente como montado e gera estrelas apenas no cliente
    if (stars.current.length === 0) {
      stars.current = Array.from({ length: 100 }, () => ({  // ⬅️ Aumentado para 100 estrelas
        width: Math.random() * 3 + 1,
        height: Math.random() * 3 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        animationDelay: Math.random() * 3,
        animationDuration: Math.random() * 3 + 2,
        moveX: (Math.random() - 0.5) * 0.5,  // ⬅️ NOVO: Movimento horizontal aleatório
        moveY: (Math.random() - 0.5) * 0.5   // ⬅️ NOVO: Movimento vertical aleatório
      }))
    }
    setIsMounted(true)

    // ⬅️ NOVO: Animação das estrelas
    let animationFrameId: number
    const animateStars = () => {
      const starsContainer = document.getElementById('stars-container')
      if (starsContainer) {
        const starElements = starsContainer.children
        stars.current.forEach((star, i) => {
          if (starElements[i]) {
            const element = starElements[i] as HTMLElement
            const currentLeft = parseFloat(element.style.left) || star.left
            const currentTop = parseFloat(element.style.top) || star.top
            
            let newLeft = currentLeft + star.moveX
            let newTop = currentTop + star.moveY
            
            // Faz as estrelas reaparecerem do outro lado
            if (newLeft > 100) newLeft = 0
            if (newLeft < 0) newLeft = 100
            if (newTop > 100) newTop = 0
            if (newTop < 0) newTop = 100
            
            element.style.left = `${newLeft}%`
            element.style.top = `${newTop}%`
          }
        })
      }
      animationFrameId = requestAnimationFrame(animateStars)
    }
    
    animationFrameId = requestAnimationFrame(animateStars)
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      const xPos = (clientX / innerWidth - 0.5)
      const yPos = (clientY / innerHeight - 0.5)

      if (aliensRef.current) {
        const moveX = xPos * 20
        const moveY = yPos * 20
        aliensRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }

      if (planetRef.current) {
        const moveX = xPos * 15
        const moveY = yPos * 15
        planetRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }

      if (typeRef.current) {
        const moveX = xPos * 10
        const moveY = yPos * 10
        typeRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
      }

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
      className="relative w-full px-4 py-8 md:py-12 text-center overflow-hidden min-h-[600px] md:min-h-[700px] flex items-center"
      style={{ 
        background: '#0a0e27'  // ⬅️ MUDADO: Fundo azul escuro espacial
      }}
    >
      {/* Estrelas de fundo com movimento */}
      {isMounted && (
        <div id="stars-container" className="absolute inset-0 overflow-hidden">
          {stars.current.map((star, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                width: `${star.width}px`,
                height: `${star.height}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.5)',  // ⬅️ Glow effect
                opacity: Math.random() * 0.5 + 0.5  // ⬅️ Opacidade variada
              }}
            />
          ))}
        </div>
      )}

      {/* Camadas de imagens com parallax */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Aliens */}
        <div
          ref={aliensRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ opacity: 1 - scrollDelta * 0.2 }}
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
             className="absolute top-[35%] md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>
       
        {/* Planet */}
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
            className="absolute top-[35%] md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>

        {/* Type (SMART text) */}
        <div
          ref={typeRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ opacity: 1 - scrollDelta * 0.4 }}
        >
          <img 
            srcSet="
              https://makarispo.com.br/wp-content/uploads/2025/10/logo-final-type-360.png 360w,
              https://makarispo.com.br/wp-content/uploads/2025/10/logo-final-type-600.png 600w,
              https://makarispo.com.br/wp-content/uploads/2025/10/logo-final-type-900.png 900w,
              https://makarispo.com.br/wp-content/uploads/2025/10/logo-final-type-1200.png 1200w
            "
            sizes="(min-width: 768px) 50vw, 90vw"
            src="https://makarispo.com.br/wp-content/uploads/2025/10/logo-final-type-600.png"
            alt=""
            className="absolute top-[35%] md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>

        {/* Rocket */}
        <div
          ref={rocketRef}
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{ opacity: 1 - scrollDelta * 0.1 }}
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
             className="absolute top-[35%] md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] md:w-[50vw] h-auto max-w-[600px]"
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 max-w-5xl mx-auto mt-[320px] md:mt-[420px]">
        {/* ⬅️ MUDADO: Reduzi de 500/550 para 380/420 */}
        <div className="bg-gradient-to-b from-transparent via-[#0a0e27]/50 to-[#0a0e27] py-12 px-8 rounded-lg backdrop-blur-sm">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 md:mb-8 drop-shadow-lg" style={{ lineHeight: '1.2' }}>
            Preparando o Aluno para o Futuro!
          </h1>
          <p className="text-lg md:text-2xl text-white mb-8 md:mb-10 drop-shadow-md" style={{ opacity: 0.95 }}>
            Programação, lógica, inglês e matemática aplicada — tudo em microlições divertidas que engajam de verdade 🎮
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="https://wa.me/5541995999648" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-5 px-12 rounded-full font-bold text-xl transition-all hover:shadow-2xl hover:-translate-y-1"
              style={{ 
                background: 'white',
                color: '#667eea',
                boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
              }}
            >
              Experimentar Grátis
            </a>
            <a 
              href="#como-funciona"
              onClick={(e) => {
                e.preventDefault()
                const target = document.querySelector('#como-funciona')
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="inline-block py-5 px-12 rounded-full font-bold text-xl text-white transition-all hover:bg-white/30"
              style={{ 
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid white'
              }}
            >
              Ver Como Funciona
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}