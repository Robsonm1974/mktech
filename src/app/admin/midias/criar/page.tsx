import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CriarMidiaPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/admin/blocos" className="text-blue-600 hover:underline flex items-center gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Criar Mídia</h1>
        <p className="text-slate-600 mt-1">Em desenvolvimento</p>
      </div>

      <Card className="p-12 text-center">
        <p className="text-slate-500">Wizard de criação de mídias (vídeo, lottie, phaser, h5p)</p>
        <p className="text-sm text-slate-400 mt-2">Funcionalidade será implementada em breve</p>
      </Card>
    </div>
  )
}











