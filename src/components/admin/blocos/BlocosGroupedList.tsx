'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Film, HelpCircle, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import EditarBlocoModal from './EditarBlocoModal'
import VisualizarQuizModal from './VisualizarQuizModal'
import ConfigurarMidiaModal from './ConfigurarMidiaModal'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { toast } from 'sonner'

interface BlocoTemplate {
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

interface BlocosGroupedListProps {
  initialBlocos: BlocoTemplate[]
}

export default function BlocosGroupedList({ initialBlocos }: BlocosGroupedListProps) {
  const [blocos] = useState<BlocoTemplate[]>(initialBlocos)
  const [modalBlocoId, setModalBlocoId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null)
  const [midiaModalOpen, setMidiaModalOpen] = useState(false)
  const [selectedMidiaBlocoId, setSelectedMidiaBlocoId] = useState<string | null>(null)

  const handleOpenModal = (blocoId: string) => {
    setModalBlocoId(blocoId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setModalBlocoId(null)
  }

  const handleOpenMidiaModal = (blocoId: string) => {
    setSelectedMidiaBlocoId(blocoId)
    setMidiaModalOpen(true)
  }

  const handleCloseMidiaModal = () => {
    setMidiaModalOpen(false)
    setSelectedMidiaBlocoId(null)
  }

  const handleOpenQuizModal = (blocoId: string, quizId: string | null) => {
    setModalBlocoId(blocoId)
    setSelectedQuizId(quizId)
    setQuizModalOpen(true)
  }

  const handleCloseQuizModal = () => {
    setQuizModalOpen(false)
    setModalBlocoId(null)
    setSelectedQuizId(null)
  }

  const handleSave = () => {
    // Recarregar página para atualizar dados
    window.location.reload()
  }

  const handleDelete = async (blocoId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este bloco? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const supabase = createSupabaseBrowserClient()
      
      // Buscar quiz_id do bloco
      const { data: bloco } = await supabase
        .from('blocos_templates')
        .select('quiz_id')
        .eq('id', blocoId)
        .single()

      // Se tem quiz, deletar primeiro
      if (bloco?.quiz_id) {
        await supabase
          .from('quizzes')
          .delete()
          .eq('id', bloco.quiz_id)
      }

      // Deletar bloco
      const { error } = await supabase
        .from('blocos_templates')
        .delete()
        .eq('id', blocoId)

      if (error) throw error

      toast.success('Bloco deletado com sucesso!')
      window.location.reload()
    } catch (error) {
      console.error('Erro ao deletar bloco:', error)
      toast.error('Erro ao deletar bloco')
    }
  }

  const groupedBlocos = useMemo(() => {
    const grouped: Record<string, BlocoTemplate[]> = {}
    
    blocos.forEach((bloco) => {
      const disciplinaNome = bloco.disciplinas?.nome || 'Sem Disciplina'
      const anoId = bloco.planejamentos?.ano_escolar_id || bloco.ano_escolar_id || 'Sem Ano'
      const key = `${disciplinaNome} - ${anoId}`
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(bloco)
    })
    
    // Ordenar blocos dentro de cada grupo por codigo_bloco
    Object.keys(grouped).forEach(key => {
      const blocosArray = grouped[key]
      if (!blocosArray) return
      
      blocosArray.sort((a, b) => {
        // Extrair número do codigo_bloco (ex: ALG-1-1 -> 1)
        const getNumero = (codigo: string) => {
          const match = codigo.match(/(\d+)$/)
          return match?.[1] ? parseInt(match[1]) : 0
        }
        return getNumero(a.codigo_bloco) - getNumero(b.codigo_bloco)
      })
    })
    
    return grouped
  }, [blocos])

  const getStatusBadge = (status: string) => {
    const config = {
      completo: { className: 'bg-green-100 text-green-700', label: 'Completo' },
      com_midia: { className: 'bg-blue-100 text-blue-700', label: 'Com Mídia' },
      com_quiz: { className: 'bg-yellow-100 text-yellow-700', label: 'Com Quiz' },
      incompleto: { className: 'bg-slate-100 text-slate-600', label: 'Incompleto' }
    } as const
    
    type StatusKey = keyof typeof config
    const statusKey = (status as StatusKey) in config ? (status as StatusKey) : 'incompleto'
    const { className, label } = config[statusKey]
    return <span className={`px-2 py-1 text-xs rounded ${className}`}>{label}</span>
  }

  if (blocos.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500 mb-4">Nenhum bloco criado ainda.</p>
        <Link href="/admin/blocos/importar" className="text-blue-600 hover:underline">
          Importar primeiro planejamento
        </Link>
      </Card>
    )
  }

  return (
    <>
      <EditarBlocoModal
        blocoId={modalBlocoId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
      />

      <VisualizarQuizModal
        blocoId={modalBlocoId}
        quizId={selectedQuizId}
        isOpen={quizModalOpen}
        onClose={handleCloseQuizModal}
        onDelete={handleSave}
      />
      
      <div className="space-y-6">
        {Object.entries(groupedBlocos).map(([grupo, blocosList]) => {
        const primeiroBloco = blocosList[0]
        const cor = primeiroBloco?.disciplinas?.cor_hex || '#3B82F6'
        const icone = primeiroBloco?.disciplinas?.icone || '📚'
        
        return (
          <Card key={grupo} className="p-6" style={{ borderLeftWidth: '4px', borderLeftColor: cor }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{icone}</span>
              <h2 className="text-xl font-bold text-slate-900">{grupo}</h2>
              <Badge variant="outline">{blocosList.length} blocos</Badge>
            </div>
            
            <div className="space-y-2">
              {blocosList.map((bloco) => (
                <div
                  key={bloco.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100 transition cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-slate-500">
                        {bloco.codigo_bloco}
                      </span>
                      <span className="font-medium text-slate-900">{bloco.titulo}</span>
                      {getStatusBadge(bloco.status)}
                      {bloco.tipo_midia && (
                        <Badge variant="secondary" className="text-xs">
                          {bloco.tipo_midia}
                        </Badge>
                      )}
                      {bloco.quiz_id && (
                        <Badge variant="secondary" className="text-xs">
                          Quiz
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {bloco.pontos_bloco} pontos
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      title="Editar bloco"
                      onClick={() => handleOpenModal(bloco.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      title="Configurar mídia"
                      onClick={() => handleOpenMidiaModal(bloco.id)}
                    >
                      <Film className="h-4 w-4 mr-1" />
                      Mídia
                    </Button>

                    {bloco.quiz_id ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Visualizar quiz"
                        onClick={() => handleOpenQuizModal(bloco.id, bloco.quiz_id)}
                      >
                        <HelpCircle className="h-4 w-4 mr-1" />
                        Quiz
                      </Button>
                    ) : (
                      <Link href={`/admin/quizzes/criar?bloco=${bloco.id}`}>
                        <Button size="sm" variant="outline" title="Criar quiz">
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Quiz
                        </Button>
                      </Link>
                    )}

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-600" 
                      title="Deletar bloco"
                      onClick={() => handleDelete(bloco.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })}
      </div>

      {/* Modal de Mídia */}
      <ConfigurarMidiaModal
        blocoId={selectedMidiaBlocoId}
        isOpen={midiaModalOpen}
        onClose={handleCloseMidiaModal}
        onSave={() => {
          // Recarregar a página para mostrar a mídia atualizada
          window.location.reload()
        }}
      />
    </>
  )
}

