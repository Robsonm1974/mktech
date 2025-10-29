'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, BookOpen, FileText, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    tenantsCount: 0,
    alunosCount: 0,
    aulasCount: 0,
    blocosCount: 0,
    sessionsCount: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadStats = async () => {
    const [
      { count: tenantsCount },
      { count: alunosCount },
      { count: aulasCount },
      { count: blocosCount },
      { count: sessionsCount }
    ] = await Promise.all([
      supabase.from('tenants').select('*', { count: 'exact', head: true }),
      supabase.from('alunos').select('*', { count: 'exact', head: true }),
      supabase.from('aulas').select('*', { count: 'exact', head: true }).eq('publicada', true),
      supabase.from('blocos_templates').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ])

    setStats({
      tenantsCount: tenantsCount || 0,
      alunosCount: alunosCount || 0,
      aulasCount: aulasCount || 0,
      blocosCount: blocosCount || 0,
      sessionsCount: sessionsCount || 0
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
        <p className="text-slate-600 mt-1">Visão geral da plataforma MKTECH</p>
      </div>
      
      {/* Cards responsivos */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tenants Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.tenantsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Escolas cadastradas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Alunos</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.alunosCount}</div>
            <p className="text-xs text-slate-500 mt-1">Alunos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Aulas Publicadas</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.aulasCount}</div>
            <p className="text-xs text-slate-500 mt-1">Aulas disponíveis</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Blocos Criados</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.blocosCount}</div>
            <p className="text-xs text-slate-500 mt-1">Blocos templates</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Sessões Ativas</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.sessionsCount}</div>
            <p className="text-xs text-slate-500 mt-1">Aulas em andamento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/admin/blocos/importar" className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
              <div className="font-medium text-blue-900">Importar Planejamento</div>
              <div className="text-sm text-blue-700">Criar novos blocos a partir de documento</div>
            </a>
            <a href="/admin/tenants/novo" className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition">
              <div className="font-medium text-green-900">Nova Escola</div>
              <div className="text-sm text-green-700">Cadastrar novo tenant</div>
            </a>
            <Link href="/admin/aulas" className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
              <div className="font-medium text-purple-900">Gerenciar Aulas</div>
              <div className="text-sm text-purple-700">Criar e editar aulas</div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Nenhuma atividade recente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

