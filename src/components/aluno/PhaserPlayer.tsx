'use client'

interface PhaserPlayerProps {
  url: string
  onComplete?: () => void
}

export default function PhaserPlayer({ url, onComplete }: PhaserPlayerProps) {
  // Para jogos Phaser, geralmente usamos iframe apontando para a URL hospedada do jogo

  return (
    <div className="relative aspect-video bg-slate-900">
      <iframe
        src={url}
        className="w-full h-full"
        title="Phaser Game"
        allow="fullscreen; gamepad; autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
      
      {onComplete && (
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm shadow-lg"
        >
          Marcar como Concluído
        </button>
      )}
    </div>
  )
}


