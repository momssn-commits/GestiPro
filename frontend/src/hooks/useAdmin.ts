import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, CreateUserPayload, UpdateUserPayload } from '@/lib/api/admin'
import toast from 'react-hot-toast'

export function useAdminUsers(params?: { page?: number; search?: string; role?: string }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn:  () => adminApi.listUsers({ limit: 100, ...params }),
    retry:    false,
    staleTime: 30_000,
  })
}

export function useCreateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => adminApi.createUser(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Utilisateur créé avec succès')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la création')
    },
  })
}

export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Utilisateur mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })
}

export function useToggleAdminUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
    onError: () => toast.error('Erreur lors du changement de statut'),
  })
}

export function useDeleteAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Utilisateur supprimé')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la suppression')
    },
  })
}
