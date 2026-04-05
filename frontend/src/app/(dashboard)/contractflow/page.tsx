'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileSignature, Clock, CheckCircle2, Archive, AlertTriangle,
  Plus, TrendingUp, Users, Calendar, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from '@/components/contractflow/shared'
import type { Acte } from '@/lib/types'
import { useActes } from '@/hooks/useContractflow'

// ── Colonnes Kanban ───────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'brouillon',      label: 'Brouillon',       icon: FileSignature, color: 'text-slate-500'  },
  { key: 'en_instruction', label: 'En instruction',  icon: Clock,         color: 'text-amber-500'  },
  { key: 'en_validation',  label: 'En validation',   icon: TrendingUp,    color: 'text-blue-500'   },
  { key: 'signe',          label: 'Signés',          icon: CheckCircle2,  color: 'text-green-500'  },
  { key: 'archive',        label: 'Archivés',        icon: Archive,       color: 'text-purple-500' },
] as const

export default function ContractFlowDashboard() {
  const [view, setView] = useState<'kanban' | 'liste'>('kanban')
  const { data, isLoading, isError } = useActes({ limit: 100 })
  const actes: Acte[] = data?.data ?? []
  const alertes = actes.filter(a => a.alerte)

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand animate-spin" />
    </div>
  )

  if (isError) return (
    <div className="card text-center py-12 text-slate-400">
      <p className="text-sm">Erreur de chargement des actes</p>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ContractFlow</h1>
          <p className="text-slate-500 text-sm mt-1">Tableau de bord — suivi des actes contractuels</p>
        </div>
        <Link href="/contractflow/depot" className="btn-primary">
          <Plus className="w-4 h-4" />
          Déposer un acte
        </Link>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {alertes.length} acte{alertes.length > 1 ? 's' : ''} en retard ou à risque
            </p>
            <div className="mt-1 space-y-0.5">
              {alertes.map(a => (
                <p key={a.id} className="text-xs text-amber-700">
                  {a.numero} — {a.titre}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {COLUMNS.map(col => {
          const count = actes.filter(a => a.statut === col.key).length
          const Icon = col.icon
          return (
            <div key={col.key} className="card text-center">
              <Icon className={clsx('w-5 h-5 mx-auto mb-1', col.color)} />
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-500">{col.label}</p>
            </div>
          )
        })}
      </div>

      {/* Vue toggle */}
      <div className="flex items-center gap-2">
        {(['kanban', 'liste'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx('text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize',
              view === v ? 'bg-brand text-white' : 'bg-surface-200 text-slate-600 hover:bg-surface-300')}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {COLUMNS.map(col => {
            const colActes = actes.filter(a => a.statut === col.key)
            const Icon = col.icon
            return (
              <div key={col.key} className="bg-surface rounded-xl p-3 min-h-[200px]">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={clsx('w-4 h-4', col.color)} />
                  <p className="text-xs font-semibold text-slate-700">{col.label}</p>
                  <span className="ml-auto text-xs bg-surface-300 text-slate-500 rounded-full px-1.5">
                    {colActes.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colActes.map(acte => <ActeCard key={acte.id} acte={acte} />)}
                  {colActes.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Aucun acte</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste */}
      {view === 'liste' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200 text-left text-slate-500">
                <th className="pb-2 font-medium pr-4">Référence</th>
                <th className="pb-2 font-medium pr-4">Titre</th>
                <th className="pb-2 font-medium pr-4 hidden sm:table-cell">Type</th>
                <th className="pb-2 font-medium pr-4 hidden md:table-cell">Partie B</th>
                <th className="pb-2 font-medium pr-4 hidden lg:table-cell">Service</th>
                <th className="pb-2 font-medium pr-4">Statut</th>
                <th className="pb-2 font-medium hidden sm:table-cell">Mis à jour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {actes.map(a => (
                <tr key={a.id} className="hover:bg-surface-50 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="font-mono text-slate-600">{a.numero}</span>
                    {a.alerte && <AlertTriangle className="w-3 h-3 text-amber-500 inline ml-1" />}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-slate-800 max-w-[180px] truncate">{a.titre}</td>
                  <td className="py-2.5 pr-4 hidden sm:table-cell text-slate-500">
                    {TYPE_LABEL[a.type]?.split(' ')[0]}
                  </td>
                  <td className="py-2.5 pr-4 hidden md:table-cell text-slate-600 max-w-[120px] truncate">{a.partieB}</td>
                  <td className="py-2.5 pr-4 hidden lg:table-cell text-slate-500">{a.service ?? '—'}</td>
                  <td className="py-2.5 pr-4">
                    <span className={clsx('px-1.5 py-0.5 rounded-full text-xs', STATUS_COLOR[a.statut])}>
                      {STATUS_LABEL[a.statut]}
                    </span>
                  </td>
                  <td className="py-2.5 hidden sm:table-cell text-slate-400">
                    {new Date(a.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
              {actes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                    Aucun acte contractuel enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ActeCard({ acte }: { acte: Acte }) {
  return (
    <div className={clsx(
      'bg-white rounded-lg p-2.5 shadow-sm border border-surface-200 text-xs space-y-1',
      acte.alerte && 'border-amber-200'
    )}>
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-slate-400">{acte.numero}</span>
        {acte.alerte && <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />}
      </div>
      <p className="font-semibold text-slate-800 leading-tight line-clamp-2">{acte.titre}</p>
      <div className="flex items-center gap-1 text-slate-500">
        <Users className="w-3 h-3" />
        <span className="truncate">{acte.partieB}</span>
      </div>
      {acte.dateFin && (
        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{new Date(acte.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
        </div>
      )}
    </div>
  )
}
