'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, BookOpen, Clock, Award, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Aula {
  id: string
  titulo: string
  descricao: string | null
  ano_escolar_id: string | null
  disciplina_id: string | null
  objetivos_aprendizado: string | null
  duracao_minutos: number
  pontos_totais: number
  publicada: boolean
  total_blocos: number
  disciplina_nome: string | null
  disciplina_codigo: string | null
  ano_nome: string | null
  blocos_ids: string[] | null
  created_at: string
  updated_at: string
}

interface BlocoTemplate {
  id: string
  codigo_bloco: string
  titulo: string
  pontos_bloco: number
  status: string
  tipo_midia: string | null
}

export default function DetalhesAulaPage() {
  const router = useRouter()
  const params = useParams()
  const aulaId = params?.id as string

  const [aula, setAula] = useState<Aula | null>(null)
  const [blocos, setBlocos] = useState<BlocoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (aulaId) {
      loadAula()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aulaId])

  const loadAula = async () => {
    try {
      setLoading(true)
      
      // Carregar aula
      const { data: aulas, error } = await supabase.rpc('get_aulas_with_relations_admin')
      
      if (error) throw error

      const aulaEncontrada = aulas?.find((a: Aula) => a.id === aulaId)
      
      if (!aulaEncontrada) {
        toast.error('Aula não encontrada')
        router.push('/admin/aulas')
        return
      }

      setAula(aulaEncontrada)

      // Carregar blocos
      if (aulaEncontrada.blocos_ids && aulaEncontrada.blocos_ids.length > 0) {
        const { data: blocosData, error: blocosError } = await supabase
          .from('blocos_templates')
          .select('id, codigo_bloco, titulo, pontos_bloco, status, tipo_midia')
          .in('id', aulaEncontrada.blocos_ids)

        if (!blocosError && blocosData) {
          // Ordenar blocos conforme a ordem em blocos_ids
          const blocosOrdenados = aulaEncontrada.blocos_ids
            .map((id: string) => blocosData.find((b: BlocoTemplate) => b.id === id))
            .filter(Boolean) as BlocoTemplate[]

          setBlocos(blocosOrdenados)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar aula:', error)
      toast.error('Erro ao carregar aula')
      router.push('/admin/aulas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja deletar esta aula? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)

      const { data, error } = await supabase.rpc('delete_aula_admin', {
        p_aula_id: aulaId
      })

      if (error) throw error

      if (!data || !data.success) {
        throw new Error(data?.message || 'Erro ao deletar aula')
      }

      toast.success('Aula deletada com sucesso!')
      router.push('/admin/aulas')
      router.refresh()
    } catch (error) {
      console.error('Erro ao deletar aula:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar aula')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!aula) {
    return (
      <div className="text-center py-12">
        <p>Aula não encontrada</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{aula.titulo}</h1>
              {aula.publicada && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  PUBLICADA
                </span>
              )}
              {!aula.publicada && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                  RASCUNHO
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/aulas/editar/${aulaId}`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Blocos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{aula.total_blocos}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Duração</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{aula.duracao_minutos} min</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">Pontos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{aula.pontos_totais}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Status</span>
          </div>
          <p className="text-lg font-semibold text-slate-900">
            {aula.publicada ? 'Publicada' : 'Rascunho'}
          </p>
        </div>
      </div>

      {/* Informações */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Informações</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aula.ano_nome && (
            <div>
              <p className="text-sm font-medium text-slate-600">Ano Escolar</p>
              <p className="text-slate-900">{aula.ano_nome}</p>
            </div>
          )}
          {aula.disciplina_nome && (
            <div>
              <p className="text-sm font-medium text-slate-600">Disciplina</p>
              <p className="text-slate-900">
                {aula.disciplina_codigo} - {aula.disciplina_nome}
              </p>
            </div>
          )}
        </div>

        {aula.descricao && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Descrição</p>
            <p className="text-slate-900">{aula.descricao}</p>
          </div>
        )}

        {aula.objetivos_aprendizado && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-1">Objetivos de Aprendizado</p>
            <p className="text-slate-900">{aula.objetivos_aprendizado}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div>
            <p className="font-medium">Criado em:</p>
            <p>{new Date(aula.created_at).toLocaleString('pt-BR')}</p>
          </div>
          <div>
            <p className="font-medium">Atualizado em:</p>
            <p>{new Date(aula.updated_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Blocos */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Blocos da Aula ({blocos.length})
        </h2>
        
        {blocos.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Nenhum bloco vinculado</p>
        ) : (
          <div className="space-y-2">
            {blocos.map((bloco, index) => (
              <div
                key={bloco.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm font-semibold">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-slate-900">{bloco.titulo}</h3>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-slate-600">
                      <span>{bloco.codigo_bloco}</span>
                      <span>•</span>
                      <span>{bloco.pontos_bloco} pontos</span>
                      {bloco.tipo_midia && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{bloco.tipo_midia}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="capitalize">{bloco.status}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/blocos?bloco=${bloco.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

