'use client'

import { useState } from 'react'
import {
  FileText, Download, Trash2, Search, Loader2,
  ChevronLeft, ChevronRight, Pencil, FileSignature,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useDocuments, useDeleteDocument } from '@/hooks/useDocuments'
import { useAuthStore } from '@/store/auth'
import { documentsApi } from '@/lib/api/documents'
import type { Document } from '@/lib/types'
import { DocumentEditorModal } from '../documents/DocumentEditorModal'

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  archived:  'bg-slate-100 text-slate-600',
}
const STATUS_LABEL: Record<string, string> = {
  pending:   'En attente',
  in_review: 'En révision',
  approved:  'Approuvé',
  rejected:  'Refusé',
  archived:  'Archivé',
}

const WORKFLOW_LABEL: Record<string, string> = {
  depot:        'Dépôt',
  verification: 'Vérification',
  approbation:  'Approbation',
  archivage:    'Archivage',
}

const PAGE_SIZE = 20

export function ContratsList() {
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, isFetching } = useDocuments({
    page,
    limit: PAGE_SIZE,
    category: 'contrat',
    search: search || undefined,
  })

  const [editingDoc, setEditingDoc] = useState<{ id: string; name: string } | null>(null)
  const deleteDoc = useDeleteDocument()
  const { user }  = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'rh' || user?.role === 'manager'

  const isEditable = (name: string) =>
    /\.(docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)$/i.test(name)

  const docs: Document[]  = (data as { data?: Document[] })?.data ?? []
  const total: number     = (data as { total?: number })?.total ?? 0
  const totalPages        = Math.ceil(total / PAGE_SIZE)

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Rechercher un contrat..."
          className="w-full pl-10 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-white"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 justify-center">
          <Loader2 className="w-5 h-5 text-brand animate-spin" />
          <span className="text-sm text-slate-500">Chargement des contrats...</span>
        </div>
      ) : isError ? (
        <div className="card text-center py-10">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Impossible de charger les contrats</p>
          <p className="text-xs text-slate-500 mt-1">Vérifiez votre connexion au serveur.</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="card text-center py-12">
          <FileSignature className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            {search ? 'Aucun contrat trouvé' : 'Aucun contrat enregistré'}
          </p>
        </div>
      ) : (
        <div className={clsx('card', isFetching && 'opacity-70 transition-opacity')}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-200 text-left text-slate-500">
                  <th className="pb-2 font-medium pr-3">Nom</th>
                  <th className="pb-2 font-medium pr-3 hidden md:table-cell">Service</th>
                  <th className="pb-2 font-medium pr-3 hidden lg:table-cell">Déposé par</th>
                  <th className="pb-2 font-medium pr-3">Étape</th>
                  <th className="pb-2 font-medium pr-3">Statut</th>
                  <th className="pb-2 font-medium pr-3 hidden sm:table-cell">Date</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {docs.map(doc => {
                  const step = (doc as { workflowStep?: string; workflow_step?: string }).workflowStep
                    ?? (doc as { workflow_step?: string }).workflow_step
                  return (
                    <tr key={doc.id} className="hover:bg-surface-50 transition-colors">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[200px] font-medium text-slate-700">{doc.name}</span>
                        </div>
                        {doc.description && (
                          <p className="text-slate-400 truncate max-w-[200px] mt-0.5">{doc.description}</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 hidden md:table-cell text-slate-600">
                        {(doc as { serviceName?: string }).serviceName ?? '—'}
                      </td>
                      <td className="py-2.5 pr-3 hidden lg:table-cell text-slate-600">
                        {doc.firstName && doc.lastName ? `${doc.firstName} ${doc.lastName}` : '—'}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="bg-surface-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                          {step ? (WORKFLOW_LABEL[step] ?? step) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={clsx('px-1.5 py-0.5 rounded-full', STATUS_BADGE[doc.status] ?? 'bg-surface-100 text-slate-600')}>
                          {STATUS_LABEL[doc.status] ?? doc.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 hidden sm:table-cell text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isEditable(doc.name) && (
                            <button
                              onClick={() => setEditingDoc({ id: doc.id, name: doc.name })}
                              className="p-1 rounded text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                              title="Éditer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <a
                            href={documentsApi.downloadDocument(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                            title="Télécharger"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {canManage && (
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer "${doc.name}" ?`)) deleteDoc.mutate(doc.id)
                              }}
                              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-200">
              <span className="text-xs text-slate-400">
                Page {page} / {totalPages} — {total} contrat{total > 1 ? 's' : ''}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-surface-200 text-slate-500 hover:bg-surface-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-surface-200 text-slate-500 hover:bg-surface-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {total > 0 && !isLoading && !isError && docs.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          {total} contrat{total > 1 ? 's' : ''}
        </p>
      )}

      {editingDoc && (
        <DocumentEditorModal
          documentId={editingDoc.id}
          documentName={editingDoc.name}
          onClose={() => setEditingDoc(null)}
        />
      )}
    </div>
  )
}
