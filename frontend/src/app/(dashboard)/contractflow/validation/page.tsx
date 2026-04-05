'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle, MessageSquare, Clock,
  ChevronDown, ChevronUp, AlertTriangle, User,
  FileSignature, Calendar, DollarSign, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from '@/components/contractflow/shared'
import type { Acte } from '@/lib/types'
import { useActes, useActeHistory, useTransitionActe } from '@/hooks/useContractflow'

const QUEUE_STATUSES = ['en_instruction', 'en_validation']

function HistoryPanel({ acteId }: { acteId: string }) {
  const { data: history = [], isLoading } = useActeHistory(acteId)
  if (isLoading) return <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 mx-auto" />
  if (history.length === 0) return <p className="text-xs text-slate-400 italic">Aucun historique</p>
  return (
    <div className="space-y-1.5">
      {history.map(h => (
        <div key={h.id} className="flex gap-2 text-xs">
          <div className={clsx(
            'w-2 h-2 rounded-full mt-1 flex-shrink-0',
            h.action === 'approve'    ? 'bg-green-400' :
            h.action === 'reject'     ? 'bg-red-400'   :
            h.action === 'complement' ? 'bg-amber-400' : 'bg-slate-300'
          )} />
          <div>
            <span className="font-medium text-slate-700">{h.firstName} {h.lastName}</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="text-slate-400">
              {new Date(h.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
            </span>
            {h.comment && <p className="text-slate-500">{h.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ValidationPage() {
  const [selected, setSelected] = useState<Acte | null>(null)
  const [comment, setComment] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data, isLoading } = useActes({ limit: 100 })
  const actes: Acte[] = data?.data ?? []
  const { mutate: doTransition, isPending: transitioning } = useTransitionActe()

  const queue = actes.filter(a => QUEUE_STATUSES.includes(a.statut))

  const handleAction = (action: 'approve' | 'reject' | 'complement') => {
    if (!selected) return
    doTransition(
      { id: selected.id, payload: { action, comment: comment || undefined } },
      { onSuccess: () => { setComment(''); setSelected(null) } }
    )
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Circuit de validation</h1>
        <p className="text-slate-500 text-sm mt-1">M2 — Instruction et validation des actes contractuels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'En instruction', count: actes.filter(a => a.statut === 'en_instruction').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'En validation',  count: actes.filter(a => a.statut === 'en_validation').length,  color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Signés',         count: actes.filter(a => a.statut === 'signe').length,          color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Rejetés',        count: actes.filter(a => a.statut === 'rejete').length,         color: 'text-red-600',   bg: 'bg-red-50'   },
        ] as const).map(s => (
          <div key={s.label} className={clsx('rounded-xl p-4 text-center', s.bg)}>
            <p className={clsx('text-2xl font-bold', s.color)}>{s.count}</p>
            <p className={clsx('text-xs font-medium mt-0.5', s.color)}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">File d'attente ({queue.length})</h2>
          {queue.length === 0 && (
            <div className="card text-center py-10 text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Aucun acte en attente de traitement
            </div>
          )}
          {queue.map(acte => (
            <div
              key={acte.id}
              onClick={() => setSelected(acte)}
              className={clsx(
                'card cursor-pointer transition-all hover:shadow-md',
                selected?.id === acte.id && 'ring-2 ring-brand',
                acte.alerte && 'border-amber-200'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-400">{acte.numero}</span>
                    {acte.alerte && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                    <span className={clsx('px-1.5 py-0.5 rounded-full text-xs ml-auto', STATUS_COLOR[acte.statut])}>
                      {STATUS_LABEL[acte.statut]}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{acte.titre}</p>
                  <p className="text-xs text-slate-500 mt-1">{TYPE_LABEL[acte.type]}</p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setExpandedId(v => v === acte.id ? null : acte.id) }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-2 transition-colors"
              >
                <Clock className="w-3 h-3" /> Historique
                {expandedId === acte.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {expandedId === acte.id && (
                <div className="mt-2 border-t border-surface-100 pt-2">
                  <HistoryPanel acteId={acte.id} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div>
          {!selected ? (
            <div className="card text-center py-16 text-slate-400">
              <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Sélectionnez un acte pour l'instruire</p>
            </div>
          ) : (
            <div className="card space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-400">{selected.numero}</p>
                  <h3 className="font-bold text-slate-900 mt-0.5">{selected.titre}</h3>
                </div>
                <span className={clsx('px-2 py-0.5 rounded-full text-xs flex-shrink-0', STATUS_COLOR[selected.statut])}>
                  {STATUS_LABEL[selected.statut]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-slate-400 flex items-center gap-1 mb-1"><User className="w-3 h-3" /> Initiateur</p>
                  <p className="font-medium text-slate-700">
                    {selected.initiateurFirstName} {selected.initiateurLastName}
                  </p>
                </div>
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-slate-400 flex items-center gap-1 mb-1"><FileSignature className="w-3 h-3" /> Type</p>
                  <p className="font-medium text-slate-700">{TYPE_LABEL[selected.type]?.split(' ')[0]}</p>
                </div>
                {selected.dateFin && (
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-slate-400 flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" /> Fin</p>
                    <p className="font-medium text-slate-700">
                      {new Date(selected.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
                {selected.montant && selected.montant > 0 && (
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-slate-400 flex items-center gap-1 mb-1"><DollarSign className="w-3 h-3" /> Montant</p>
                    <p className="font-medium text-slate-700">{selected.montant.toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Objet</p>
                <p className="text-sm text-slate-700 bg-surface rounded-lg p-3">{selected.objet}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> Commentaire de décision
                </label>
                <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Ajoutez une note d'instruction, une demande de complément…"
                  className="input resize-none text-sm" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={transitioning}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {transitioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {selected.statut === 'en_instruction' ? 'Instruire' : 'Valider'}
                </button>
                <button
                  onClick={() => handleAction('complement')}
                  disabled={transitioning}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Complément
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={transitioning}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Rejeter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
