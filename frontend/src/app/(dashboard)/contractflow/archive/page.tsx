'use client'

import { useState, useMemo } from 'react'
import {
  Search, Archive, Filter, Download, Eye,
  Calendar, DollarSign, FileSignature, X, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { STATUS_LABEL, STATUS_COLOR, TYPE_LABEL } from '@/components/contractflow/shared'
import type { Acte, ActeStatut, ActeType } from '@/lib/types'
import { useActes, useTransitionActe } from '@/hooks/useContractflow'

const ALL_STATUSES: ActeStatut[] = ['brouillon', 'en_instruction', 'en_validation', 'signe', 'archive', 'rejete']
const ALL_TYPES: ActeType[] = ['convention', 'contrat_prestation', 'accord_cadre', 'protocole', 'avenant']

export default function ArchivePage() {
  const [query, setQuery]             = useState('')
  const [statusFilter, setStatus]     = useState<ActeStatut | ''>('')
  const [typeFilter, setType]         = useState<ActeType | ''>('')
  const [serviceFilter, setService]   = useState('')
  const [selected, setSelected]       = useState<Acte | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useActes({ limit: 200 })
  const actes: Acte[] = data?.data ?? []
  const { mutate: doTransition, isPending: archiving } = useTransitionActe()

  const services = useMemo(() => [...new Set(actes.map(a => a.service).filter(Boolean))], [actes])

  const results = useMemo(() => {
    const q = query.toLowerCase()
    return actes.filter(a => {
      const matchQ = !q || a.numero.toLowerCase().includes(q) || a.titre.toLowerCase().includes(q) ||
        a.partieB.toLowerCase().includes(q) || a.objet.toLowerCase().includes(q) ||
        (a.service ?? '').toLowerCase().includes(q)
      const matchS = !statusFilter  || a.statut  === statusFilter
      const matchT = !typeFilter    || a.type    === typeFilter
      const matchSv = !serviceFilter || a.service === serviceFilter
      return matchQ && matchS && matchT && matchSv
    })
  }, [actes, query, statusFilter, typeFilter, serviceFilter])

  const clearFilters = () => { setQuery(''); setStatus(''); setType(''); setService('') }
  const hasFilters = !!(query || statusFilter || typeFilter || serviceFilter)

  const handleArchive = (acte: Acte) => {
    doTransition(
      { id: acte.id, payload: { action: 'archive', comment: 'Archivage de l\'acte' } },
      { onSuccess: () => setSelected(null) }
    )
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recherche & Archivage</h1>
          <p className="text-slate-500 text-sm mt-1">M6 — Recherche plein texte et consultation des actes</p>
        </div>
        <button className="btn-secondary text-sm">
          <Download className="w-4 h-4" /> Exporter
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par numéro, titre, partie, service, objet…"
            className="input pl-10" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-2.5 text-slate-300 hover:text-slate-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={clsx('btn-secondary', showFilters && 'bg-brand/10 border-brand/30 text-brand')}>
          <Filter className="w-4 h-4" /> Filtres
          {hasFilters && <span className="w-2 h-2 rounded-full bg-brand flex-shrink-0" />}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-red-500 px-2">Effacer</button>
        )}
      </div>

      {showFilters && (
        <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
            <select value={statusFilter} onChange={e => setStatus(e.target.value as ActeStatut | '')} className="input text-sm py-1.5">
              <option value="">— Tous —</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select value={typeFilter} onChange={e => setType(e.target.value as ActeType | '')} className="input text-sm py-1.5">
              <option value="">— Tous —</option>
              {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Service</label>
            <select value={serviceFilter} onChange={e => setService(e.target.value)} className="input text-sm py-1.5">
              <option value="">— Tous —</option>
              {services.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
            </select>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">
        {results.length} acte{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
        {hasFilters && ' — filtres actifs'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Results */}
        <div className="lg:col-span-3 space-y-2">
          {results.length === 0 && (
            <div className="card text-center py-12 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun résultat</p>
            </div>
          )}
          {results.map(acte => (
            <div key={acte.id} onClick={() => setSelected(acte)}
              className={clsx(
                'card cursor-pointer transition-all hover:shadow-md',
                selected?.id === acte.id && 'ring-2 ring-brand'
              )}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-400">{acte.numero}</span>
                    <span className={clsx('px-1.5 py-0.5 rounded-full text-xs', STATUS_COLOR[acte.statut])}>
                      {STATUS_LABEL[acte.statut]}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-1 leading-tight">{acte.titre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{TYPE_LABEL[acte.type]}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>{acte.partieB}</span>
                    {acte.service && <><span>·</span><span>{acte.service}</span></>}
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); setSelected(acte) }}
                  className="text-slate-300 hover:text-brand transition-colors flex-shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card text-center py-16 text-slate-400 sticky top-4">
              <Archive className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Cliquez sur un acte pour consulter son détail</p>
            </div>
          ) : (
            <div className="card space-y-4 sticky top-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-slate-400">{selected.numero}</p>
                  <h3 className="font-bold text-slate-900 mt-0.5 text-sm leading-tight">{selected.titre}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs flex-shrink-0', STATUS_COLOR[selected.statut])}>
                    {STATUS_LABEL[selected.statut]}
                  </span>
                  <button onClick={() => setSelected(null)} className="text-slate-300 hover:text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-surface rounded-lg p-2.5">
                    <p className="text-slate-400 flex items-center gap-1 mb-1">
                      <FileSignature className="w-3 h-3" /> Type
                    </p>
                    <p className="font-medium text-slate-700">{TYPE_LABEL[selected.type]}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2.5">
                    <p className="text-slate-400 mb-1">Service</p>
                    <p className="font-medium text-slate-700">{selected.service ?? '—'}</p>
                  </div>
                </div>
                <div className="bg-surface rounded-lg p-2.5">
                  <p className="text-slate-400 mb-1">Parties</p>
                  <p className="font-medium text-slate-700">{selected.partieA}</p>
                  <p className="text-slate-500">↔ {selected.partieB}</p>
                </div>
                <div className="bg-surface rounded-lg p-2.5">
                  <p className="text-slate-400 mb-1">Objet</p>
                  <p className="text-slate-700 leading-relaxed">{selected.objet}</p>
                </div>
                {selected.dateFin && (
                  <div className="bg-surface rounded-lg p-2.5 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {selected.dateDebut ? new Date(selected.dateDebut).toLocaleDateString('fr-FR') : '?'}
                      {' → '}
                      {new Date(selected.dateFin).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                {selected.montant && selected.montant > 0 && (
                  <div className="bg-surface rounded-lg p-2.5 flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold text-slate-700">
                      {selected.montant.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button className="btn-primary text-xs flex-1">
                  <Download className="w-3.5 h-3.5" /> Télécharger
                </button>
                {selected.statut === 'signe' && (
                  <button
                    onClick={() => handleArchive(selected)}
                    disabled={archiving}
                    className="btn-secondary text-xs disabled:opacity-50"
                  >
                    {archiving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Archive className="w-3.5 h-3.5" />
                    }
                    Archiver
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
