'use client'

import { useState } from 'react'
import { Download, Eye, Loader2, Pencil } from 'lucide-react'
import { clsx } from 'clsx'
import { useDocuments } from '@/hooks/useDocuments'
import { DocumentEditorModal } from './DocumentEditorModal'

const statusLabels: Record<string, string> = {
  depot: 'Dépôt', verification: 'Vérification', approbation: 'Approbation', archivage: 'Archivé',
}
const statusClasses: Record<string, string> = {
  depot: 'badge-blue', verification: 'badge-yellow', approbation: 'badge-green', archivage: 'badge-purple',
}

const MOCK = [
  { id: '1', name: 'Facture_Q3_2024.pdf',    category: 'facture', workflowStep: 'archivage',   size: '245 Ko',  createdAt: '01/08/2024' },
  { id: '2', name: 'Devis_Renovation_A.pdf', category: 'devis',   workflowStep: 'approbation', size: '1.2 Mo',  createdAt: '30/07/2024' },
  { id: '3', name: 'APD_Phase2_Final.pdf',   category: 'apd',     workflowStep: 'verification',size: '3.8 Mo',  createdAt: '28/07/2024' },
]

// Extensions éditables par OnlyOffice
const isEditable = (name: string) =>
  /\.(docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)$/i.test(name)

export function DocumentsTable() {
  const { data, isLoading, isError } = useDocuments({ limit: 50 })
  const [editingDoc, setEditingDoc] = useState<{ id: string; name: string } | null>(null)

  type Doc = { id: string; name: string; category: string; workflowStep?: string; size?: string; createdAt?: string; fileSize?: number }
  const docs: Doc[] = (isError || !data)
    ? MOCK
    : ((data as { data?: Doc[] }).data ?? MOCK)

  return (
    <>
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Tous les documents</h3>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
            {isError   && <span className="text-xs text-amber-400">Mode local</span>}
            <span className="text-xs text-slate-500">{docs.length} document{docs.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                {['Nom', 'Catégorie', 'Statut', 'Taille', 'Date', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {docs.map(doc => {
                const step = doc.workflowStep ?? 'depot'
                const date = doc.createdAt
                  ? (doc.createdAt.includes('/') ? doc.createdAt : new Date(doc.createdAt).toLocaleDateString('fr-FR'))
                  : '—'
                const size = doc.size ?? (doc.fileSize ? `${Math.round(doc.fileSize / 1024)} Ko` : '—')
                return (
                  <tr key={doc.id} className="hover:bg-surface-200/50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-slate-700 font-medium truncate max-w-xs block">{doc.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge-blue capitalize">{doc.category}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={clsx(statusClasses[step] ?? 'badge-blue')}>
                        {statusLabels[step] ?? step}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{size}</td>
                    <td className="px-5 py-3 text-slate-500">{date}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {isEditable(doc.name) && (
                          <button
                            onClick={() => setEditingDoc({ id: doc.id, name: doc.name })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand hover:bg-brand/10 transition-all"
                            title="Éditer avec OnlyOffice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-surface-300 transition-all">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-surface-300 transition-all">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Éditeur OnlyOffice — plein écran */}
      {editingDoc && (
        <DocumentEditorModal
          documentId={editingDoc.id}
          documentName={editingDoc.name}
          onClose={() => setEditingDoc(null)}
        />
      )}
    </>
  )
}
