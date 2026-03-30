import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'rh' | 'manager' | 'employee'
  department?: string
  avatarUrl?: string
}

interface AuthState {
  user: User | null
  token: string | null
  _hydrated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hydrated: false,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'gestipro-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)
