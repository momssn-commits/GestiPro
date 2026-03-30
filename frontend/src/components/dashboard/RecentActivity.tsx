'use client'

import { FileText, CheckCircle, XCircle, Upload, BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const activities = [
  { id: 1, type: 'upload',   label: 'Facture_Q3_2024.pdf déposée',          time: new Date(Date.now() - 30 * 60000),  icon: Upload,      color: 'text-brand' },
  { id: 2, type: 'approved', label: 'Attestation de travail approuvée',      time: new Date(Date.now() - 2 * 3600000), icon: CheckCircle, color: 'text-accent-green' },
  { id: 3, type: 'rejected', label: 'Devis_Fournisseur.pdf refusé',          time: new Date(Date.now() - 5 * 3600000), icon: XCircle,     color: 'text-accent-red' },
  { id: 4, type: 'document', label: 'APD_Phase2.pdf passé en vérification',  time: new Date(Date.now() - 8 * 3600000), icon: FileText,    color: 'text-accent-yellow' },
  { id: 5, type: 'training', label: 'Module "Excel avancé" complété',        time: new Date(Date.now() - 24 * 3600000), icon: BookOpen,   color: 'text-accent-purple' },
]

export function RecentActivity() {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Activité récente</h3>
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
    </div>
  )
}
