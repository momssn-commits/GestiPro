import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

// ─── snake_case → camelCase (transforme toutes les réponses du backend) ────────
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelizeKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(camelizeKeys)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [toCamel(k), camelizeKeys(v)])
    )
  }
  return obj
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
})

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('gestipro_token') ||
    (typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('gestipro-auth') || '{}')?.state?.token
      : null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => {
    // Transforme snake_case → camelCase sur toutes les réponses
    if (res.data && typeof res.data === 'object') {
      res.data = camelizeKeys(res.data)
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      // Ne redirige pas si on est déjà sur /login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('gestipro-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
