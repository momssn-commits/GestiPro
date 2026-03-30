'use client'

import Link from 'next/link'
import { CheckCircle, PlayCircle, Loader2, BookOpen } from 'lucide-react'
import { useMyFormations } from '@/hooks/useFormation'

type Enrollment = {
  id: string; title?: string; progressPct?: number; progress?: number
  formation?: { id?: string; title?: string }; formationId?: string
}

export function MyFormations() {
  const { data, isLoading, isError } = useMyFormations()

  const enrollments: Enrollment[] = (!isError && data)
    ? (Array.isArray(data) ? data : ((data as { data?: Enrollment[] }).data ?? []))
    : []

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 text-brand animate-spin" />
        <span className="text-sm text-slate-500">Chargement des formations...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card text-center py-8">
        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Impossible de charger vos formations</p>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="card text-center py-8">
        <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-700 font-medium">Aucune formation en cours</p>
        <p className="text-xs text-slate-500 mt-1">Consultez le catalogue pour vous inscrire.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900 mb-4">Mes formations en cours</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enrollments.map(e => {
          const progress = e.progressPct ?? e.progress ?? 0
          const title    = e.formation?.title ?? e.title ?? 'Formation'
          const href     = `/formation/${e.formation?.id ?? e.formationId ?? e.id}`
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
