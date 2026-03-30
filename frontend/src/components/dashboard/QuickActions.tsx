'use client'

import Link from 'next/link'
import { Upload, FileText, BookOpen, CheckSquare } from 'lucide-react'

const actions = [
  { label: 'Déposer un document', href: '/documents/depot',    icon: Upload,      color: 'bg-brand/8 text-brand' },
  { label: 'Attestation de travail', href: '/rh/attestations', icon: FileText,    color: 'bg-accent-green/10 text-accent-green' },
  { label: 'Mes validations',    href: '/rh/validations',      icon: CheckSquare, color: 'bg-accent-yellow/10 text-accent-yellow' },
  { label: 'Catalogue formations', href: '/formation',         icon: BookOpen,    color: 'bg-accent-purple/10 text-accent-purple' },
]

export function QuickActions() {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Actions rapides</h3>
      <div className="space-y-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-200 transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}>
              <a.icon className="w-4 h-4" />
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
