'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NovaDisciplinaPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    cor_hex: '#3B82F6',
    icone: '📚',
    ativa: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.codigo || !form.nome) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('disciplinas')
        .insert({
          codigo: form.codigo.toUpperCase(),
          nome: form.nome,
          descricao: form.descricao || null,
          cor_hex: form.cor_hex,
          icone: form.icone,
          ativa: form.ativa
        })

      if (error) throw error

      toast.success('Disciplina criada com sucesso!')
      router.push('/admin/disciplinas')
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar disciplina:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar disciplina')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/admin/disciplinas" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para disciplinas
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Nova Disciplina</h1>
        <p className="text-slate-600 mt-1">Crie uma nova disciplina no sistema</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-slate-700 mb-1">
                Código * <span className="text-xs text-slate-500">(ex: ALG, MAT)</span>
              </label>
              <Input
                id="codigo"
                type="text"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                placeholder="ALG"
                maxLength={10}
                required
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1">
                Nome *
              </label>
              <Input
                id="nome"
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Algoritmos"
                required
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descrição da disciplina..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="icone" className="block text-sm font-medium text-slate-700 mb-1">
                Ícone (Emoji)
              </label>
              <Input
                id="icone"
                type="text"
                value={form.icone}
                onChange={(e) => setForm({ ...form, icone: e.target.value })}
                placeholder="📚"
                maxLength={5}
                disabled={saving}
              />
              <p className="text-xs text-slate-500 mt-1">
                Cole um emoji: 🧮 💻 🇬🇧 ➕ 🧠
              </p>
            </div>

            <div>
              <label htmlFor="cor_hex" className="block text-sm font-medium text-slate-700 mb-1">
                Cor (HEX)
              </label>
              <div className="flex gap-2">
                <Input
                  id="cor_hex"
                  type="text"
                  value={form.cor_hex}
                  onChange={(e) => setForm({ ...form, cor_hex: e.target.value })}
                  placeholder="#3B82F6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  disabled={saving}
                />
                <input
                  type="color"
                  value={form.cor_hex}
                  onChange={(e) => setForm({ ...form, cor_hex: e.target.value })}
                  className="w-12 h-10 rounded border border-slate-300 cursor-pointer"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ativa"
              type="checkbox"
              checked={form.ativa}
              onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300"
              disabled={saving}
            />
            <label htmlFor="ativa" className="text-sm text-slate-700">
              Disciplina ativa (visível no sistema)
            </label>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Disciplina
                </>
              )}
            </Button>
            <Link href="/admin/disciplinas">
              <Button type="button" variant="outline" disabled={saving}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

