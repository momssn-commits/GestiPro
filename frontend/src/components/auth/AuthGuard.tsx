'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

// Routes interdites aux employés
const EMPLOYEE_BLOCKED = ['/documents', '/formation', '/admin']

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore()
  const router   = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return
    if (!token) { router.replace('/login'); return }
    // Redirige les employés vers leur espace RH si tentative d'accès interdit
    if (user?.role === 'employee') {
      const blocked = EMPLOYEE_BLOCKED.some(p => pathname.startsWith(p))
      if (blocked) router.replace('/rh/dossier')
    }
  }, [token, user, mounted, pathname, router])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!token) return null
  return <>{children}</>
}
