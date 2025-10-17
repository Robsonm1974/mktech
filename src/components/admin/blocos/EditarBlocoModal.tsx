'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface BlocoData {
  id: string
  codigo_bloco: string
  numero_sequencia: number
  titulo: string
  conteudo_texto: string
  tipo_midia: string | null
  midia_url: string | null
  pontos_bloco: number
  status: string
}

interface EditarBlocoModalProps {
  blocoId: string | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export default function EditarBlocoModal({ blocoId, isOpen, onClose, onSave }: EditarBlocoModalProps) {
  const supabase = createSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bloco, setBloco] = useState<BlocoData | null>(null)
  const [form, setForm] = useState({
    titulo: '',
    conteudo_texto: '',
    pontos_bloco: 10,
    tipo_midia: '',
    midia_url: ''
  })

  useEffect(() => {
    if (blocoId && isOpen) {
      loadBloco()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocoId, isOpen])

  const loadBloco = async () => {
    if (!blocoId) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('blocos_templates')
        .select('*')
        .eq('id', blocoId)
        .single()

      if (error) throw error

      setBloco(data)
      setForm({
        titulo: data.titulo || '',
        conteudo_texto: data.conteudo_texto || '',
        pontos_bloco: data.pontos_bloco || 10,
        tipo_midia: data.tipo_midia || '',
        midia_url: data.midia_url || ''
      })
    } catch (error) {
      console.error('Erro ao carregar bloco:', error)
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
      toast.error(`Erro ao carregar bloco: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!blocoId) return

    try {
      setSaving(true)
      
      const { error } = await supabase
        .from('blocos_templates')
        .update({
          titulo: form.titulo,
          conteudo_texto: form.conteudo_texto,
          pontos_bloco: form.pontos_bloco,
          tipo_midia: form.tipo_midia || null,
          midia_url: form.midia_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', blocoId)

      if (error) throw error

      toast.success('Bloco atualizado com sucesso!')
      onSave?.()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar bloco')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Bloco</DialogTitle>
          <DialogDescription>
            {bloco?.codigo_bloco || 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="modal-titulo" className="block text-sm font-medium text-slate-700 mb-1">
                Título do Bloco *
              </label>
              <Input
                id="modal-titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: O Despertar do Pensamento!"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="modal-conteudo" className="block text-sm font-medium text-slate-700 mb-1">
                Conteúdo
              </label>
              <textarea
                id="modal-conteudo"
                rows={12}
                value={form.conteudo_texto}
                onChange={(e) => setForm({ ...form, conteudo_texto: e.target.value })}
                placeholder="Cole ou edite o conteúdo do bloco..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="modal-pontos" className="block text-sm font-medium text-slate-700 mb-1">
                  Pontos do Bloco
                </label>
                <Input
                  id="modal-pontos"
                  type="number"
                  min="0"
                  value={form.pontos_bloco}
                  onChange={(e) => setForm({ ...form, pontos_bloco: parseInt(e.target.value) || 0 })}
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="modal-tipo-midia" className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Mídia
                </label>
                <select
                  id="modal-tipo-midia"
                  value={form.tipo_midia}
                  onChange={(e) => setForm({ ...form, tipo_midia: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="">Nenhuma</option>
                  <option value="video">Vídeo</option>
                  <option value="lottie">Lottie Animation</option>
                  <option value="phaser">Jogo Phaser</option>
                  <option value="h5p">H5P</option>
                </select>
              </div>
            </div>

            {form.tipo_midia && (
              <div>
                <label htmlFor="modal-midia-url" className="block text-sm font-medium text-slate-700 mb-1">
                  URL da Mídia
                </label>
                <Input
                  id="modal-midia-url"
                  type="url"
                  value={form.midia_url}
                  onChange={(e) => setForm({ ...form, midia_url: e.target.value })}
                  placeholder="https://..."
                  disabled={saving}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

