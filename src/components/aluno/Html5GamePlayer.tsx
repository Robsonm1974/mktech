'use client'

interface Html5GamePlayerProps {
  url: string
  onComplete?: () => void
}

export default function Html5GamePlayer({ url, onComplete }: Html5GamePlayerProps) {
  return (
    <div className="relative aspect-video bg-slate-900">
      <iframe
        src={url}
        className="w-full h-full"
        title="HTML5 Game"
        allow="fullscreen; gamepad; autoplay"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
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
