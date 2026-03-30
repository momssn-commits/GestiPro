import { apiClient } from './client'
import type { Folder, CreateFolderPayload, UpdateFolderPayload } from '@/lib/types'

export const foldersApi = {
  listFolders: async (params?: { serviceId?: string }): Promise<Folder[]> => {
    const { data } = await apiClient.get<Folder[]>('/folders', { params })
    return data
  },

  getFolderContents: async (id: string, params?: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get<{
      subfolders: Folder[]
      documents: unknown[]
    }>(`/folders/${id}`, { params })
    return data
  },

  createFolder: async (payload: CreateFolderPayload): Promise<Folder> => {
    const { data } = await apiClient.post<Folder>('/folders', payload)
    return data
  },

  updateFolder: async (id: string, payload: UpdateFolderPayload): Promise<Folder> => {
    const { data } = await apiClient.patch<Folder>(`/folders/${id}`, payload)
    return data
  },

  deleteFolder: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/folders/${id}`)
    return data
  },
}
