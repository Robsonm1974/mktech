'use client'

import { Tenant } from '@/types/admin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface TenantsListProps {
  tenants: Tenant[]
}

export default function TenantsList({ tenants }: TenantsListProps) {
  if (tenants.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-slate-500">Nenhuma escola cadastrada ainda.</p>
        <Link href="/admin/tenants/novo" className="text-blue-600 hover:underline mt-2 inline-block">
          Cadastrar primeira escola
        </Link>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      active: { variant: 'default', label: 'Ativo' },
      trial: { variant: 'secondary', label: 'Trial' },
      suspended: { variant: 'destructive', label: 'Suspenso' },
      cancelled: { variant: 'outline', label: 'Cancelado' }
    }
    
    const config = variants[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      {tenants.map((tenant) => (
        <Card key={tenant.id} className="p-6 hover:shadow-lg transition">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-slate-900">{tenant.name}</h3>
                {getStatusBadge(tenant.status)}
              </div>
              
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Slug:</span>
                  <p className="font-mono text-slate-700">{tenant.slug}</p>
                </div>
                <div>
                  <span className="text-slate-500">Plano:</span>
                  <p className="font-medium text-slate-700">{tenant.plan_type}</p>
                </div>
                <div>
                  <span className="text-slate-500">Seats:</span>
                  <p className="font-medium text-slate-700">
                    {tenant.seats_used} / {tenant.seats_total}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="text-slate-700">{tenant.email_admin || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Link href={`/admin/tenants/${tenant.id}/editar`}>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

