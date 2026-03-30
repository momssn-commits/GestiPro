import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formationApi } from '@/lib/api/formation'
import type {
  CreateFormationPayload, UpdateFormationPayload,
  CreateModulePayload, UpdateModulePayload,
} from '@/lib/types'
import toast from 'react-hot-toast'

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useFormationCatalog(params?: {
  page?: number; limit?: number; category?: string; level?: string; search?: string
}) {
  return useQuery({
    queryKey: ['formation', 'catalog', params],
    queryFn:  () => formationApi.getCatalog(params),
    retry:    false,
  })
}

export function useFormation(id: string) {
  return useQuery({
    queryKey: ['formation', id],
    queryFn:  () => formationApi.getFormation(id),
    enabled:  !!id,
    retry:    false,
  })
}

export function useMyFormations() {
  return useQuery({
    queryKey: ['formation', 'my-enrollments'],
    queryFn:  () => formationApi.getMyFormations(),
    retry:    false,
  })
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export function useEnroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formationApi.enroll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation'] })
      toast.success('Inscription confirmée !')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || "Erreur lors de l'inscription")
    },
  })
}

export function useUnenroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formationApi.unenroll(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation'] })
      toast.success('Désinscription effectuée')
    },
    onError: () => toast.error('Erreur lors de la désinscription'),
  })
}

export function useUpdateProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, moduleId, completed }: {
      id: string; moduleId: string; completed: boolean
    }) => formationApi.updateProgress(id, moduleId, completed),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation'] })
    },
  })
}

// ─── Admin: CRUD formations ───────────────────────────────────────────────────

export function useCreateFormation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFormationPayload) => formationApi.createFormation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation', 'catalog'] })
      toast.success('Formation créée avec succès')
    },
    onError: () => toast.error('Erreur lors de la création'),
  })
}

export function useUpdateFormation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFormationPayload }) =>
      formationApi.updateFormation(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['formation', 'catalog'] })
      qc.invalidateQueries({ queryKey: ['formation', id] })
      toast.success('Formation mise à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })
}

export function useDeleteFormation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => formationApi.deleteFormation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation', 'catalog'] })
      toast.success('Formation supprimée')
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  })
}

// ─── Admin: CRUD modules ──────────────────────────────────────────────────────

export function useCreateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formationId, payload }: {
      formationId: string; payload: CreateModulePayload
    }) => formationApi.createModule(formationId, payload),
    onSuccess: (_, { formationId }) => {
      qc.invalidateQueries({ queryKey: ['formation', formationId] })
      toast.success('Module ajouté')
    },
    onError: () => toast.error("Erreur lors de l'ajout du module"),
  })
}

export function useUpdateModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formationId, moduleId, payload }: {
      formationId: string; moduleId: string; payload: UpdateModulePayload
    }) => formationApi.updateModule(formationId, moduleId, payload),
    onSuccess: (_, { formationId }) => {
      qc.invalidateQueries({ queryKey: ['formation', formationId] })
      toast.success('Module mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour du module'),
  })
}

export function useDeleteModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formationId, moduleId }: { formationId: string; moduleId: string }) =>
      formationApi.deleteModule(formationId, moduleId),
    onSuccess: (_, { formationId }) => {
      qc.invalidateQueries({ queryKey: ['formation', formationId] })
      toast.success('Module supprimé')
    },
    onError: () => toast.error('Erreur lors de la suppression du module'),
  })
}
