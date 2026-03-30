import { apiClient } from './client'
import type {
  Formation, FormationModule, PaginatedResponse,
  CreateFormationPayload, UpdateFormationPayload,
  CreateModulePayload, UpdateModulePayload,
} from '@/lib/types'

export const formationApi = {
  // ─── Catalog & enrollments ────────────────────────────────────────────────
  getCatalog: async (params?: {
    page?: number; limit?: number; category?: string; level?: string; search?: string
  }) => {
    const { data } = await apiClient.get<PaginatedResponse<Formation>>('/formation/catalog', { params })
    return data
  },

  getFormation: async (id: string) => {
    const { data } = await apiClient.get<Formation>(`/formation/${id}`)
    return data
  },

  getMyFormations: async () => {
    const { data } = await apiClient.get<Formation[]>('/formation/my-enrollments')
    return data
  },

  enroll: async (id: string) => {
    const { data } = await apiClient.post(`/formation/${id}/enroll`)
    return data
  },

  unenroll: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/formation/${id}/enroll`)
    return data
  },

  updateProgress: async (id: string, moduleId: string, completed: boolean) => {
    const { data } = await apiClient.patch(`/formation/${id}/progress`, { moduleId, completed })
    return data
  },

  // ─── Admin CRUD formations ────────────────────────────────────────────────
  createFormation: async (payload: CreateFormationPayload): Promise<Formation> => {
    const { data } = await apiClient.post<Formation>('/formation', payload)
    return data
  },

  updateFormation: async (id: string, payload: UpdateFormationPayload): Promise<Formation> => {
    const { data } = await apiClient.patch<Formation>(`/formation/${id}`, payload)
    return data
  },

  deleteFormation: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/formation/${id}`)
    return data
  },

  // ─── Admin CRUD modules ───────────────────────────────────────────────────
  createModule: async (formationId: string, payload: CreateModulePayload): Promise<FormationModule> => {
    const { data } = await apiClient.post<FormationModule>(`/formation/${formationId}/modules`, payload)
    return data
  },

  updateModule: async (
    formationId: string,
    moduleId: string,
    payload: UpdateModulePayload
  ): Promise<FormationModule> => {
    const { data } = await apiClient.patch<FormationModule>(
      `/formation/${formationId}/modules/${moduleId}`,
      payload
    )
    return data
  },

  deleteModule: async (formationId: string, moduleId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(
      `/formation/${formationId}/modules/${moduleId}`
    )
    return data
  },
}
