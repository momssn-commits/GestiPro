'use client'

import { BookOpen, Clock, Users, Star, PlayCircle, FileText, HelpCircle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

const mockFormation = {
  id: '1',
  title: 'Excel avancé pour professionnels',
  description: 'Maîtrisez les fonctions avancées d\'Excel : tableaux croisés dynamiques, macros VBA, formules complexes et visualisation de données.',
  category: 'Bureautique',
  level: 'Avancé',
  duration: 480,
  instructor: 'Dr. Amira Khelil',
  rating: 4.7,
  enrolledCount: 42,
  modules: [
    { id: 'm1', title: 'Introduction et rappels',         type: 'video', duration: 25, completed: true  },
    { id: 'm2', title: 'Fonctions avancées (RECHERCHEV)', type: 'video', duration: 40, completed: true  },
    { id: 'm3', title: 'Quiz — Fonctions de base',        type: 'quiz',  duration: 15, completed: true  },
    { id: 'm4', title: 'Tableaux croisés dynamiques',     type: 'video', duration: 55, completed: true  },
    { id: 'm5', title: 'Graphiques et visualisation',     type: 'video', duration: 45, completed: false },
    { id: 'm6', title: 'Introduction aux macros VBA',     type: 'pdf',   duration: 30, completed: false },
    { id: 'm7', title: 'Exercice pratique TCD',           type: 'quiz',  duration: 20, completed: false },
  ],
}

const typeIcon = { video: PlayCircle, pdf: FileText, quiz: HelpCircle }

interface Props { id: string }

export function FormationDetail({ id }: Props) {
  const f = mockFormation
  const completed = f.modules.filter(m => m.completed).length
  const progress = Math.round((completed / f.modules.length) * 100)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-500 text-sm mb-1">{f.category} · {f.level}</p>
        <h1 className="text-2xl font-bold text-slate-900">{f.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
          <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-accent-yellow text-accent-yellow" />{f.rating}</span>
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{f.enrolledCount} inscrits</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{Math.floor(f.duration / 60)}h{f.duration % 60}m</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules list */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Modules ({f.modules.length})</h3>
            <span className="text-xs text-slate-500">{completed}/{f.modules.length} complétés</span>
          </div>
          <div className="divide-y divide-surface-200">
            {f.modules.map((m, i) => {
              const Icon = typeIcon[m.type as keyof typeof typeIcon]
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
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <p className="text-xs text-slate-500 mb-1">Progression</p>
            <p className="text-3xl font-bold text-slate-900 mb-2">{progress}%</p>
            <div className="h-2 bg-surface-300 rounded-full">
              <div className="h-2 bg-brand rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <button className="btn-primary w-full justify-center mt-4">
              <PlayCircle className="w-4 h-4" />
              Continuer
            </button>
          </div>
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
        </div>
      </div>
    </div>
  )
}
