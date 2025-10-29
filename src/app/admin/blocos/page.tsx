'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, BookOpen, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BlocosGroupedList from '@/components/admin/blocos/BlocosGroupedList'

interface AnoEscolar {
  id: string
  nome: string
  idade_referencia: number
  ordem: number
}

interface BlocoWithRelations {
  id: string
  codigo_bloco: string
  titulo: string
  status: string
  pontos_bloco: number
  tipo_midia: string | null
  quiz_id: string | null
  ano_escolar_id: string | null
  disciplinas: {
    codigo: string
    nome: string
    cor_hex: string
    icone: string | null
  } | null
  planejamentos: {
    ano_escolar_id: string | null
    codigo_base: string | null
  } | null
}

interface Disciplina {
  nome: string
  codigo: string
  cor_hex: string
  icone: string
  blocos: BlocoWithRelations[]
}

interface AnoGroup {
  [disciplinaNome: string]: Disciplina
}

export default function BlocosPage() {
  const router = useRouter()
  const [anosEscolares, setAnosEscolares] = useState<AnoEscolar[]>([])
  const [blocos, setBlocos] = useState<BlocoWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAnos, setLoadingAnos] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'anos' | 'lista'>('anos')
  const [filtroAno, setFiltroAno] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadAnosEscolares()
    loadBlocos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAnosEscolares = async () => {
    setLoadingAnos(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('get_anos_escolares')
      
      if (rpcError) {
        console.error('❌ Erro ao carregar anos:', rpcError.message)
        setAnosEscolares([])
      } else if (data) {
        setAnosEscolares(data)
        console.log('✅ Anos carregados:', data.length)
      }
    } catch (err) {
      console.error('💥 Exceção ao carregar anos:', err)
      setAnosEscolares([])
    } finally {
      setLoadingAnos(false)
    }
  }

  const loadBlocos = async () => {
    console.log('📦 Carregando blocos via RPC...')
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_blocos_with_relations_admin')
      
      if (rpcError) {
        const errorMsg = rpcError.message || 'Erro desconhecido ao carregar blocos'
        console.error('❌ Erro RPC:', errorMsg)
        setError(`Erro ao carregar blocos: ${errorMsg}`)
        setBlocos([])
        setLoading(false)
        return
      }
      
      if (data !== null && data !== undefined) {
        let blocosArray: BlocoWithRelations[] = []
        
        if (Array.isArray(data)) {
          blocosArray = data
        } else if (typeof data === 'string') {
          blocosArray = JSON.parse(data)
        } else if (typeof data === 'object') {
          blocosArray = Object.values(data)
        }
        
        console.log('✅ Blocos processados:', blocosArray.length)
        setBlocos(blocosArray)
      } else {
        console.log('⚠️ Nenhum dado retornado')
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

  // Agrupar blocos por Ano → Disciplina
  const groupedByAno: Record<string, AnoGroup> = {}
  
  blocos.forEach((bloco) => {
    const anoId = bloco.planejamentos?.ano_escolar_id || bloco.ano_escolar_id || 'Sem Ano'
    const disciplinaNome = bloco.disciplinas?.nome || 'Sem Disciplina'
    const disciplinaCodigo = bloco.disciplinas?.codigo || 'SEM-COD'
    const disciplinaCor = bloco.disciplinas?.cor_hex || '#3B82F6'
    const disciplinaIcone = bloco.disciplinas?.icone || '📘'

    if (!groupedByAno[anoId]) {
      groupedByAno[anoId] = {}
    }

    if (!groupedByAno[anoId][disciplinaNome]) {
      groupedByAno[anoId][disciplinaNome] = {
        nome: disciplinaNome,
        codigo: disciplinaCodigo,
        cor_hex: disciplinaCor,
        icone: disciplinaIcone,
        blocos: []
      }
    }

    groupedByAno[anoId][disciplinaNome].blocos.push(bloco)
  })

  // Contar blocos por ano
  const blocosCountByAno: Record<string, number> = {}
  anosEscolares.forEach(ano => {
    const anoGroup = groupedByAno[ano.id]
    blocosCountByAno[ano.id] = anoGroup 
      ? Object.values(anoGroup).reduce((sum, disc) => sum + disc.blocos.length, 0)
      : 0
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fábrica de Blocos</h1>
          <p className="text-slate-600 mt-1">
            {viewMode === 'anos' 
              ? 'Organize por ano escolar e disciplina'
              : 'Lista completa de blocos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const destino = filtroAno ? `/admin/blocos/importar?ano=${filtroAno}` : '/admin/blocos/importar'
              router.push(destino)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Blocos (Planejamento)
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await Promise.all([loadAnosEscolares(), loadBlocos()])
            }}
            disabled={loading || loadingAnos}
          >
            {(loading || loadingAnos) ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </>
            )}
          </Button>

          <Button
            variant={viewMode === 'anos' ? 'default' : 'outline'}
            onClick={() => setViewMode('anos')}
            disabled={loading}
          >
            Por Ano
          </Button>

          <Button
            variant={viewMode === 'lista' ? 'default' : 'outline'}
            onClick={() => {
              setFiltroAno(null)
              setViewMode('lista')
            }}
            disabled={loading}
          >
            Lista Completa
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {(loading || loadingAnos) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : viewMode === 'anos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anosEscolares.map((ano) => {
            const totalBlocos = blocosCountByAno[ano.id] || 0
            
            return (
              <div
                key={ano.id}
                className="bg-white rounded-lg border-2 border-slate-200 p-6 hover:border-blue-400 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{ano.nome}</h3>
                      <p className="text-sm text-slate-500">{ano.idade_referencia} anos</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Blocos criados:</span>
                    <span className="font-bold text-slate-900">{totalBlocos}</span>
                  </div>
                  
                  {groupedByAno[ano.id] && (
                    <div className="text-xs text-slate-500">
                      {Object.keys(groupedByAno[ano.id] || {}).length} disciplina(s)
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/blocos/importar?ano=${ano.id}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Importar Planejamento
                  </Button>
                  
                  {totalBlocos > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFiltroAno(ano.id)
                        setViewMode('lista')
                      }}
                    >
                      Ver Blocos
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          {filtroAno && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltroAno(null)
                  setViewMode('anos')
                }}
              >
                ← Voltar para Anos
              </Button>
              <span className="text-sm text-slate-600">
                Mostrando blocos do: {anosEscolares.find(a => a.id === filtroAno)?.nome || filtroAno}
              </span>
            </div>
          )}
          <BlocosGroupedList 
            initialBlocos={filtroAno ? blocos.filter(b => 
              b.planejamentos?.ano_escolar_id === filtroAno || b.ano_escolar_id === filtroAno
            ) : blocos} 
          />
        </>
      )}
    </div>
  )
}

