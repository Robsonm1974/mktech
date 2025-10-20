'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Disciplina {
  nome: string
  codigo: string
  cor_hex: string
  icone: string
  blocos: unknown[]
}

interface TurmaCardProps {
  turma: string
  disciplinas: Record<string, Disciplina>
}

export default function TurmaCard({ turma, disciplinas }: TurmaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null)

  const totalBlocos = Object.values(disciplinas).reduce(
    (acc, disc) => acc + disc.blocos.length,
    0
  )

  return (
    <Card className="border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
      <div className="p-6">
        {/* Header da Turma */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="p-0 h-8 w-8"
            >
              {expanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
            <div>
              <h3 className="text-xl font-bold text-slate-900">📚 {turma}</h3>
              <p className="text-sm text-slate-600">
                {Object.keys(disciplinas).length} disciplina(s) • {totalBlocos} blocos
              </p>
            </div>
          </div>

          <Link href={`/admin/blocos/importar?turma=${turma}`}>
            <Button size="sm" variant="default">
              <Upload className="h-4 w-4 mr-2" />
              Importar Planejamento
            </Button>
          </Link>
        </div>

        {/* Lista de Disciplinas (quando expandido) */}
        {expanded && (
          <div className="mt-4 space-y-2 pl-11">
            {Object.entries(disciplinas).map(([key, disciplina]) => (
              <div key={key}>
                <button
                  onClick={() =>
                    setSelectedDisciplina(
                      selectedDisciplina === key ? null : key
                    )
                  }
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{disciplina.icone || '📘'}</span>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-900">
                        {disciplina.nome}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {disciplina.codigo} • {disciplina.blocos.length} blocos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: disciplina.cor_hex,
                        color: disciplina.cor_hex,
                      }}
                    >
                      {disciplina.blocos.length}
                    </Badge>
                    {selectedDisciplina === key ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Lista de Blocos (quando disciplina selecionada) */}
                {selectedDisciplina === key && (
                  <div className="mt-2 ml-12 text-sm text-slate-600">
                    <p className="italic">
                      Clique em &quot;Ver Blocos&quot; no menu para visualizar a lista
                      completa
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

