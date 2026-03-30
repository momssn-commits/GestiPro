'use client'

import { clsx } from 'clsx'
import { CheckCircle, Clock, Upload, Archive, Loader2, FileText } from 'lucide-react'
import { useDocuments } from '@/hooks/useDocuments'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const STEPS = [
  { key: 'depot',        label: 'Dépôt',       icon: Upload,      color: 'text-brand',           bg: 'bg-brand/8' },
  { key: 'verification', label: 'Vérification', icon: Clock,       color: 'text-accent-yellow',   bg: 'bg-accent-yellow/10' },
  { key: 'approbation',  label: 'Approbation',  icon: CheckCircle, color: 'text-accent-green',    bg: 'bg-accent-green/10' },
  { key: 'archivage',    label: 'Archivage',    icon: Archive,     color: 'text-accent-purple',   bg: 'bg-accent-purple/10' },
]

type Doc = {
  id: string; name?: string; originalName?: string
  workflowStep?: string; workflow_step?: string
  category?: string; updatedAt?: string; updated_at?: string
}

export function WorkflowBoard() {
  const { data, isLoading, isError } = useDocuments({ limit: 50 })

  const allDocs: Doc[] = (!isError && data)
    ? ((data as { data?: Doc[] }).data ?? (Array.isArray(data) ? data as Doc[] : []))
    : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card text-center py-10">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Impossible de charger les documents</p>
        <p className="text-xs text-slate-500 mt-1">Vérifiez votre connexion au serveur.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STEPS.map((step, stepIndex) => {
        const docs = allDocs.filter(d => (d.workflowStep ?? d.workflow_step) === step.key)
        return (
          <div key={step.key} className="card space-y-3">
            {/* Step header */}
            <div className="flex items-center gap-2">
              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', step.bg)}>
                <step.icon className={clsx('w-3.5 h-3.5', step.color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="text-xs text-slate-500">Étape {stepIndex + 1}/4</p>
              </div>
              <span className={clsx('ml-auto badge', step.bg, step.color)}>
                {docs.length}
              </span>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              {docs.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">Aucun document</p>
              )}
              {docs.map(doc => {
                const name = doc.name ?? doc.originalName ?? 'Document'
                const updated = doc.updatedAt ?? doc.updated_at
                const timeLabel = updated
                  ? formatDistanceToNow(new Date(updated), { addSuffix: true, locale: fr })
                  : '—'
                return (
                  <div key={doc.id} className="bg-surface-200 rounded-lg p-3 hover:bg-surface-300 transition-all cursor-pointer">
                    <p className="text-xs font-medium text-slate-600 truncate">{name}</p>
                    <div className="flex items-center justify-between mt-1">
                      {doc.category && <span className="badge-blue capitalize">{doc.category}</span>}
                      <span className="text-xs text-slate-600">{timeLabel}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
