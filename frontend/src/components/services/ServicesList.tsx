'use client'

import { useState } from 'react'
import { Search, Loader2, Building2 } from 'lucide-react'
import { useServices } from '@/hooks/useServices'
import { ServiceCard } from './ServiceCard'

// Mock data pour le mode offline
const MOCK_SERVICES = [
  { id: '1', name: 'Secrétariat Général',  code: 'secretariat-general', description: 'Coordination administrative et correspondance officielle', color: 'indigo',  memberCount: 4, isActive: true, createdAt: '' },
  { id: '2', name: 'Technique',            code: 'technique',            description: 'Maintenance, infrastructure et support technique',        color: 'slate',   memberCount: 6, isActive: true, createdAt: '' },
  { id: '3', name: 'Médiathèque',          code: 'mediatheque',          description: 'Gestion des fonds documentaires et multimédia',          color: 'amber',   memberCount: 3, isActive: true, createdAt: '' },
  { id: '4', name: 'Pole Images',          code: 'pole-images',          description: 'Production et gestion des contenus visuels',             color: 'violet',  memberCount: 2, isActive: true, createdAt: '' },
  { id: '5', name: 'Pole Culture',         code: 'pole-culture',         description: 'Animation culturelle et événements',                     color: 'pink',    memberCount: 5, isActive: true, createdAt: '' },
  { id: '6', name: 'Direction',            code: 'direction',            description: 'Direction générale et pilotage stratégique',             color: 'red',     memberCount: 3, isActive: true, createdAt: '' },
  { id: '7', name: 'Communication',        code: 'communication',        description: 'Communication interne et externe',                       color: 'sky',     memberCount: 4, isActive: true, createdAt: '' },
  { id: '8', name: 'Agence Comptable',     code: 'agence-comptable',     description: 'Gestion comptable et financière',                       color: 'green',   memberCount: 3, isActive: true, createdAt: '' },
  { id: '9', name: 'Cours de Langue',      code: 'cours-de-langue',      description: 'Enseignement des langues étrangères',                   color: 'orange',  memberCount: 8, isActive: true, createdAt: '' },
  { id: '10', name: 'Campus France',       code: 'campus-france',        description: 'Orientation et mobilité étudiante',                     color: 'teal',    memberCount: 5, isActive: true, createdAt: '' },
]

export function ServicesList() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useServices({ search: search || undefined })

  const services = isError || !data
    ? MOCK_SERVICES.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
      )
    : (Array.isArray(data) ? data : [])

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
      ) : services.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun service trouvé</p>
        </div>
      ) : (
        <>
          {isError && (
            <p className="text-xs text-amber-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Mode local — données de démonstration
            </p>
          )}
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
