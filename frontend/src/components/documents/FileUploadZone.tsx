'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, CheckCircle, Folder, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { documentsApi } from '@/lib/api/documents'
import { useFolders } from '@/hooks/useFolders'
import { useServices } from '@/hooks/useServices'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'devis',    label: 'Devis' },
  { value: 'apd',     label: 'APD' },
  { value: 'facture', label: 'Facture' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'autre',   label: 'Autre' },
]

interface UploadFile {
  file: File
  category: string
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
}

interface Props {
  defaultFolderId?:   string | null
  defaultServiceId?:  string | null
}

// Aplatir l'arbre de dossiers en liste pour le <select>
function flattenFolders(folders: import('@/lib/types').Folder[], depth = 0): { id: string; name: string; depth: number }[] {
  const result: { id: string; name: string; depth: number }[] = []
  for (const f of folders) {
    result.push({ id: f.id, name: f.name, depth })
    if (f.children?.length) result.push(...flattenFolders(f.children, depth + 1))
  }
  return result
}

export function FileUploadZone({ defaultFolderId, defaultServiceId }: Props) {
  const qc = useQueryClient()
  const [files,       setFiles]       = useState<UploadFile[]>([])
  const [folderId,    setFolderId]    = useState<string>(defaultFolderId ?? '')
  const [serviceId,   setServiceId]   = useState<string>(defaultServiceId ?? '')
  const [description, setDescription] = useState<string>('')

  const { data: foldersFlat = [] } = useFolders()
  const { data: servicesData }     = useServices()

  // Construire l'arbre à la volée pour afficher l'indentation
  const folderList = flattenFolders(
    (function buildTree(list: import('@/lib/types').Folder[]): import('@/lib/types').Folder[] {
      const map: Record<string, import('@/lib/types').Folder> = {}
      list.forEach(f => { map[f.id] = { ...f, children: [] } })
      const roots: import('@/lib/types').Folder[] = []
      list.forEach(f => {
        if (f.parentId && map[f.parentId]) map[f.parentId].children!.push(map[f.id])
        else roots.push(map[f.id])
      })
      return roots
    })(foldersFlat)
  )

  const services = Array.isArray(servicesData) ? servicesData : []

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadFile[] = accepted.map(f => ({
      file: f, category: 'autre', progress: 0, status: 'idle',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 25 * 1024 * 1024,
  })

  const updateCategory = (index: number, category: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, category } : f))
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'idle') continue
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      try {
        const fd = new FormData()
        fd.append('file',     files[i].file)
        fd.append('category', files[i].category)
        if (folderId)    fd.append('folderId',    folderId)
        if (serviceId)   fd.append('serviceId',   serviceId)
        if (description) fd.append('description', description)
        await documentsApi.uploadDocument(fd, (pct) => {
          setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, progress: pct } : f))
        })
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', progress: 100 } : f))
      } catch {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f))
        toast.error(`Erreur lors du dépôt de ${files[i].file.name}`)
      }
    }
    qc.invalidateQueries({ queryKey: ['documents'] })
    toast.success('Documents déposés avec succès')
  }

  const pendingCount = files.filter(f => f.status === 'idle').length

  return (
    <div className="card space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Dépôt de fichiers</h3>

      {/* Classement */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
            <Folder className="w-3 h-3" /> Répertoire
          </label>
          <select
            value={folderId}
            onChange={e => setFolderId(e.target.value)}
            className="input text-sm py-1.5"
          >
            <option value="">— Aucun dossier —</option>
            {folderList.map(f => (
              <option key={f.id} value={f.id}>
                {'  '.repeat(f.depth)}{f.depth > 0 ? '└ ' : ''}{f.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> Service
          </label>
          <select
            value={serviceId}
            onChange={e => setServiceId(e.target.value)}
            className="input text-sm py-1.5"
          >
            <option value="">— Tous les services —</option>
            {services.map((s: { id: string; name: string }) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Description optionnelle */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Description (optionnelle)</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brève description du document…"
          className="input text-sm py-1.5"
        />
      </div>

      {/* Zone de dépôt */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-brand bg-brand/5 text-brand'
            : 'border-slate-200 hover:border-surface-400 text-slate-500 hover:text-slate-500'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" />
        <p className="font-medium text-sm">
          {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos fichiers'}
        </p>
        <p className="text-xs mt-1 text-slate-500">PDF, Word, Excel, Images — max 25 Mo</p>
      </div>

      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="space-y-2 border-t border-surface-200 pt-3">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600 truncate">{f.file.name}</p>
                {f.status === 'uploading' && (
                  <div className="h-1 bg-surface-300 rounded-full mt-1">
                    <div
                      className="h-1 bg-brand rounded-full transition-all"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <select
                value={f.category}
                onChange={e => updateCategory(i, e.target.value)}
                disabled={f.status !== 'idle'}
                className="input w-28 py-1 text-xs"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {f.status === 'done'  && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
              {f.status === 'idle'  && (
                <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {pendingCount > 0 && (
            <button onClick={uploadAll} className="btn-primary mt-2">
              <Upload className="w-4 h-4" />
              Déposer {pendingCount} fichier{pendingCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
