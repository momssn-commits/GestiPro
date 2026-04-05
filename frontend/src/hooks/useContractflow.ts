import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractflowApi } from '@/lib/api/contractflow'
import type { CreateActePayload, UpdateActePayload, ActeTransitionPayload } from '@/lib/types'
import toast from 'react-hot-toast'

const QK = 'contractflow'

// ── Lecture ───────────────────────────────────────────────────────────────────

export function useActes(params?: {
  page?: number; limit?: number
  statut?: string; type?: string; service?: string; search?: string
}) {
  return useQuery({
    queryKey:  [QK, 'list', params],
    queryFn:   () => contractflowApi.getActes(params),
    staleTime: 30_000,
    retry:     false,
  })
}

export function useActe(id: string) {
  return useQuery({
    queryKey: [QK, id],
    queryFn:  () => contractflowApi.getActe(id),
    enabled:  !!id,
    retry:    false,
  })
}

export function useActeStats() {
  return useQuery({
    queryKey:  [QK, 'stats'],
    queryFn:   () => contractflowApi.getStats(),
    staleTime: 60_000,
    retry:     false,
  })
}

export function useActeHistory(id: string) {
  return useQuery({
    queryKey: [QK, id, 'history'],
    queryFn:  () => contractflowApi.getHistory(id),
    enabled:  !!id,
    retry:    false,
  })
}

export function useActeComments(id: string) {
  return useQuery({
    queryKey:  [QK, id, 'comments'],
    queryFn:   () => contractflowApi.getComments(id),
    enabled:   !!id,
    retry:     false,
    refetchInterval: 15_000,  // pooling léger pour la collaboration
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateActe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateActePayload) => contractflowApi.createActe(payload),
    onSuccess: (acte) => {
      qc.invalidateQueries({ queryKey: [QK] })
      toast.success(`Acte ${acte.numero} créé avec succès`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la création')
    },
  })
}

export function useUpdateActe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateActePayload }) =>
      contractflowApi.updateActe(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] })
      toast.success('Acte mis à jour')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la mise à jour')
    },
  })
}

export function useTransitionActe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ActeTransitionPayload }) =>
      contractflowApi.transition(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [QK] })
      const labels: Record<string, string> = {
        brouillon: 'remis en brouillon',
        en_instruction: 'transmis en instruction',
        en_validation: 'transmis en validation',
        signe: 'signé',
        archive: 'archivé',
        rejete: 'rejeté',
      }
      toast.success(`Acte ${labels[data.statut] ?? 'mis à jour'}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg ?? 'Erreur lors de la transition')
    },
  })
}

export function useAddComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      contractflowApi.addComment(id, content),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QK, id, 'comments'] })
    },
    onError: () => toast.error("Erreur lors de l'envoi du commentaire"),
  })
}
