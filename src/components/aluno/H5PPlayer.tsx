'use client'

interface H5PPlayerProps {
  url: string
  onComplete?: () => void
}

export default function H5PPlayer({ url, onComplete }: H5PPlayerProps) {
  // H5P também usa iframe para embedar conteúdo interativo

  return (
    <div className="relative aspect-video bg-white">
      <iframe
        src={url}
        className="w-full h-full"
        title="H5P Interactive Content"
        allow="fullscreen; autoplay"
        allowFullScreen
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


