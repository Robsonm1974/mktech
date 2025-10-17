'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Upload, RefreshCw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import BlocosGroupedList from '@/components/admin/blocos/BlocosGroupedList'

interface BlocoWithRelations {
  id: string
  codigo_bloco: string
  titulo: string
  status: string
  pontos_bloco: number
  tipo_midia: string | null
  quiz_id: string | null
  disciplinas: {
    codigo: string
    nome: string
    cor_hex: string
    icone: string | null
  } | null
  planejamentos: {
    turma: string
    codigo_base: string | null
  } | null
}

export default function BlocosPage() {
  const [blocos, setBlocos] = useState<BlocoWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadBlocos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadBlocos = async () => {
    console.log('📦 Carregando blocos via RPC...')
    setLoading(true)
    setError(null)
    
    try {
      // Usar RPC para bypass RLS
      const { data, error: rpcError } = await supabase.rpc('get_blocos_with_relations_admin')
      
      console.log('📦 RPC get_blocos_with_relations_admin - Resposta completa:', { 
        hasData: !!data, 
        dataType: typeof data,
        dataIsArray: Array.isArray(data),
        dataValue: data,
        hasError: !!rpcError,
        errorCode: rpcError?.code,
        errorMessage: rpcError?.message,
        errorDetails: rpcError?.details,
        fullError: rpcError
      })
      
      // Se houver erro, mas for um erro vazio, pode ser que a função não exista
      if (rpcError) {
        const errorMsg = rpcError.message || 'Erro desconhecido ao carregar blocos'
        console.error('❌ Erro RPC:', errorMsg)
        
        if (!rpcError.message && !rpcError.code) {
          setError('A função RPC pode não existir. Execute: supabase/migrations/FIX_GET_BLOCOS_RPC.sql')
        } else {
          setError(`Erro ao carregar blocos: ${errorMsg}`)
        }
        setBlocos([])
        setLoading(false)
        return
      }
      
      // Processar dados
      if (data !== null && data !== undefined) {
        let blocosArray: BlocoWithRelations[] = []
        
        // A função retorna JSONB, pode vir como array ou string
        if (Array.isArray(data)) {
          blocosArray = data
        } else if (typeof data === 'string') {
          blocosArray = JSON.parse(data)
        } else if (typeof data === 'object') {
          // Pode ser um objeto JSONB que precisa ser convertido
          blocosArray = Object.values(data)
        }
        
        console.log('✅ Blocos processados:', blocosArray.length)
        setBlocos(blocosArray)
      } else {
        console.log('⚠️ Nenhum dado retornado (null/undefined)')
        setBlocos([])
      }
    } catch (err) {
      console.error('💥 Exceção ao carregar blocos:', err)
      setError(`Erro inesperado: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
      setBlocos([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fábrica de Blocos</h1>
          <p className="text-slate-600 mt-1">Gerencie blocos de conteúdo reutilizáveis</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadBlocos}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Recarregar
          </Button>
          <Link href="/admin/blocos/importar">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importar Planejamento
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">⚠️ Erro ao carregar blocos</h3>
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={loadBlocos}>
              Tentar novamente
            </Button>
            <Link href="/admin/blocos/importar">
              <Button size="sm">Importar Planejamento</Button>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      ) : !error && blocos.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
          <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Nenhum bloco criado ainda
          </h3>
          <p className="text-slate-600 mb-4">
            Comece importando um planejamento para gerar seus primeiros blocos.
          </p>
          <Link href="/admin/blocos/importar">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importar Planejamento
            </Button>
          </Link>
        </div>
      ) : (
        <BlocosGroupedList initialBlocos={blocos} />
      )}
    </div>
  )
}

