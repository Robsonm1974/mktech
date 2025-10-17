'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createTenantSchema } from '@/lib/admin/validations'

export default function NovoTenantPage() {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    email_admin: '',
    phone: '',
    plan_type: 'starter',
    seats_total: 30
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    // Validar com Zod
    const validation = createTenantSchema.safeParse(form)
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message
        }
      })
      setErrors(fieldErrors)
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.from('tenants').insert({
        name: form.name,
        slug: form.slug,
        email_admin: form.email_admin,
        phone: form.phone || null,
        plan_type: form.plan_type,
        seats_total: form.seats_total,
        seats_used: 0,
        status: 'active'
      })

      if (error) {
        if (error.code === '23505') {
          setErrors({ slug: 'Slug já está em uso' })
        } else {
          setErrors({ submit: error.message })
        }
        setLoading(false)
        return
      }

      router.push('/admin/tenants')
      router.refresh()
    } catch {
      setErrors({ submit: 'Erro ao criar tenant' })
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setForm({ ...form, name })
    if (!form.slug) {
      setForm(prev => ({ ...prev, name, slug: generateSlug(name) }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/admin/tenants" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Nova Escola</h1>
        <p className="text-slate-600 mt-1">Cadastre uma nova escola (tenant) na plataforma</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Nome da Escola *
              </label>
              <Input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                disabled={loading}
                placeholder="Ex: Colégio São Paulo"
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
                Slug *
              </label>
              <Input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
                disabled={loading}
                placeholder="colegio-sao-paulo"
              />
              <p className="text-xs text-slate-500 mt-1">URL amigável (apenas letras minúsculas, números e hífens)</p>
              {errors.slug && <p className="text-sm text-red-600 mt-1">{errors.slug}</p>}
            </div>

            <div>
              <label htmlFor="plan_type" className="block text-sm font-medium text-slate-700 mb-1">
                Plano *
              </label>
              <select
                id="plan_type"
                value={form.plan_type}
                onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label htmlFor="email_admin" className="block text-sm font-medium text-slate-700 mb-1">
                Email do Admin *
              </label>
              <Input
                id="email_admin"
                type="email"
                value={form.email_admin}
                onChange={(e) => setForm({ ...form, email_admin: e.target.value })}
                required
                disabled={loading}
                placeholder="admin@escola.com"
              />
              {errors.email_admin && <p className="text-sm text-red-600 mt-1">{errors.email_admin}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Telefone
              </label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={loading}
                placeholder="(11) 98765-4321"
              />
            </div>

            <div>
              <label htmlFor="seats_total" className="block text-sm font-medium text-slate-700 mb-1">
                Total de Seats (Alunos) *
              </label>
              <Input
                id="seats_total"
                type="number"
                min="1"
                value={form.seats_total}
                onChange={(e) => setForm({ ...form, seats_total: parseInt(e.target.value) })}
                required
                disabled={loading}
              />
              {errors.seats_total && <p className="text-sm text-red-600 mt-1">{errors.seats_total}</p>}
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Escola'
              )}
            </Button>
            <Link href="/admin/tenants">
              <Button type="button" variant="outline" disabled={loading}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}

