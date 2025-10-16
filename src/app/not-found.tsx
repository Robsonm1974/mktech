import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ padding: 24, textAlign: 'center' }}>
      <h1>Página não encontrada</h1>
      <p>Verifique a URL ou volte à página inicial.</p>
      <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        Voltar para a home
      </Link>
    </main>
  )
}
