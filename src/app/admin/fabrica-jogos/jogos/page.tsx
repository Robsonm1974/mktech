'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'
import { Plus, PlayCircle, Edit, Trash2, Clock, GraduationCap } from 'lucide-react'

interface Game {
  id: string
  codigo: string
  titulo: string
  descricao: string | null
  duracao_segundos: number
  status: string
  publicado: boolean
  created_at: string
  anos_escolares?: { nome: string } | null
  disciplinas?: { nome: string } | null
}

export default function JogosPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          anos_escolares:ano_escolar_id(nome),
          disciplinas:disciplina_id(nome)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar jogos:', error)
        toast.error(`Erro ao carregar jogos: ${error.message}`)
        return
      }

      setGames(data || [])
      console.log('✅ Jogos carregados:', data?.length || 0)
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao carregar jogos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este jogo?')) return

    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Jogo excluído com sucesso!')
      loadGames()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir jogo')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('games')
        .update({ 
          publicado: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error

      toast.success(!currentStatus ? 'Jogo publicado!' : 'Jogo despublicado!')
      loadGames()
    } catch (error) {
      console.error('Erro ao publicar:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const filteredGames = games.filter(game => {
    if (filter === 'published') return game.publicado
    if (filter === 'draft') return !game.publicado
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando jogos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciar Jogos</h1>
          <p className="text-slate-600 mt-1">
            {games.length} {games.length === 1 ? 'jogo cadastrado' : 'jogos cadastrados'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/admin/fabrica-jogos/jogos/criar')}
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar Novo Jogo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todos ({games.length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          onClick={() => setFilter('published')}
        >
          Publicados ({games.filter(g => g.publicado).length})
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          onClick={() => setFilter('draft')}
        >
          Rascunhos ({games.filter(g => !g.publicado).length})
        </Button>
      </div>

      {/* Lista de Jogos */}
      {filteredGames.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Nenhum jogo encontrado
            </h3>
            <p className="text-slate-600 mb-6 text-center">
              {filter === 'all' 
                ? 'Comece criando seu primeiro jogo educacional!'
                : `Nenhum jogo ${filter === 'published' ? 'publicado' : 'em rascunho'} ainda.`
              }
            </p>
            {filter === 'all' && (
              <Button
                onClick={() => router.push('/admin/fabrica-jogos/jogos/criar')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Jogo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{game.titulo}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {game.descricao || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  {game.publicado ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                      Publicado
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                      Rascunho
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Info do jogo */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    {game.duracao_segundos}s ({Math.floor(game.duracao_segundos / 60)}min)
                  </div>
                  {game.anos_escolares && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <GraduationCap className="w-4 h-4" />
                      {game.anos_escolares.nome}
                      {game.disciplinas && ` - ${game.disciplinas.nome}`}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/fabrica-jogos/jogos/${game.id}/testar`)}
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Testar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/fabrica-jogos/jogos/${game.id}/editar`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(game.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Publicar/Despublicar */}
                <Button
                  variant={game.publicado ? 'secondary' : 'default'}
                  size="sm"
                  className="w-full"
                  onClick={() => handleTogglePublish(game.id, game.publicado)}
                >
                  {game.publicado ? 'Despublicar' : 'Publicar Jogo'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

