'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, X, File, CheckCircle, AlertCircle,
  Users, FolderOpen, FileInput, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { documentsApi } from '@/lib/api/documents'
import { useServices } from '@/hooks/useServices'
import { useFolders } from '@/hooks/useFolders'
import { useQueryClient } from '@tanstack/react-query'
import type { Folder } from '@/lib/types'
import toast from 'react-hot-toast'

interface UploadFile {
  file: File
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
  error?: string
}

// Flatten folder tree for <select>
function flattenFolders(
  folders: Folder[],
  depth = 0,
): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = []
  for (const f of folders) {
    result.push({ id: f.id, name: f.name, depth })
    if (f.children?.length) result.push(...flattenFolders(f.children, depth + 1))
  }
  return result
}

function buildTree(list: Folder[]): Folder[] {
  const map: Record<string, Folder> = {}
  list.forEach(f => { map[f.id] = { ...f, children: [] } })
  const roots: Folder[] = []
  list.forEach(f => {
    if (f.parentId && map[f.parentId]) map[f.parentId].children!.push(map[f.id])
    else roots.push(map[f.id])
  })
  return roots
}

export function ContratImport() {
  const [open, setOpen]               = useState(false)
  const qc                            = useQueryClient()
  const [files, setFiles]             = useState<UploadFile[]>([])
  const [serviceId, setServiceId]     = useState('')
  const [folderId, setFolderId]       = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading]     = useState(false)

  const { data: servicesData } = useServices()
  const { data: foldersFlat = [] } = useFolders()
  const services  = Array.isArray(servicesData) ? servicesData : []
  const folderList = flattenFolders(buildTree(foldersFlat))

  const onDrop = useCallback((accepted: File[], rejected: import('react-dropzone').FileRejection[]) => {
    const newFiles: UploadFile[] = accepted.map(f => ({
      file: f, progress: 0, status: 'idle',
    }))
    setFiles(prev => [...prev, ...newFiles])
    rejected.forEach(r => {
      toast.error(`Fichier rejeté : ${r.file.name} (${r.errors[0]?.message ?? 'format non supporté'})`)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 25 * 1024 * 1024,
    maxFiles: 20,
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const importAll = async () => {
    const pending = files.filter(f => f.status === 'idle')
    if (pending.length === 0) return
    setUploading(true)

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'idle') continue
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      try {
        const fd = new FormData()
        fd.append('file',     files[i].file)
        fd.append('category', 'contrat')
        if (serviceId)   fd.append('serviceId',   serviceId)
        if (folderId)    fd.append('folderId',     folderId)
        if (description) fd.append('description', description)
        await documentsApi.uploadDocument(fd, (pct) => {
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress: pct } : f))
        })
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', progress: 100 } : f))
      } catch {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: 'Échec du téléversement' } : f))
      }
    }

    setUploading(false)
    qc.invalidateQueries({ queryKey: ['documents'] })

    const doneCount  = files.filter(f => f.status === 'done').length  + pending.length
    const errorCount = files.filter(f => f.status === 'error').length
    if (errorCount === 0) {
      toast.success(`${pending.length} contrat${pending.length > 1 ? 's' : ''} importé${pending.length > 1 ? 's' : ''} avec succès`)
    } else {
      toast.error(`${errorCount} fichier${errorCount > 1 ? 's' : ''} en erreur`)
    }
  }

  const reset = () => {
    setFiles([])
    setServiceId('')
    setFolderId('')
    setDescription('')
    setOpen(false)
  }

  const pendingCount = files.filter(f => f.status === 'idle').length
  const doneCount    = files.filter(f => f.status === 'done').length
  const allDone      = files.length > 0 && files.every(f => f.status === 'done')

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary">
        <FileInput className="w-4 h-4" />
        Importer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Importer des contrats</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Importez vos fichiers de contrats existants
                </p>
              </div>
              <button onClick={reset} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Service + Dossier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Service
                  </label>
                  <select
                    value={serviceId}
                    onChange={e => setServiceId(e.target.value)}
                    className="input text-sm py-1.5"
                  >
                    <option value="">— Tous —</option>
                    {services.map((s: { id: string; name: string }) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" /> Répertoire
                  </label>
                  <select
                    value={folderId}
                    onChange={e => setFolderId(e.target.value)}
                    className="input text-sm py-1.5"
                  >
                    <option value="">— Aucun —</option>
                    {folderList.map(f => (
                      <option key={f.id} value={f.id}>
                        {'  '.repeat(f.depth)}{f.depth > 0 ? '└ ' : ''}{f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Contrats annuels 2024, Contrats de prestation…"
                  className="input text-sm py-1.5"
                />
              </div>

              {/* Drop zone */}
              <div
                {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-slate-200 hover:border-slate-300 text-slate-500'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-sm">
                  {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez ou cliquez pour sélectionner'}
                </p>
                <p className="text-xs mt-1 text-slate-400">PDF, Word, Excel, Images — max 25 Mo par fichier</p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 border border-surface-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
                    {doneCount > 0 && ` — ${doneCount} importé${doneCount > 1 ? 's' : ''}`}
                  </p>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <File className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">{f.file.name}</p>
                        <p className="text-xs text-slate-400">
                          {(f.file.size / 1024).toFixed(0)} Ko
                        </p>
                        {f.status === 'uploading' && (
                          <div className="h-1 bg-surface-200 rounded-full mt-1">
                            <div
                              className="h-1 bg-brand rounded-full transition-all"
                              style={{ width: `${f.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {f.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-brand animate-spin flex-shrink-0" />}
                      {f.status === 'done'      && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                      {f.status === 'error'     && (
                        <span className="flex items-center gap-1 text-red-500 text-xs flex-shrink-0">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Erreur
                        </span>
                      )}
                      {f.status === 'idle' && (
                        <button
                          onClick={() => removeFile(i)}
                          className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
              <p className="text-xs text-slate-400">
                {allDone
                  ? `✅ ${doneCount} contrat${doneCount > 1 ? 's' : ''} importé${doneCount > 1 ? 's' : ''}`
                  : pendingCount > 0
                  ? `${pendingCount} fichier${pendingCount > 1 ? 's' : ''} à importer`
                  : 'Sélectionnez des fichiers'}
              </p>
              <div className="flex gap-2">
                <button onClick={reset} className="btn-secondary text-sm py-1.5">
                  {allDone ? 'Fermer' : 'Annuler'}
                </button>
                {!allDone && (
                  <button
                    onClick={importAll}
                    disabled={pendingCount === 0 || uploading}
                    className="btn-primary text-sm py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Importation…</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Importer {pendingCount > 0 ? pendingCount : ''}</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
