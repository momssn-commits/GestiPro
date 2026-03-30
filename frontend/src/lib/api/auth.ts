import { apiClient } from './client'
import type { User } from '@/store/auth'

interface LoginPayload { email: string; password: string }
interface AuthResponse { user: User; token: string }

// ─── Comptes de développement (sans backend) ──────────────────────────────────
const DEV_ACCOUNTS: Record<string, AuthResponse> = {
  'momar.mbaye@ifs.sn:Technique@2026': {
    token: 'dev-token-momar-mbaye',
    user: {
      id: 'uuid-momar-mbaye',
      email: 'momar.mbaye@ifs.sn',
      firstName: 'Momar',
      lastName: 'Mbaye',
      role: 'admin',
      department: "Direction des Systèmes d'Information",
    },
  },
  'admin@gestipro.dz:Admin@1234': {
    token: 'dev-token-admin',
    user: {
      id: 'uuid-admin',
      email: 'admin@gestipro.dz',
      firstName: 'Admin',
      lastName: 'GestiPro',
      role: 'admin',
      department: 'Direction Générale',
    },
  },
  'omar.sow@ifs.sn:Technique@2026': {
    token: 'dev-token-omar-sow',
    user: {
      id: 'uuid-omar-sow',
      email: 'omar.sow@ifs.sn',
      firstName: 'Omar',
      lastName: 'Sow',
      role: 'employee',
      department: "Direction des Systèmes d'Information",
    },
  },
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // Essaie d'abord l'API réelle
    try {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
      return data
    } catch (err: unknown) {
      // Fallback local : vérifie les comptes hardcodés
      const key = `${payload.email}:${payload.password}`
      const devAccount = DEV_ACCOUNTS[key]
      if (devAccount) return devAccount

      // Fallback local : vérifie les comptes créés dynamiquement (localStorage)
      try {
        const stored = localStorage.getItem('gestipro_credentials')
        if (stored) {
          const creds = JSON.parse(stored) as Record<string, { password: string; user: User }>
          const entry = creds[payload.email]
          if (entry && entry.password === payload.password) {
            return { token: `dev-token-${payload.email}`, user: entry.user }
          }
        }
      } catch { /* ignore */ }

      throw err
    }
  },
  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },
}
