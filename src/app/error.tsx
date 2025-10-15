'use client'

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <main style={{ padding: 24 }}>
          <h1>Ocorreu um erro</h1>
          <p>Tente novamente em instantes.</p>
          <button onClick={() => reset()}>Tentar novamente</button>
        </main>
      </body>
    </html>
  )
}
