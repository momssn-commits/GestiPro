import { apiClient } from './client'
import type { Service, CreateServicePayload, UpdateServicePayload } from '@/lib/types'

export const servicesApi = {
  listServices: async (params?: { search?: string }): Promise<Service[]> => {
    const { data } = await apiClient.get<Service[]>('/services', { params })
    return data
  },

  getService: async (id: string): Promise<Service> => {
    const { data } = await apiClient.get<Service>(`/services/${id}`)
    return data
  },

  createService: async (payload: CreateServicePayload): Promise<Service> => {
    const { data } = await apiClient.post<Service>('/services', payload)
    return data
  },

  updateService: async (id: string, payload: UpdateServicePayload): Promise<Service> => {
    const { data } = await apiClient.patch<Service>(`/services/${id}`, payload)
    return data
  },

  deleteService: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/services/${id}`)
    return data
  },

  assignMember: async (serviceId: string, userId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<{ message: string }>(`/services/${serviceId}/members`, { userId })
    return data
  },

  removeMember: async (serviceId: string, userId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/services/${serviceId}/members/${userId}`)
    return data
  },
}
