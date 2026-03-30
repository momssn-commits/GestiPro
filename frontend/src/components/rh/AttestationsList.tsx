'use client'

import { Download, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useAttestations } from '@/hooks/useRh'

const typeLabels: Record<string, string> = {
  travail: 'Attestation de travail',
  salaire: 'Attestation de salaire',
  conge:   'Attestation de congé',
  autre:   'Autre attestation',
}

const statusConfig = {
  pending:  { label: 'En attente', class: 'badge-yellow', icon: Clock },
  approved: { label: 'Approuvée',  class: 'badge-green',  icon: CheckCircle },
  rejected: { label: 'Refusée',    class: 'badge-red',    icon: XCircle },
  signed:   { label: 'Signée',     class: 'badge-green',  icon: CheckCircle },
}

const MOCK = [
  { id: '1', type: 'travail', requestedAt: '28/07/2024', status: 'approved', signedFileUrl: '#' },
  { id: '2', type: 'salaire', requestedAt: '15/07/2024', status: 'pending',  signedFileUrl: null },
  { id: '3', type: 'travail', requestedAt: '01/06/2024', status: 'approved', signedFileUrl: '#' },
  { id: '4', type: 'conge',   requestedAt: '10/05/2024', status: 'rejected', signedFileUrl: null },
]

export function AttestationsList() {
  const { data, isLoading, isError } = useAttestations()
  const items = isError || !data ? MOCK : (data as { data: typeof MOCK }).data ?? MOCK

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Mes attestations</h3>
        {isLoading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
        {isError && <span className="text-xs text-amber-400">Mode local</span>}
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-slate-500 text-sm">Aucune attestation pour le moment.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              {['Type', 'Demandée le', 'Statut', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {items.map((att: Record<string, string | null>) => {
              const s = statusConfig[(att.status as keyof typeof statusConfig)] ?? statusConfig.pending
              const label = typeLabels[att.type as string] ?? (att.type as string)
              const date  = att.requestedAt
                ? (att.requestedAt.includes('/') ? att.requestedAt : new Date(att.requestedAt as string).toLocaleDateString('fr-FR'))
                : '—'
              return (
                <tr key={att.id as string} className="hover:bg-surface-200/50 transition-colors">
                  <td className="px-5 py-3 text-slate-900 font-medium">{label}</td>
                  <td className="px-5 py-3 text-slate-500">{date}</td>
                  <td className="px-5 py-3">
                    <span className={s.class}>{s.label}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {att.signedFileUrl && att.signedFileUrl !== 'null' && (
                      <a href={att.signedFileUrl as string} target="_blank" rel="noreferrer" className="btn-secondary py-1 text-xs">
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
