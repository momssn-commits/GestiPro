'use client'

import { BookOpen, Clock, Users, Star, PlayCircle, FileText, HelpCircle, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { useFormation } from '@/hooks/useFormation'

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  video: PlayCircle,
  pdf:   FileText,
  quiz:  HelpCircle,
}

const levelLabels: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé',
}

interface Props { id: string }

type Module = { id: string; title: string; type: string; duration: number; completed?: boolean }
type FormationData = {
  id: string; title: string; description?: string; category: string; level: string
  duration?: number; durationMinutes?: number; instructor?: string
  rating?: number; enrolledCount?: number
  modules?: Module[]; formationModules?: Module[]
}

export function FormationDetail({ id }: Props) {
  const { data, isLoading, isError } = useFormation(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="card text-center py-12">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-700">Impossible de charger cette formation</p>
        <p className="text-xs text-slate-500 mt-1">Vérifiez votre connexion au serveur.</p>
      </div>
    )
  }

  const f = data as FormationData
  const modules = f.modules ?? f.formationModules ?? []
  const dur = f.durationMinutes ?? f.duration ?? 0
  const levelLabel = levelLabels[f.level] ?? f.level
  const completed = modules.filter(m => m.completed).length
  const progress = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-500 text-sm mb-1">{f.category} · {levelLabel}</p>
        <h1 className="text-2xl font-bold text-slate-900">{f.title}</h1>
        {f.description && <p className="text-sm text-slate-600 mt-2">{f.description}</p>}
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
          {f.rating != null && (
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />{f.rating}</span>
          )}
          {f.enrolledCount != null && (
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{f.enrolledCount} inscrits</span>
          )}
          {dur > 0 && (
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{Math.floor(dur / 60)}h{dur % 60 > 0 ? `${dur % 60}m` : ''}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules list */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Modules ({modules.length})</h3>
            {modules.length > 0 && (
              <span className="text-xs text-slate-500">{completed}/{modules.length} complétés</span>
            )}
          </div>
          {modules.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Aucun module pour cette formation.</p>
          ) : (
            <div className="divide-y divide-surface-200">
              {modules.map((m, i) => {
                const Icon = typeIcon[m.type] ?? FileText
                return (
                  <div key={m.id} className={clsx(
                    'flex items-center gap-3 px-5 py-3 transition-all',
                    m.completed ? 'opacity-60' : 'hover:bg-surface-200 cursor-pointer'
                  )}>
                    <div className={clsx(
                      'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                      m.completed ? 'bg-accent-green/10' : 'bg-surface-200'
                    )}>
                      {m.completed
                        ? <CheckCircle className="w-4 h-4 text-accent-green" />
                        : <Icon className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-600">{i + 1}. {m.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{m.type} · {m.duration} min</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <p className="text-xs text-slate-500 mb-1">Progression</p>
            <p className="text-3xl font-bold text-slate-900 mb-2">{progress}%</p>
            <div className="h-2 bg-surface-300 rounded-full">
              <div className="h-2 bg-brand rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <button className="btn-primary w-full justify-center mt-4">
              <PlayCircle className="w-4 h-4" />
              {progress > 0 ? 'Continuer' : 'Commencer'}
            </button>
          </div>
          {f.instructor && (
            <div className="card">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Instructeur</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{f.instructor}</p>
                  <p className="text-xs text-slate-500">Expert certifié</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
