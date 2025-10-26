'use client'

export default function ErrorPage({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ocorreu um erro</h1>
        <p className="text-slate-600 mb-6">Tente novamente em instantes.</p>
        <button 
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
