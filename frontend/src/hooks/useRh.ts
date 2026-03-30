import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rhApi } from '@/lib/api/rh'
import type { UpdateProfilePayload, CreateValidationPayload } from '@/lib/types'
import toast from 'react-hot-toast'

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: ['rh', 'profile'],
    queryFn:  () => rhApi.getMyProfile(),
    retry:    false,
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => rhApi.updateMyProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'profile'] })
      toast.success('Profil mis à jour avec succès')
    },
    onError: () => toast.error('Erreur lors de la mise à jour du profil'),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      rhApi.changePassword(payload),
    onSuccess: () => toast.success('Mot de passe modifié avec succès'),
    onError:   (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors du changement de mot de passe')
    },
  })
}

// ─── Attestations ─────────────────────────────────────────────────────────────

export function useAttestations(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['rh', 'attestations', page, limit],
    queryFn:  () => rhApi.getAttestations({ page, limit }),
    retry:    false,
  })
}

export function useCreateAttestation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: rhApi.createAttestation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'attestations'] })
      toast.success("Demande d'attestation soumise avec succès")
    },
    onError: () => toast.error('Erreur lors de la soumission'),
  })
}

export function useDeleteAttestation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rhApi.deleteAttestation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'attestations'] })
      toast.success('Attestation supprimée')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la suppression')
    },
  })
}

// ─── Validations ──────────────────────────────────────────────────────────────

export function useMyDemandes(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['rh', 'mes-demandes', params],
    queryFn:  () => rhApi.getMyDemandes(params),
    retry:    false,
  })
}

export function useValidations(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['rh', 'validations', params],
    queryFn:  () => rhApi.getValidations(params),
    retry:    false,
  })
}

export function useCreateValidationRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateValidationPayload) => rhApi.createValidationRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'validations'] })
      toast.success('Demande de validation créée')
    },
    onError: () => toast.error('Erreur lors de la création de la demande'),
  })
}

export function useApproveValidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      rhApi.approveValidation(id, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'validations'] })
      toast.success('Demande approuvée')
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  })
}

export function useRejectValidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rhApi.rejectValidation(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'validations'] })
      toast.success('Demande refusée')
    },
    onError: () => toast.error('Erreur lors du refus'),
  })
}

export function useDeleteValidationRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rhApi.deleteValidationRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rh', 'validations'] })
      toast.success('Demande supprimée')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la suppression')
    },
  })
}
