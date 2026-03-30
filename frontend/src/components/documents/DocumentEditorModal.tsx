'use client'

import { useEffect, useRef } from 'react'
import { X, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useEditorConfig } from '@/hooks/useOnlyOffice'
import dynamic from 'next/dynamic'

// Chargement côté client uniquement (pas de SSR pour l'éditeur OnlyOffice)
const DocumentEditor = dynamic(
  () => import('@onlyoffice/document-editor-react').then(m => m.DocumentEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
        <span>Initialisation de l'éditeur…</span>
      </div>
    ),
  }
)

interface Props {
  documentId:   string
  documentName: string
  onClose:      () => void
}

export function DocumentEditorModal({ documentId, documentName, onClose }: Props) {
  const { data, isLoading, isError, error } = useEditorConfig(documentId)

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Barre supérieure */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-slate-200 bg-white flex-shrink-0">
        <FileText className="w-4 h-4 text-brand flex-shrink-0" />
        <span className="text-sm font-medium text-slate-700 truncate flex-1">{documentName}</span>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded hover:bg-surface-100 text-slate-500 hover:text-slate-800 transition-colors"
          title="Fermer (Échap)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Zone éditeur */}
      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-full gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
            <span>Chargement du document…</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-slate-600 font-medium">Impossible de charger l'éditeur</p>
            <p className="text-sm text-slate-400 max-w-md text-center">
              {(error as { response?: { data?: { error?: string } } })?.response?.data?.error
                ?? 'Vérifiez que le serveur OnlyOffice est accessible et que la configuration est correcte.'}
            </p>
            <p className="text-xs text-slate-400">
              Configurez <code className="bg-surface-100 px-1 rounded">ONLYOFFICE_DOC_SERVER</code> et{' '}
              <code className="bg-surface-100 px-1 rounded">ONLYOFFICE_JWT_SECRET</code> dans le fichier <code>.env</code> du backend.
            </p>
            <button onClick={onClose} className="btn-secondary mt-2">Fermer</button>
          </div>
        )}

        {data && (
          <DocumentEditor
            id={`onlyoffice-editor-${documentId}`}
            documentServerUrl={data.documentServerUrl}
            config={data.config as any}
            onLoadComponentError={(code: number, desc: string) => {
              console.error('[OnlyOffice] Load error', code, desc)
            }}
            height="100%"
            width="100%"
          />
        )}
      </div>
    </div>
  )
}
