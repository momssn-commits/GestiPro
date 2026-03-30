import { apiClient } from './client'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'rh' | 'manager' | 'employee'
  department?: string
  jobTitle?: string
  grade?: string
  contractType?: string
  phone?: string
  hireDate?: string
  isActive: boolean
  createdAt?: string
  serviceId?: string
  serviceName?: string
  serviceCode?: string
}

export interface UsersListResponse {
  data: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: AdminUser['role']
  department?: string
  jobTitle?: string
  serviceId?: string | null
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  role?: AdminUser['role']
  department?: string
  jobTitle?: string
  grade?: string
  contractType?: string
  phone?: string
  hireDate?: string
  newPassword?: string
  serviceId?: string | null
}

export const adminApi = {
  listUsers: async (params?: {
    page?: number; limit?: number; search?: string; role?: string
  }): Promise<UsersListResponse> => {
    const { data } = await apiClient.get<UsersListResponse>('/admin/users', { params })
    return data
  },

  createUser: async (payload: CreateUserPayload): Promise<AdminUser> => {
    const { data } = await apiClient.post<AdminUser>('/admin/users', payload)
    return data
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<AdminUser> => {
    const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}`, payload)
    return data
  },

  toggleStatus: async (id: string): Promise<{ id: string; isActive: boolean }> => {
    const { data } = await apiClient.patch<{ id: string; isActive: boolean }>(`/admin/users/${id}/toggle`)
    return data
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/admin/users/${id}`)
    return data
  },
}
