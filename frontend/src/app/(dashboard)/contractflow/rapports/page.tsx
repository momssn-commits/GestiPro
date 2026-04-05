'use client'

import {
  BarChart3, TrendingUp, FileSignature, Clock,
  CheckCircle2, XCircle, Archive, Download,
  AlertTriangle, Calendar, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from '@/components/contractflow/shared'
import { useActeStats, useActes } from '@/hooks/useContractflow'
import type { Acte } from '@/lib/types'

const STATUS_ORDER = ['brouillon', 'en_instruction', 'en_validation', 'signe', 'archive', 'rejete']

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className={clsx('w-4 rounded-t transition-all', color)} style={{ height: `${max ? (value / max) * 100 : 0}%` }}
      title={String(value)} />
  )
}

export default function RapportsPage() {
  const { data: stats, isLoading: statsLoading } = useActeStats()
  const { data: actesData, isLoading: actesLoading } = useActes({ limit: 200 })
  const actes: Acte[] = actesData?.data ?? []

  if (statsLoading || actesLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand animate-spin" />
    </div>
  )

  const total        = actes.length
  const signes       = actes.filter(a => a.statut === 'signe').length
  const tauxSign     = total > 0 ? Math.round((signes / total) * 100) : 0
  const alerteCount  = stats?.alerteCount  ?? 0
  const totalMontant = stats?.totalMontant ?? 0

  const byStatut  = (stats?.byStatut  ?? []).sort((a, b) => STATUS_ORDER.indexOf(a.statut) - STATUS_ORDER.indexOf(b.statut))
  const byType    = stats?.byType    ?? []
  const byService = stats?.byService ?? []
  const monthly   = stats?.monthly   ?? []

  const maxMonthly = Math.max(...monthly.map(m => Math.max(Number(m.depot), Number(m.signes), Number(m.rejetes))), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapports & Statistiques</h1>
          <p className="text-slate-500 text-sm mt-1">M7 — Indicateurs de performance et tableaux de bord</p>
        </div>
        <button className="btn-secondary text-sm">
          <Download className="w-4 h-4" /> Exporter PDF
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: FileSignature, label: 'Actes total',       value: total,            color: 'text-slate-600', bg: 'bg-slate-50'  },
          { icon: CheckCircle2,  label: 'Taux de signature', value: `${tauxSign}%`,   color: 'text-green-600', bg: 'bg-green-50'  },
          { icon: AlertTriangle, label: 'En alerte',         value: alerteCount,      color: 'text-amber-600', bg: 'bg-amber-50'  },
          { icon: TrendingUp,    label: 'Montant engagé',    value: totalMontant >= 1_000_000
              ? `${(totalMontant / 1_000_000).toFixed(1)} M`
              : `${(totalMontant / 1000).toFixed(0)} k`, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(kpi => (
          <div key={kpi.label} className={clsx('rounded-xl p-4', kpi.bg)}>
            <kpi.icon className={clsx('w-5 h-5 mb-2', kpi.color)} />
            <p className={clsx('text-2xl font-bold', kpi.color)}>{kpi.value}</p>
            <p className={clsx('text-xs font-medium mt-0.5', kpi.color)}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart mensuel */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand" />
            Évolution mensuelle
          </h2>
          {monthly.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Aucune donnée mensuelle</p>
          ) : (
            <>
              <div className="flex items-end gap-2 justify-between px-2">
                {monthly.map(m => (
                  <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                    <div className="flex items-end gap-0.5 h-28">
                      <Bar value={Number(m.depot)}   max={maxMonthly} color="bg-brand/70" />
                      <Bar value={Number(m.signes)}  max={maxMonthly} color="bg-green-400" />
                      <Bar value={Number(m.rejetes)} max={maxMonthly} color="bg-red-300" />
                    </div>
                    <span className="text-xs text-slate-400">{m.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 justify-center">
                {[
                  { color: 'bg-brand/70', label: 'Dépôts' },
                  { color: 'bg-green-400', label: 'Signés' },
                  { color: 'bg-red-300', label: 'Rejetés' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <div className={clsx('w-3 h-3 rounded', l.color)} />{l.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Statuts */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" /> Répartition par statut
          </h2>
          <div className="space-y-3">
            {byStatut.filter(s => Number(s.count) > 0).map(s => (
              <div key={s.statut} className="flex items-center gap-3">
                <span className={clsx('px-2 py-0.5 rounded-full text-xs w-28 text-center', STATUS_COLOR[s.statut])}>
                  {STATUS_LABEL[s.statut]}
                </span>
                <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-brand rounded-full"
                    style={{ width: `${total ? (Number(s.count) / total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-600 w-6 text-right">{s.count}</span>
              </div>
            ))}
            {byStatut.every(s => Number(s.count) === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">Aucune donnée</p>
            )}
          </div>
          <div className="mt-5 pt-4 border-t border-surface-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Taux de signature</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-surface-200 rounded-full overflow-hidden">
                <div className="h-3 bg-green-500 rounded-full" style={{ width: `${tauxSign}%` }} />
              </div>
              <span className="text-sm font-bold text-green-600">{tauxSign}%</span>
            </div>
          </div>
        </div>

        {/* Par type */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-brand" /> Par type d'acte
          </h2>
          <div className="space-y-3">
            {byType.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aucune donnée</p>}
            {byType.map(t => (
              <div key={t.type} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-36 truncate">{TYPE_LABEL[t.type] ?? t.type}</span>
                <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-brand/70 rounded-full"
                    style={{ width: `${total ? (Number(t.count) / total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-600 w-6 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Par service */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Archive className="w-4 h-4 text-brand" /> Par service
          </h2>
          <div className="space-y-3">
            {byService.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Aucune donnée</p>}
            {byService.map(s => (
              <div key={s.service} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-44 truncate">{s.service}</span>
                <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-purple-400 rounded-full"
                    style={{ width: `${total ? (Number(s.count) / total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-semibold text-slate-600 w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actes à échéance */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand" /> Actes à surveiller (par échéance)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200 text-left text-slate-500">
                <th className="pb-2 font-medium pr-4">Référence</th>
                <th className="pb-2 font-medium pr-4">Titre</th>
                <th className="pb-2 font-medium pr-4 hidden sm:table-cell">Partie B</th>
                <th className="pb-2 font-medium pr-4">Échéance</th>
                <th className="pb-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {actes
                .filter(a => a.dateFin)
                .sort((a, b) => new Date(a.dateFin!).getTime() - new Date(b.dateFin!).getTime())
                .map(a => {
                  const daysLeft = Math.ceil(
                    (new Date(a.dateFin!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <tr key={a.id} className="hover:bg-surface-50">
                      <td className="py-2.5 pr-4">
                        <span className="font-mono text-slate-600">{a.numero}</span>
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-slate-800 max-w-[160px] truncate">{a.titre}</td>
                      <td className="py-2.5 pr-4 hidden sm:table-cell text-slate-500 max-w-[120px] truncate">{a.partieB}</td>
                      <td className="py-2.5 pr-4">
                        <div>
                          <p>{new Date(a.dateFin!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                          <p className={clsx('text-xs mt-0.5',
                            daysLeft < 0 ? 'text-red-600 font-bold' :
                            daysLeft < 90 ? 'text-red-500 font-medium' :
                            daysLeft < 180 ? 'text-amber-500' : 'text-slate-400')}>
                            {daysLeft < 0 ? 'Expiré' : `J-${daysLeft}`}
                          </p>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className={clsx('px-1.5 py-0.5 rounded-full text-xs', STATUS_COLOR[a.statut])}>
                          {STATUS_LABEL[a.statut]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              {actes.filter(a => a.dateFin).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Aucun acte avec date d'échéance renseignée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
