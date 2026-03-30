import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api/documents'
import type { UpdateDocumentPayload } from '@/lib/types'
import toast from 'react-hot-toast'

export function useDocuments(params?: {
  page?: number; limit?: number; category?: string; status?: string
  folderId?: string; serviceId?: string; userId?: string; search?: string
}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn:  () => documentsApi.getDocuments(params),
    retry:    false,
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn:  () => documentsApi.getDocument(id),
    enabled:  !!id,
    retry:    false,
  })
}

export function useDocumentStats() {
  return useQuery({
    queryKey:  ['documents', 'stats'],
    queryFn:   () => documentsApi.getStats(),
    staleTime: 5 * 60 * 1000,
    retry:     false,
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formData, onProgress }: {
      formData: FormData
      onProgress?: (pct: number) => void
    }) => documentsApi.uploadDocument(formData, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document déposé avec succès')
    },
    onError: () => toast.error('Erreur lors du dépôt'),
  })
}

export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDocumentPayload }) =>
      documentsApi.updateDocument(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document mis à jour')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la mise à jour')
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document supprimé')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la suppression')
    },
  })
}

export function useAdvanceWorkflow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      documentsApi.advanceWorkflow(id, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document avancé dans le workflow')
    },
    onError: () => toast.error("Erreur lors de l'avancement"),
  })
}

export function useRejectDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      documentsApi.rejectDocument(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document refusé')
    },
    onError: () => toast.error('Erreur lors du refus'),
  })
}
