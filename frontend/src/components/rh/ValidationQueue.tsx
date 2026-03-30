'use client'

import { CheckCircle, XCircle, Clock, ChevronRight, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useValidations, useApproveValidation, useRejectValidation } from '@/hooks/useRh'

export function ValidationQueue() {
  const { data, isLoading, isError } = useValidations()
  const approve = useApproveValidation()
  const reject  = useRejectValidation()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason]     = useState('')

  const items: Record<string, unknown>[] = (!isError && data)
    ? (((data as unknown) as { data?: Record<string, unknown>[] }).data ?? [])
    : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-10">
        <CheckCircle className="w-10 h-10 text-accent-green mx-auto mb-3" />
        <p className="text-slate-900 font-medium">Aucune validation en attente</p>
        <p className="text-slate-500 text-sm mt-1">Toutes les demandes ont été traitées.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isError && (
        <div className="card border-amber-200 bg-amber-50 text-center py-8">
          <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-700">Backend hors ligne</p>
          <p className="text-xs text-amber-500 mt-1">Impossible de récupérer les validations.</p>
        </div>
      )}

      {/* Modal refus */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card w-full max-w-sm mx-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Motif de refus</h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="input w-full h-24 resize-none mb-4"
              placeholder="Précisez le motif..."
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectId(null); setReason('') }} className="btn-secondary flex-1 justify-center">
                Annuler
              </button>
              <button
                disabled={reason.length < 5 || reject.isPending}
                onClick={() => {
                  reject.mutate({ id: rejectId, reason }, { onSuccess: () => { setRejectId(null); setReason('') } })
                }}
                className="btn-danger flex-1 justify-center"
              >
                {reject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {items.map((v: Record<string, unknown>) => {
        const step  = (v.currentStep  as number) ?? (v.current_step  as number) ?? 0
        const total = (v.totalSteps   as number) ?? (v.total_steps   as number) ?? 1
        const from  = `${v.firstName as string ?? ''} ${v.lastName as string ?? ''}`.trim() || 'Inconnu'
        const date  = (v.requestedAt as string) ?? (v.requested_at as string) ?? '—'
        const fmtDate = date.includes('/') ? date : new Date(date).toLocaleDateString('fr-FR')

        return (
          <div key={v.id as string} className="card hover:border-slate-200 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-yellow"><Clock className="w-3 h-3 inline mr-1" />En attente</span>
                  <span className="text-xs text-slate-500">{fmtDate}</span>
                </div>
                <h4 className="text-sm font-semibold text-slate-900">{v.type as string}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Demandé par <span className="text-slate-600">{from}</span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: total }).map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full flex-1 ${i < step ? 'bg-brand' : 'bg-surface-300'}`} />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">Étape {step}/{total}</p>
            </div>

            {!isError && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => approve.mutate({ id: v.id as string })}
                  disabled={approve.isPending}
                  className="btn-primary flex-1 justify-center py-1.5 text-xs"
                >
                  {approve.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approuver
                </button>
                <button
                  onClick={() => setRejectId(v.id as string)}
                  className="btn-danger flex-1 justify-center py-1.5 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Refuser
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
