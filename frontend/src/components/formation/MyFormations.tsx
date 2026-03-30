'use client'

import Link from 'next/link'
import { CheckCircle, PlayCircle, Loader2 } from 'lucide-react'
import { useMyFormations } from '@/hooks/useFormation'

const MOCK = [
  { id: '1', title: 'Excel avancé pour professionnels', progressPct: 60, formation: { title: 'Excel avancé pour professionnels' } },
  { id: '3', title: 'Sécurité informatique',            progressPct: 100, formation: { title: 'Sécurité informatique' } },
]

type Enrollment = { id: string; title?: string; progressPct?: number; progress?: number; formation?: { id?: string; title?: string } }

export function MyFormations() {
  const { data, isLoading, isError } = useMyFormations()

  const enrollments: Enrollment[] = (isError || !data)
    ? MOCK
    : (Array.isArray(data) ? data : ((data as { data?: Enrollment[] }).data ?? MOCK))

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 text-brand animate-spin" />
        <span className="text-sm text-slate-500">Chargement des formations...</span>
      </div>
    )
  }

  if (enrollments.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-slate-900">Mes formations en cours</h2>
        {isError && <span className="text-xs text-amber-400">Mode local</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrollments.map(e => {
          const progress = e.progressPct ?? e.progress ?? 0
          const title    = e.formation?.title ?? e.title ?? 'Formation'
          const href     = `/formation/${e.formation?.id ?? e.id}`
          return (
            <Link key={e.id} href={href} className="card flex items-center gap-4 hover:border-slate-200 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${progress === 100 ? 'bg-accent-green/10' : 'bg-brand/8'}`}>
                {progress === 100
                  ? <CheckCircle className="w-5 h-5 text-accent-green" />
                  : <PlayCircle  className="w-5 h-5 text-brand" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{title}</p>
                <div className="h-1.5 bg-surface-300 rounded-full mt-2">
                  <div
                    className={`h-1.5 rounded-full ${progress === 100 ? 'bg-accent-green' : 'bg-brand'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className={progress === 100 ? 'badge-green' : 'badge-blue'}>
                {progress === 100 ? 'Terminée' : `${progress}%`}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
