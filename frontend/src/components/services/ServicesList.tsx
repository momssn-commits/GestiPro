'use client'

import { useState } from 'react'
import { Search, Loader2, Building2 } from 'lucide-react'
import { useServices } from '@/hooks/useServices'
import { ServiceCard } from './ServiceCard'

import type { Service } from '@/lib/types'

export function ServicesList() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useServices({ search: search || undefined })

  const rawData = (!isError && data)
    ? (Array.isArray(data) ? data : ((data as { data?: unknown[] }).data ?? []))
    : []
  const services = rawData as Service[]

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un service..."
          className="w-full pl-10 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
          <span className="text-sm text-slate-500">Chargement des services...</span>
        </div>
      ) : isError ? (
        <div className="card text-center py-10">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Impossible de charger les services</p>
          <p className="text-xs text-slate-500 mt-1">Vérifiez votre connexion au serveur.</p>
        </div>
      ) : services.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {search ? 'Aucun service trouvé' : 'Aucun service configuré'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {services.map(s => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
          <p className="text-xs text-slate-400 text-right">
            {services.length} service{services.length > 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  )
}
