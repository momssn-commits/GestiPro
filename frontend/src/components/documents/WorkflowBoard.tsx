'use client'

import { clsx } from 'clsx'
import { CheckCircle, Clock, Upload, Archive } from 'lucide-react'

const STEPS = [
  { key: 'depot',        label: 'Dépôt',        icon: Upload,       color: 'text-brand',      bg: 'bg-brand/8' },
  { key: 'verification', label: 'Vérification',  icon: Clock,        color: 'text-accent-yellow',  bg: 'bg-accent-yellow/10' },
  { key: 'approbation',  label: 'Approbation',   icon: CheckCircle,  color: 'text-accent-green',   bg: 'bg-accent-green/10' },
  { key: 'archivage',    label: 'Archivage',      icon: Archive,      color: 'text-accent-purple',  bg: 'bg-accent-purple/10' },
]

const mockDocs = [
  { id: '1', name: 'Facture_2024_045.pdf',  step: 'depot',        category: 'facture', updatedAt: '2024-08-01' },
  { id: '2', name: 'Devis_Batiment_B.pdf',  step: 'verification', category: 'devis',   updatedAt: '2024-08-01' },
  { id: '3', name: 'APD_Phase2.pdf',        step: 'approbation',  category: 'apd',     updatedAt: '2024-07-30' },
  { id: '4', name: 'Contrat_Fournisseur.pdf', step: 'archivage',  category: 'contrat', updatedAt: '2024-07-28' },
  { id: '5', name: 'Devis_IT_2024.pdf',     step: 'depot',        category: 'devis',   updatedAt: '2024-07-31' },
]

export function WorkflowBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {STEPS.map((step, stepIndex) => {
        const docs = mockDocs.filter(d => d.step === step.key)
        return (
          <div key={step.key} className="card space-y-3">
            {/* Step header */}
            <div className="flex items-center gap-2">
              <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', step.bg)}>
                <step.icon className={clsx('w-3.5 h-3.5', step.color)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                <p className="text-xs text-slate-500">Étape {stepIndex + 1}/4</p>
              </div>
              <span className={clsx('ml-auto badge', step.bg, step.color)}>
                {docs.length}
              </span>
            </div>

            {/* Documents */}
            <div className="space-y-2">
              {docs.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">Aucun document</p>
              )}
              {docs.map(doc => (
                <div key={doc.id} className="bg-surface-200 rounded-lg p-3 hover:bg-surface-300 transition-all cursor-pointer">
                  <p className="text-xs font-medium text-slate-600 truncate">{doc.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="badge-blue capitalize">{doc.category}</span>
                    <span className="text-xs text-slate-600">{doc.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
