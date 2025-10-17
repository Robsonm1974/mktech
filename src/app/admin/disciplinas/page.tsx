'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Edit, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Disciplina } from '@/types/admin'

export default function DisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadDisciplinas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDisciplinas = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_disciplinas_admin')

      if (rpcError) throw rpcError

      setDisciplinas(data || [])
    } catch (err) {
      console.error('Erro ao carregar disciplinas:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar disciplinas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Disciplinas</h1>
          <p className="text-slate-600 mt-1">Gerencie as disciplinas disponíveis no sistema</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadDisciplinas}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recarregar
          </Button>
          <Link href="/admin/disciplinas/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Disciplina
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      ) : disciplinas.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 mb-4">Nenhuma disciplina cadastrada</p>
          <Link href="/admin/disciplinas/nova">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Disciplina
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {disciplinas.map((disciplina) => (
            <Card
              key={disciplina.id}
              className="p-6 hover:shadow-lg transition"
              style={{ borderLeftWidth: '4px', borderLeftColor: disciplina.cor_hex }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{disciplina.icone}</span>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{disciplina.nome}</h3>
                    <p className="text-xs text-slate-500 font-mono">{disciplina.codigo}</p>
                  </div>
                </div>
                <Link href={`/admin/disciplinas/${disciplina.id}/editar`}>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {disciplina.descricao && (
                <p className="text-sm text-slate-600 mb-3">{disciplina.descricao}</p>
              )}

              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: disciplina.cor_hex }}
                  title={disciplina.cor_hex}
                />
                <span className={`text-xs px-2 py-1 rounded ${
                  disciplina.ativa 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {disciplina.ativa ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

