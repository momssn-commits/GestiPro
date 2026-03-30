import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicesApi } from '@/lib/api/services'
import type { CreateServicePayload, UpdateServicePayload } from '@/lib/types'
import toast from 'react-hot-toast'

export function useServices(params?: { search?: string }) {
  return useQuery({
    queryKey: ['services', params],
    queryFn:  () => servicesApi.listServices(params),
    retry:    false,
  })
}

export function useService(id: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn:  () => servicesApi.getService(id),
    enabled:  !!id,
    retry:    false,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateServicePayload) => servicesApi.createService(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service créé avec succès')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la création')
    },
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServicePayload }) =>
      servicesApi.updateService(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['services'] })
      qc.invalidateQueries({ queryKey: ['services', id] })
      toast.success('Service mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      toast.success('Service supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })
}

export function useAssignMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, userId }: { serviceId: string; userId: string }) =>
      servicesApi.assignMember(serviceId, userId),
    onSuccess: (_, { serviceId }) => {
      qc.invalidateQueries({ queryKey: ['services', serviceId] })
      qc.invalidateQueries({ queryKey: ['services'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Membre affecté au service')
    },
    onError: () => toast.error("Erreur lors de l'affectation"),
  })
}

export function useRemoveMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ serviceId, userId }: { serviceId: string; userId: string }) =>
      servicesApi.removeMember(serviceId, userId),
    onSuccess: (_, { serviceId }) => {
      qc.invalidateQueries({ queryKey: ['services', serviceId] })
      qc.invalidateQueries({ queryKey: ['services'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Membre retiré du service')
    },
    onError: () => toast.error('Erreur lors du retrait'),
  })
}
