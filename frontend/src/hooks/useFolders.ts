import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { foldersApi } from '@/lib/api/folders'
import type { CreateFolderPayload, UpdateFolderPayload } from '@/lib/types'
import toast from 'react-hot-toast'

export function useFolders(params?: { serviceId?: string }) {
  return useQuery({
    queryKey: ['folders', params],
    queryFn:  () => foldersApi.listFolders(params),
    retry:    false,
    staleTime: 60_000,
  })
}

export function useFolderContents(id: string | null) {
  return useQuery({
    queryKey: ['folders', id, 'contents'],
    queryFn:  () => foldersApi.getFolderContents(id!),
    enabled:  !!id,
    retry:    false,
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFolderPayload) => foldersApi.createFolder(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      toast.success('Dossier créé')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la création du dossier')
    },
  })
}

export function useUpdateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFolderPayload }) =>
      foldersApi.updateFolder(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      toast.success('Dossier mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })
}

export function useDeleteFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => foldersApi.deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders'] })
      qc.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Dossier supprimé')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la suppression')
    },
  })
}
