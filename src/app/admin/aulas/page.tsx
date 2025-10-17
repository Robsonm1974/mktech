import { Card } from '@/components/ui/card'

export default function AulasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Aulas</h1>
        <p className="text-slate-600 mt-1">Gerencie aulas e grade semanal</p>
      </div>

      <Card className="p-12 text-center">
        <p className="text-slate-500">Grade semanal e CRUD de aulas</p>
        <p className="text-sm text-slate-400 mt-2">Funcionalidade será implementada em breve</p>
      </Card>
    </div>
  )
}


