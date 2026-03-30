'use client'

import Link from 'next/link'
import { Clock, Users, Star, BookOpen, Loader2 } from 'lucide-react'
import { useFormationCatalog } from '@/hooks/useFormation'

const levelColors: Record<string, string> = {
  'Débutant': 'badge-green', 'Intermédiaire': 'badge-yellow', 'Avancé': 'badge-red',
  debutant: 'badge-green', intermediaire: 'badge-yellow', avance: 'badge-red',
}

const levelLabels: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé',
}

type Formation = { id: string; title: string; category: string; level: string; durationMinutes?: number; duration?: number; enrolledCount?: number; rating?: number }

export function FormationCatalog() {
  const { data, isLoading, isError } = useFormationCatalog({ limit: 20 })

  const formations: Formation[] = (!isError && data)
    ? ((data as { data?: Formation[] }).data ?? (Array.isArray(data) ? data as Formation[] : []))
    : []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card text-center py-10">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Impossible de charger le catalogue</p>
        <p className="text-xs text-slate-500 mt-1">Vérifiez votre connexion au serveur.</p>
      </div>
    )
  }

  if (formations.length === 0) {
    return (
      <div className="card text-center py-10">
        <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Aucune formation disponible</p>
        <p className="text-xs text-slate-500 mt-1">De nouvelles formations seront bientôt ajoutées.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Catalogue des formations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {formations.map(f => {
          const dur = f.durationMinutes ?? f.duration ?? 0
          const levelLabel = levelLabels[f.level] ?? f.level
          return (
            <Link key={f.id} href={`/formation/${f.id}`} className="card hover:border-slate-200 transition-all group block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand/8 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-brand" />
                </div>
                <span className={levelColors[f.level] ?? 'badge-blue'}>{levelLabel}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand transition-colors leading-snug">{f.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{f.category}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                {dur > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(dur / 60)}h{dur % 60 > 0 ? `${dur % 60}m` : ''}
                  </span>
                )}
                {f.enrolledCount != null && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {f.enrolledCount}
                  </span>
                )}
                {f.rating != null && (
                  <span className="flex items-center gap-1 ml-auto">
                    <Star className="w-3.5 h-3.5 fill-accent-yellow text-accent-yellow" />
                    {f.rating}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
