'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
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
  disciplina_id: string
  planejamento_id: string
}

export default function EditarBlocoPage() {
  const params = useParams()
  const router = useRouter()
  const blocoId = params.id as string
  const supabase = createSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
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
    loadBloco()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocoId])

  const loadBloco = async () => {
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
      toast.error('Erro ao carregar bloco')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!bloco) return

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
      router.push('/admin/blocos')
      router.refresh()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar bloco')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!bloco) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="p-6 text-center">
          <p className="text-slate-600">Bloco não encontrado</p>
          <Link href="/admin/blocos">
            <Button className="mt-4">Voltar</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/admin/blocos" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para blocos
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Editar Bloco</h1>
        <p className="text-slate-600 mt-1">
          {bloco.codigo_bloco}
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-slate-700 mb-1">
              Título do Bloco *
            </label>
            <Input
              id="titulo"
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: O Despertar do Pensamento!"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="conteudo_texto" className="block text-sm font-medium text-slate-700 mb-1">
              Conteúdo
            </label>
            <textarea
              id="conteudo_texto"
              rows={15}
              value={form.conteudo_texto}
              onChange={(e) => setForm({ ...form, conteudo_texto: e.target.value })}
              placeholder="Cole ou edite o conteúdo do bloco..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
            <p className="text-xs text-slate-500 mt-1">
              Este é o texto principal que será exibido no bloco
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="pontos_bloco" className="block text-sm font-medium text-slate-700 mb-1">
                Pontos do Bloco
              </label>
              <Input
                id="pontos_bloco"
                type="number"
                min="0"
                value={form.pontos_bloco}
                onChange={(e) => setForm({ ...form, pontos_bloco: parseInt(e.target.value) || 0 })}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="tipo_midia" className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Mídia
              </label>
              <select
                id="tipo_midia"
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
              <label htmlFor="midia_url" className="block text-sm font-medium text-slate-700 mb-1">
                URL da Mídia
              </label>
              <Input
                id="midia_url"
                type="url"
                value={form.midia_url}
                onChange={(e) => setForm({ ...form, midia_url: e.target.value })}
                placeholder="https://..."
                disabled={saving}
              />
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
            <Link href="/admin/blocos">
              <Button variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
