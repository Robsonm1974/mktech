'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client-browser'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import TenantsList from '@/components/admin/tenants/TenantsList'
import type { Tenant } from '@/types/admin'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setTenants(data as Tenant[])
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Escolas (Tenants)</h1>
          <p className="text-slate-600 mt-1">Gerencie as escolas cadastradas na plataforma</p>
        </div>
        <Link href="/admin/tenants/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Escola
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <TenantsList tenants={tenants} />
      )}
    </div>
  )
}

