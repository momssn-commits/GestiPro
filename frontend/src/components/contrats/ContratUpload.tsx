'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, CheckCircle, Users, FileSignature } from 'lucide-react'
import { clsx } from 'clsx'
import { documentsApi } from '@/lib/api/documents'
import { useServices } from '@/hooks/useServices'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface UploadFile {
  file: File
  progress: number
  status: 'idle' | 'uploading' | 'done' | 'error'
}

export function ContratUpload() {
  const [open, setOpen]               = useState(false)
  const qc                            = useQueryClient()
  const [files, setFiles]             = useState<UploadFile[]>([])
  const [serviceId, setServiceId]     = useState('')
  const [description, setDescription] = useState('')

  const { data: servicesData } = useServices()
  const services = Array.isArray(servicesData) ? servicesData : []

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: UploadFile[] = accepted.map(f => ({
      file: f, progress: 0, status: 'idle',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 25 * 1024 * 1024,
  })

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== 'idle') continue
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      try {
        const fd = new FormData()
        fd.append('file', files[i].file)
        fd.append('category', 'contrat')
        if (serviceId)   fd.append('serviceId', serviceId)
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
    toast.success('Contrat(s) déposé(s) avec succès')
  }

  const pendingCount = files.filter(f => f.status === 'idle').length

  const reset = () => {
    setFiles([])
    setServiceId('')
    setDescription('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <FileSignature className="w-4 h-4" />
        Déposer un contrat
      </button>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Déposer un contrat</h3>
        <button onClick={reset} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Service */}
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

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ex: Contrat de prestation, Contrat de travail..."
          className="input text-sm py-1.5"
        />
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          isDragActive
            ? 'border-brand bg-brand/5 text-brand'
            : 'border-slate-200 hover:border-surface-400 text-slate-500'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-7 h-7 mx-auto mb-2 opacity-60" />
        <p className="font-medium text-sm">
          {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos contrats'}
        </p>
        <p className="text-xs mt-1 text-slate-400">PDF, Word, Excel, Images — max 25 Mo</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2 border-t border-surface-200 pt-3">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600 truncate">{f.file.name}</p>
                {f.status === 'uploading' && (
                  <div className="h-1 bg-surface-300 rounded-full mt-1">
                    <div className="h-1 bg-brand rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                  </div>
                )}
              </div>
              {f.status === 'done' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
              {f.status === 'idle' && (
                <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {pendingCount > 0 && (
            <button onClick={uploadAll} className="btn-primary mt-2">
              <Upload className="w-4 h-4" />
              Déposer {pendingCount} contrat{pendingCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
