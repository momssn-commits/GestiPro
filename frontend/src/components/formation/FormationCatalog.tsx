'use client'

import Link from 'next/link'
import { Clock, Users, Star, BookOpen, Loader2 } from 'lucide-react'
import { useFormationCatalog } from '@/hooks/useFormation'

const levelColors: Record<string, string> = {
  'Débutant': 'badge-green', 'Intermédiaire': 'badge-yellow', 'Avancé': 'badge-red',
  'beginner': 'badge-green', 'intermediate': 'badge-yellow', 'advanced': 'badge-red',
}
const MOCK = [
  { id: '1', title: 'Excel avancé pour professionnels',    category: 'Bureautique', level: 'Avancé',        durationMinutes: 480,  enrolledCount: 42, rating: 4.7 },
  { id: '2', title: 'Introduction à la gestion de projet', category: 'Management',  level: 'Intermédiaire', durationMinutes: 360,  enrolledCount: 85, rating: 4.9 },
  { id: '3', title: 'Sécurité informatique en entreprise', category: 'IT',          level: 'Débutant',      durationMinutes: 240,  enrolledCount: 120, rating: 4.5 },
  { id: '4', title: 'Communication professionnelle',       category: 'Soft Skills', level: 'Débutant',      durationMinutes: 180,  enrolledCount: 65, rating: 4.3 },
  { id: '5', title: "Droit du travail — notions clés",    category: 'Juridique',   level: 'Intermédiaire', durationMinutes: 300,  enrolledCount: 38, rating: 4.6 },
  { id: '6', title: "Leadership et management d'équipe",  category: 'Management',  level: 'Avancé',        durationMinutes: 540,  enrolledCount: 29, rating: 4.8 },
]

type Formation = { id: string; title: string; category: string; level: string; durationMinutes?: number; duration?: number; enrolledCount?: number; rating?: number }

export function FormationCatalog() {
  const { data, isLoading, isError } = useFormationCatalog({ limit: 20 })

  const formations: Formation[] = (isError || !data)
    ? MOCK
    : ((data as { data?: Formation[] }).data ?? MOCK)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Catalogue des formations</h2>
        {isLoading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
        {isError   && <span className="text-xs text-amber-400">Mode local</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {formations.map(f => {
          const dur = f.durationMinutes ?? f.duration ?? 0
          const levelKey = f.level
          return (
            <Link key={f.id} href={`/formation/${f.id}`} className="card hover:border-slate-200 transition-all group block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand/8 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-brand" />
                </div>
                <span className={levelColors[levelKey] ?? 'badge-blue'}>{f.level}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand transition-colors leading-snug">{f.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{f.category}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {Math.floor(dur / 60)}h{dur % 60 > 0 ? `${dur % 60}m` : ''}
                </span>
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
