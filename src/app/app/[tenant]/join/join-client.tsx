'use client'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function JoinPageClient({ tenant }: { tenant: string }) {
  const sp = useSearchParams()
  const sessionId = sp.get('session') ?? ''
  const code = sp.get('code') ?? ''
  const [studentId, setStudentId] = useState('')
  const [pin, setPin] = useState('')

  return (
    <main className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Entrar na Aula</h1>
      <p className="text-sm text-gray-500 mb-2">Escola: {tenant}</p>
      <p className="text-sm text-gray-500 mb-6">Sessão: {sessionId || code || '—'}</p>

      <form className="space-y-3" onSubmit={(e)=>{ e.preventDefault(); /* TODO: call API join */ }}>
        <input className="w-full border p-2 rounded" placeholder="ID do aluno" value={studentId} onChange={e=>setStudentId(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="PIN (4 dígitos)" value={pin} onChange={e=>setPin(e.target.value)} inputMode="numeric" maxLength={6}/>
        <button className="px-4 py-2 rounded bg-black text-white">Entrar</button>
      </form>
    </main>
  )
}
