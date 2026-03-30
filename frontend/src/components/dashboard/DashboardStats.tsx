'use client'

import { FileText, CheckCircle, Clock, GraduationCap } from 'lucide-react'
import { clsx } from 'clsx'
import { useDocumentStats } from '@/hooks/useDocuments'
import { useAttestations } from '@/hooks/useRh'
import { useMyFormations } from '@/hooks/useFormation'

export function DashboardStats() {
  const { data: docStats }  = useDocumentStats()
  const { data: attData }   = useAttestations(1, 100)
  const { data: formations } = useMyFormations()

  // Calcule les totaux depuis les données API si disponibles
  const docTotal  = docStats
    ? ((docStats as { byStep?: { count: string }[] }).byStep ?? []).reduce((s, r) => s + Number(r.count), 0)
    : 12

  const attTotal  = attData
    ? Number((attData as { total?: number }).total ?? 8)
    : 8

  const formCount = formations
    ? (Array.isArray(formations) ? formations.length : ((formations as {data?: unknown[]}).data ?? []).length)
    : 3

  const stats = [
    {
      label: 'Documents en cours',
      value: String(docTotal),
      delta: 'Total documents',
      icon: FileText,
      color: 'text-brand',
      bg: 'bg-brand/8',
    },
    {
      label: 'Validations en attente',
      value: '—',
      delta: 'Voir la liste',
      icon: Clock,
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10',
    },
    {
      label: 'Mes attestations',
      value: String(attTotal),
      delta: 'Total soumises',
      icon: CheckCircle,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Formations inscrites',
      value: String(formCount),
      delta: formCount > 0 ? `${formCount} en cours` : 'Aucune',
      icon: GraduationCap,
      color: 'text-accent-purple',
      bg: 'bg-accent-purple/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="card flex items-center gap-4">
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
            <stat.icon className={clsx('w-5 h-5', stat.color)} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.delta}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
