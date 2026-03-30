import { apiClient } from './client'
import type { Document, PaginatedResponse, UpdateDocumentPayload } from '@/lib/types'

export const documentsApi = {
  getDocuments: async (params?: {
    page?: number; limit?: number; category?: string; status?: string
    folderId?: string; serviceId?: string; userId?: string; search?: string
  }) => {
    const { data } = await apiClient.get<PaginatedResponse<Document>>('/documents', { params })
    return data
  },

  getDocument: async (id: string) => {
    const { data } = await apiClient.get<Document>(`/documents/${id}`)
    return data
  },

  uploadDocument: async (formData: FormData, onProgress?: (pct: number) => void) => {
    const { data } = await apiClient.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
    return data
  },

  updateDocument: async (id: string, payload: UpdateDocumentPayload): Promise<Document> => {
    const { data } = await apiClient.patch<Document>(`/documents/${id}`, payload)
    return data
  },

  deleteDocument: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/documents/${id}`)
    return data
  },

  advanceWorkflow: async (id: string, comments?: string) => {
    const { data } = await apiClient.post(`/documents/${id}/workflow/advance`, { comments })
    return data
  },

  rejectDocument: async (id: string, reason: string) => {
    const { data } = await apiClient.post(`/documents/${id}/workflow/reject`, { reason })
    return data
  },

  getStats: async () => {
    const { data } = await apiClient.get('/documents/stats')
    return data
  },

  downloadDocument: (id: string) =>
    `${apiClient.defaults.baseURL}/documents/${id}/download`,
}
