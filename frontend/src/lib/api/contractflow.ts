import { apiClient } from './client'
import type {
  Acte, ActeHistory, ActeComment, ActeStats,
  CreateActePayload, UpdateActePayload, ActeTransitionPayload,
  PaginatedResponse,
} from '@/lib/types'

export const contractflowApi = {
  // ── Actes ──────────────────────────────────────────────────────────────────
  getActes: async (params?: {
    page?: number; limit?: number
    statut?: string; type?: string; service?: string; search?: string
  }) => {
    const { data } = await apiClient.get<PaginatedResponse<Acte>>('/contractflow', { params })
    return data
  },

  getActe: async (id: string) => {
    const { data } = await apiClient.get<Acte>(`/contractflow/${id}`)
    return data
  },

  createActe: async (payload: CreateActePayload) => {
    const { data } = await apiClient.post<Acte>('/contractflow', payload)
    return data
  },

  updateActe: async (id: string, payload: UpdateActePayload) => {
    const { data } = await apiClient.patch<Acte>(`/contractflow/${id}`, payload)
    return data
  },

  transition: async (id: string, payload: ActeTransitionPayload) => {
    const { data } = await apiClient.post<{ message: string; statut: string }>(
      `/contractflow/${id}/transition`,
      payload
    )
    return data
  },

  // ── Historique ─────────────────────────────────────────────────────────────
  getHistory: async (id: string) => {
    const { data } = await apiClient.get<ActeHistory[]>(`/contractflow/${id}/history`)
    return data
  },

  // ── Commentaires ───────────────────────────────────────────────────────────
  getComments: async (id: string) => {
    const { data } = await apiClient.get<ActeComment[]>(`/contractflow/${id}/comments`)
    return data
  },

  addComment: async (id: string, content: string) => {
    const { data } = await apiClient.post<ActeComment>(`/contractflow/${id}/comments`, { content })
    return data
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  getStats: async () => {
    const { data } = await apiClient.get<ActeStats>('/contractflow/stats')
    return data
  },
}
