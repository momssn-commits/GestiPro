'use client'

import { useState } from 'react'
import {
  FileText, Download, Trash2, Search, Loader2,
  ChevronLeft, ChevronRight, Folder, Users, User, Pencil,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api/documents'
import { useDeleteDocument } from '@/hooks/useDocuments'
import { useAuthStore } from '@/store/auth'
import type { Document } from '@/lib/types'
import { DocumentEditorModal } from './DocumentEditorModal'

// ─── Badges ──────────────────────────────────────────────────────────────────
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
const CAT_LABEL: Record<string, string> = {
  devis: 'Devis', apd: 'APD', facture: 'Facture', contrat: 'Contrat', autre: 'Autre',
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface FilesListProps {
  folderId?:  string | null
  serviceId?: string | null
  userId?:    string | null
}

const PAGE_SIZE = 20

export function FilesList({ folderId, serviceId, userId }: FilesListProps) {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')

  const params = {
    page,
    limit:     PAGE_SIZE,
    folderId:  folderId  ?? undefined,
    serviceId: serviceId ?? undefined,
    userId:    userId    ?? undefined,
    search:    search    || undefined,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['documents', params],
    queryFn:  () => documentsApi.getDocuments(params),
    retry:    false,
    placeholderData: (prev) => prev,
  })

  const [editingDoc, setEditingDoc] = useState<{ id: string; name: string } | null>(null)

  const deleteDoc  = useDeleteDocument()
  const { user }   = useAuthStore()
  const canManage  = user?.role === 'admin' || user?.role === 'rh' || user?.role === 'manager'

  // Extensions éditables par OnlyOffice
  const isEditable = (name: string) =>
    /\.(docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)$/i.test(name)

  const docs:  Document[] = (data as { data?: Document[] })?.data ?? []
  const total: number     = (data as { total?: number })?.total  ?? 0
  const totalPages        = Math.ceil(total / PAGE_SIZE)

  // Reset page on filter change
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  const contextLabel = folderId
    ? <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> Dossier sélectionné</span>
    : serviceId
    ? <span className="flex items-center gap-1"><Users  className="w-3 h-3" /> Service sélectionné</span>
    : userId
    ? <span className="flex items-center gap-1"><User   className="w-3 h-3" /> Employé sélectionné</span>
    : 'Tous les documents'

  return (
    <div className="card space-y-4">
      {/* Entête */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          {contextLabel}
          {total > 0 && (
            <span className="text-xs font-normal text-slate-400 bg-surface-200 rounded-full px-2 py-0.5">
              {total}
            </span>
          )}
        </h3>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher…"
            className="input pl-8 py-1.5 text-xs w-48"
          />
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">Aucun document trouvé</p>
          {search && (
            <button onClick={() => handleSearch('')} className="text-xs text-brand mt-2 hover:underline">
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className={clsx('overflow-x-auto', isFetching && 'opacity-70 transition-opacity')}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-200 text-left text-slate-500">
                <th className="pb-2 font-medium pr-3">Nom</th>
                <th className="pb-2 font-medium pr-3 hidden sm:table-cell">Répertoire</th>
                <th className="pb-2 font-medium pr-3 hidden md:table-cell">Service</th>
                <th className="pb-2 font-medium pr-3 hidden lg:table-cell">Déposé par</th>
                <th className="pb-2 font-medium pr-3">Catégorie</th>
                <th className="pb-2 font-medium pr-3">Statut</th>
                <th className="pb-2 font-medium pr-3 hidden sm:table-cell">Date</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {docs.map(doc => (
                <tr key={doc.id} className="hover:bg-surface-50 transition-colors">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[160px] font-medium text-slate-700">{doc.name}</span>
                    </div>
                    {doc.description && (
                      <p className="text-slate-400 truncate max-w-[160px] mt-0.5">{doc.description}</p>
                    )}
                  </td>
                  <td className="py-2 pr-3 hidden sm:table-cell">
                    {doc.folderName ? (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Folder className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[100px]">{doc.folderName}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 hidden md:table-cell">
                    {(doc as { serviceName?: string }).serviceName ? (
                      <span className="truncate max-w-[100px] text-slate-600">
                        {(doc as { serviceName?: string }).serviceName}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 hidden lg:table-cell">
                    <span className="text-slate-600">
                      {doc.firstName && doc.lastName ? `${doc.firstName} ${doc.lastName}` : '—'}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="bg-surface-200 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {CAT_LABEL[doc.category] ?? doc.category}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={clsx('px-1.5 py-0.5 rounded-full', STATUS_BADGE[doc.status] ?? 'bg-surface-100 text-slate-600')}>
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 hidden sm:table-cell text-slate-400">
                    {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditable(doc.name) && (
                        <button
                          onClick={() => setEditingDoc({ id: doc.id, name: doc.name })}
                          className="p-1 rounded text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
                          title="Éditer avec OnlyOffice"
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-surface-200">
          <span className="text-xs text-slate-400">
            Page {page} / {totalPages} — {total} document{total > 1 ? 's' : ''}
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

      {/* Éditeur OnlyOffice — plein écran */}
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
