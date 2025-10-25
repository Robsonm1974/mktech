'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Film, Play } from 'lucide-react'
import { toast } from 'sonner'

interface ConfigurarMidiaModalProps {
  blocoId: string | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

interface BlocoData {
  id: string
  codigo_bloco: string
  titulo: string
  tipo_midia: string | null
  midia_url: string | null
}

export default function ConfigurarMidiaModal({
  blocoId,
  isOpen,
  onClose,
  onSave
}: ConfigurarMidiaModalProps) {
  const [bloco, setBloco] = useState<BlocoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo_midia: '',
    midia_url: ''
  })
  
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    if (isOpen && blocoId) {
      loadBloco()
    } else {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, blocoId])

  const loadBloco = async () => {
    if (!blocoId) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('blocos_templates')
        .select('id, codigo_bloco, titulo, tipo_midia, midia_url')
        .eq('id', blocoId)
        .single()

      if (error) throw error

      setBloco(data)
      setForm({
        tipo_midia: data.tipo_midia || '',
        midia_url: data.midia_url || ''
      })
    } catch (error) {
      console.error('Erro ao carregar bloco:', error)
      toast.error('Erro ao carregar dados do bloco')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setBloco(null)
    setForm({
      tipo_midia: '',
      midia_url: ''
    })
    setLoading(true)
  }

  const handleSave = async () => {
    if (!blocoId) {
      console.error('❌ blocoId não encontrado')
      return
    }

    // Validações
    if (!form.tipo_midia) {
      toast.error('Selecione o tipo de mídia')
      return
    }

    if (!form.midia_url) {
      toast.error('Informe a URL da mídia')
      return
    }

    try {
      setSaving(true)
      
      console.log('🔄 Salvando mídia...', {
        blocoId,
        tipo_midia: form.tipo_midia,
        midia_url: form.midia_url
      })

      // Atualizar bloco (sem updated_at para evitar erro se não existir)
      const { data, error } = await supabase
        .from('blocos_templates')
        .update({
          tipo_midia: form.tipo_midia,
          midia_url: form.midia_url,
          status: 'com_midia'
        })
        .eq('id', blocoId)
        .select()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }

      console.log('✅ Mídia salva com sucesso:', data)
      toast.success('Mídia configurada com sucesso!')
      onSave?.()
      onClose()
    } catch (error) {
      console.error('❌ Erro ao salvar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao configurar mídia: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const convertToEmbedUrl = (url: string, tipo: string): string => {
    if (tipo === 'video') {
      // YouTube
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      // Vimeo
      if (url.includes('vimeo.com/')) {
        const videoId = url.split('vimeo.com/')[1]?.split('/')[0]
        return `https://player.vimeo.com/video/${videoId}`
      }
    }
    return url
  }

  const getEmbedPreview = () => {
    if (!form.tipo_midia || !form.midia_url) return null

    const embedUrl = convertToEmbedUrl(form.midia_url, form.tipo_midia)

    switch (form.tipo_midia) {
      case 'video':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Preview"
            />
          </div>
        )
      
      case 'lottie':
      case 'phaser':
      case 'h5p':
        return (
          <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Play className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Preview será exibido no player da aula</p>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            Configurar Mídia do Bloco
          </DialogTitle>
          <DialogDescription>
            {bloco ? `${bloco.codigo_bloco} - ${bloco.titulo}` : 'Carregando...'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tipo de Mídia */}
            <div>
              <label htmlFor="tipo-midia" className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Mídia *
              </label>
              <select
                id="tipo-midia"
                value={form.tipo_midia}
                onChange={(e) => setForm({ ...form, tipo_midia: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              >
                <option value="">Selecione...</option>
                <option value="video">📹 Vídeo (YouTube, Vimeo, URL direta)</option>
                <option value="lottie">🎬 Animação Lottie (JSON)</option>
                <option value="phaser">🎮 Jogo Phaser</option>
                <option value="h5p">📚 Conteúdo H5P</option>
              </select>
            </div>

            {/* URL da Mídia */}
            {form.tipo_midia && (
              <div>
                <label htmlFor="midia-url" className="block text-sm font-medium text-slate-700 mb-2">
                  URL da Mídia *
                </label>
                <Input
                  id="midia-url"
                  type="url"
                  value={form.midia_url}
                  onChange={(e) => setForm({ ...form, midia_url: e.target.value })}
                  placeholder={
                    form.tipo_midia === 'video'
                      ? 'https://www.youtube.com/watch?v=...'
                      : form.tipo_midia === 'lottie'
                      ? 'https://example.com/animation.json'
                      : 'https://example.com/content'
                  }
                  disabled={saving}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {form.tipo_midia === 'video' && 'YouTube, Vimeo ou URL direta do vídeo'}
                  {form.tipo_midia === 'lottie' && 'URL do arquivo JSON da animação Lottie'}
                  {form.tipo_midia === 'phaser' && 'URL onde o jogo Phaser está hospedado'}
                  {form.tipo_midia === 'h5p' && 'URL do conteúdo H5P embarcável'}
                </p>
              </div>
            )}

            {/* Preview */}
            {form.tipo_midia && form.midia_url && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preview
                </label>
                {getEmbedPreview()}
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving || !form.tipo_midia || !form.midia_url}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Mídia'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


