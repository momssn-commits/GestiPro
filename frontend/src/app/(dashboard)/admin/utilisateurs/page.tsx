'use client'

import { useState, useEffect } from 'react'
import { UsersTable } from '@/components/admin/UsersTable'
import { InviteUser } from '@/components/admin/InviteUser'
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useToggleAdminUserStatus } from '@/hooks/useAdmin'
import type { AdminUser } from '@/lib/api/admin'
import toast from 'react-hot-toast'

// Type local UI
export type AppUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  department: string
  active: boolean
  hireDate: string
  serviceId?: string
  serviceName?: string
  serviceCode?: string
}

// ─── Données initiales (fallback quand backend absent) ────────────────────────
const INITIAL_USERS: AppUser[] = [
  { id: '0', firstName: 'Momar', lastName: 'Mbaye',    email: 'momar.mbaye@ifs.sn', role: 'admin',    department: "Direction des Systèmes d'Information", active: true, hireDate: '01/01/2026' },
  { id: '1', firstName: 'Admin', lastName: 'GestiPro', email: 'admin@gestipro.dz',  role: 'admin',    department: 'Direction Générale',                  active: true, hireDate: '01/01/2020' },
  { id: '2', firstName: 'Omar',  lastName: 'Sow',      email: 'omar.sow@ifs.sn',    role: 'employee', department: "Direction des Systèmes d'Information", active: true, hireDate: '28/03/2026' },
]
const STORAGE_KEY = 'gestipro_users'

function mapApiUser(u: AdminUser): AppUser {
  return {
    id:          u.id,
    firstName:   u.firstName,
    lastName:    u.lastName,
    email:       u.email,
    role:        u.role,
    department:  u.department ?? '',
    active:      u.isActive,
    hireDate:    u.hireDate ? new Date(u.hireDate).toLocaleDateString('fr-FR') : '',
    serviceId:   u.serviceId,
    serviceName: u.serviceName,
    serviceCode: u.serviceCode,
  }
}

function loadLocal(): AppUser[] {
  if (typeof window === 'undefined') return INITIAL_USERS
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : INITIAL_USERS
  } catch { return INITIAL_USERS }
}

function saveLocal(users: AppUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]         = useState<AppUser[]>(loadLocal)
  const [backendOk, setBackendOk] = useState(false)

  // React Query — charge depuis le backend
  const { data: apiData, isSuccess, isError } = useAdminUsers()
  const createMutation  = useCreateAdminUser()
  const updateMutation  = useUpdateAdminUser()
  const toggleMutation  = useToggleAdminUserStatus()

  // Synchronise la liste locale avec les données API quand le backend répond
  useEffect(() => {
    if (isSuccess && apiData?.data) {
      const mapped = apiData.data.map(mapApiUser)
      setUsers(mapped)
      saveLocal(mapped)
      setBackendOk(true)
    }
    if (isError) setBackendOk(false)
  }, [isSuccess, isError, apiData])

  // Sauvegarde localStorage si backend absent
  useEffect(() => {
    if (!backendOk) saveLocal(users)
  }, [users, backendOk])

  // ── Créer utilisateur ──────────────────────────────────────────────────────
  const handleUserCreated = async (payload: {
    firstName: string; lastName: string; email: string
    role: string; department?: string; password: string; jobTitle?: string; serviceId?: string
  }) => {
    if (backendOk) {
      try {
        await createMutation.mutateAsync({
          email:      payload.email,
          password:   payload.password,
          firstName:  payload.firstName,
          lastName:   payload.lastName,
          role:       payload.role as AdminUser['role'],
          department: payload.department,
          jobTitle:   payload.jobTitle,
          serviceId:  payload.serviceId ?? null,
        })
        toast.success('Utilisateur créé avec succès')
        return
      } catch {
        toast.error('Erreur API — utilisateur enregistré localement')
      }
    }
    // Fallback local
    const newUser: AppUser = {
      id:         crypto.randomUUID(),
      firstName:  payload.firstName,
      lastName:   payload.lastName,
      email:      payload.email,
      role:       payload.role,
      department: payload.department ?? '',
      active:     true,
      hireDate:   new Date().toLocaleDateString('fr-FR'),
    }
    // Sauvegarde credentials pour connexion sans backend
    try {
      const creds = JSON.parse(localStorage.getItem('gestipro_credentials') || '{}')
      creds[payload.email] = {
        password: payload.password,
        user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName, role: newUser.role, department: newUser.department },
      }
      localStorage.setItem('gestipro_credentials', JSON.stringify(creds))
    } catch { /* ignore */ }

    setUsers(prev => [...prev, newUser])
    toast.success('Utilisateur créé avec succès')
  }

  // ── Toggle statut ──────────────────────────────────────────────────────────
  const handleToggleStatus = async (id: string) => {
    if (backendOk) {
      try {
        await toggleMutation.mutateAsync(id)
        return
      } catch { /* fallback */ }
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u))
  }

  // ── Modifier utilisateur ───────────────────────────────────────────────────
  const handleUpdateUser = async (id: string, data: Partial<AppUser> & { newPassword?: string; serviceId?: string }) => {
    if (backendOk) {
      try {
        await updateMutation.mutateAsync({
          id,
          data: {
            firstName:   data.firstName,
            lastName:    data.lastName,
            role:        data.role as AdminUser['role'],
            department:  data.department,
            newPassword: data.newPassword || undefined,
            serviceId:   data.serviceId ?? null,
          },
        })
        // Met à jour credentials locaux si mot de passe changé
        if (data.newPassword) {
          try {
            const creds = JSON.parse(localStorage.getItem('gestipro_credentials') || '{}')
            const user  = users.find(u => u.id === id)
            if (user && creds[user.email]) {
              creds[user.email].password = data.newPassword
              localStorage.setItem('gestipro_credentials', JSON.stringify(creds))
            }
          } catch { /* ignore */ }
        }
        return
      } catch { /* fallback */ }
    }
    // Fallback local
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
    // Met à jour credentials locaux
    if (data.newPassword) {
      try {
        const creds = JSON.parse(localStorage.getItem('gestipro_credentials') || '{}')
        const user  = users.find(u => u.id === id)
        if (user) {
          creds[user.email] = { ...(creds[user.email] || {}), password: data.newPassword }
          localStorage.setItem('gestipro_credentials', JSON.stringify(creds))
        }
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Comptes, rôles et accès à la plateforme
            {backendOk
              ? <span className="ml-2 text-xs text-emerald-400">● Connecté au backend</span>
              : <span className="ml-2 text-xs text-amber-400">● Mode local (backend hors ligne)</span>
            }
          </p>
        </div>
        <InviteUser onUserCreated={handleUserCreated} />
      </div>
      <UsersTable
        users={users}
        onToggleStatus={handleToggleStatus}
        onUpdateUser={handleUpdateUser}
      />
    </div>
  )
}
