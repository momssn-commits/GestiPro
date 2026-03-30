import { apiClient } from './client'
import type {
  Attestation, ValidationRequest, PaginatedResponse,
  UpdateProfilePayload, CreateValidationPayload,
} from '@/lib/types'

export const rhApi = {
  // ─── Profile ────────────────────────────────────────────────────────────────
  getMyProfile: async () => {
    const { data } = await apiClient.get('/rh/profile/me')
    return data
  },

  updateMyProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await apiClient.patch('/rh/profile/me', payload)
    return data
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const { data } = await apiClient.post('/rh/profile/change-password', payload)
    return data
  },

  // ─── Attestations ────────────────────────────────────────────────────────────
  getAttestations: async (params?: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Attestation>>('/rh/attestations', { params })
    return data
  },

  createAttestation: async (payload: { type: Attestation['type']; comments?: string }) => {
    const { data } = await apiClient.post<Attestation>('/rh/attestations', payload)
    return data
  },

  deleteAttestation: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/rh/attestations/${id}`)
    return data
  },

  downloadAttestation: (id: string) =>
    `${apiClient.defaults.baseURL}/rh/attestations/${id}/download`,

  // ─── Validations ─────────────────────────────────────────────────────────────
  getMyDemandes: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<ValidationRequest>>('/rh/mes-demandes', { params })
    return data
  },

  getValidations: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await apiClient.get<PaginatedResponse<ValidationRequest>>('/rh/validations', { params })
    return data
  },

  createValidationRequest: async (payload: CreateValidationPayload): Promise<ValidationRequest> => {
    const { data } = await apiClient.post<ValidationRequest>('/rh/validations', payload)
    return data
  },

  approveValidation: async (id: string, comments?: string) => {
    const { data } = await apiClient.post(`/rh/validations/${id}/approve`, { comments })
    return data
  },

  rejectValidation: async (id: string, reason: string) => {
    const { data } = await apiClient.post(`/rh/validations/${id}/reject`, { reason })
    return data
  },

  deleteValidationRequest: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/rh/validations/${id}`)
    return data
  },
}
