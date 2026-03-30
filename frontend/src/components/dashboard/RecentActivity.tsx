'use client'

import { FileText, CheckCircle, XCircle, Upload, Clock, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useDocuments } from '@/hooks/useDocuments'
import { useAttestations } from '@/hooks/useRh'

interface ActivityItem {
  id: string
  label: string
  time: Date
  icon: React.ComponentType<{ className?: string }>
  color: string
}

type DocItem = { id: string; name?: string; originalName?: string; status?: string; createdAt?: string }
type AttItem = { id: string; type?: string; status?: string; createdAt?: string }

function buildActivities(docs: DocItem[], atts: AttItem[]): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const d of docs.slice(0, 4)) {
    const label    = d.name ?? d.originalName ?? 'Document'
    const time     = d.createdAt ? new Date(d.createdAt) : new Date()
    const approved = d.status === 'approved'
    const rejected = d.status === 'rejected'
    items.push({
      id:    `doc-${d.id}`,
      label: approved ? `${label} approuvé` : rejected ? `${label} refusé` : `${label} déposé`,
      time,
      icon:  approved ? CheckCircle : rejected ? XCircle : Upload,
      color: approved ? 'text-accent-green' : rejected ? 'text-accent-red' : 'text-brand',
    })
  }

  for (const a of atts.slice(0, 2)) {
    const label    = a.type ?? 'Attestation'
    const time     = a.createdAt ? new Date(a.createdAt) : new Date()
    const approved = a.status === 'approved'
    const rejected = a.status === 'rejected'
    items.push({
      id:    `att-${a.id}`,
      label: approved ? `${label} approuvée` : rejected ? `${label} refusée` : `${label} soumise`,
      time,
      icon:  approved ? CheckCircle : rejected ? XCircle : Clock,
      color: approved ? 'text-accent-green' : rejected ? 'text-accent-red' : 'text-accent-yellow',
    })
  }

  return items.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5)
}

export function RecentActivity() {
  const { data: docData, isLoading: docLoading } = useDocuments({ limit: 4 })
  const { data: attData, isLoading: attLoading } = useAttestations(1, 2)

  const isLoading = docLoading || attLoading

  const rawDocs = docData
    ? ((docData as { data?: unknown[] }).data ?? (Array.isArray(docData) ? docData : []))
    : []

  const rawAtts = attData
    ? ((attData as { data?: unknown[] }).data ?? (Array.isArray(attData) ? attData : []))
    : []

  const activities = buildActivities(rawDocs as DocItem[], rawAtts as AttItem[])

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité récente</h3>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune activité récente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className={clsx('mt-0.5 flex-shrink-0', a.color)}>
                <a.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-600 truncate">{a.label}</p>
                <p className="text-xs text-slate-500">
                  {formatDistanceToNow(a.time, { addSuffix: true, locale: fr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
