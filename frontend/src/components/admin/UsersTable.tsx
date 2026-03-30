'use client'

import { ShieldCheck, User, UserCog, Users, Pencil, Ban, X, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useServices } from '@/hooks/useServices'
import type { AppUser } from '@/app/(dashboard)/admin/utilisateurs/page'

const roleConfig = {
  admin:    { label: 'Admin',    class: 'badge-red',    icon: ShieldCheck },
  rh:       { label: 'RH',      class: 'badge-purple', icon: UserCog },
  manager:  { label: 'Manager', class: 'badge-yellow',  icon: Users },
  employee: { label: 'Employé', class: 'badge-blue',   icon: User },
}

const editSchema = z.object({
  firstName:   z.string().min(2),
  lastName:    z.string().min(2),
  role:        z.enum(['admin', 'rh', 'manager', 'employee']),
  department:  z.string().optional(),
  serviceId:   z.string().optional(),
  newPassword: z.string().min(8, 'Minimum 8 caractères').or(z.literal('')),
})
type EditFormData = z.infer<typeof editSchema>

type Props = {
  users: AppUser[]
  onToggleStatus: (id: string) => void
  onUpdateUser: (id: string, data: Partial<AppUser> & { newPassword?: string; serviceId?: string }) => void
}

function EditModal({ user, onClose, onSave }: {
  user: AppUser
  onClose: () => void
  onSave: (data: EditFormData) => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const { data: servicesData } = useServices()

  const services: { id: string; name: string }[] = Array.isArray(servicesData)
    ? servicesData
    : (servicesData as { id: string; name: string }[] | undefined) ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName:   user.firstName,
      lastName:    user.lastName,
      role:        user.role as EditFormData['role'],
      department:  user.department,
      serviceId:   user.serviceId ?? '',
      newPassword: '',
    },
  })

  useEffect(() => {
    reset({
      firstName:   user.firstName,
      lastName:    user.lastName,
      role:        user.role as EditFormData['role'],
      department:  user.department,
      serviceId:   user.serviceId ?? '',
      newPassword: '',
    })
  }, [user, reset])

  const onSubmit = async (data: EditFormData) => {
    await new Promise(r => setTimeout(r, 400))
    onSave(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="card w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-semibold text-slate-900 mb-5">
          Modifier — {user.firstName} {user.lastName}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input {...register('firstName')} className="input" />
              {errors.firstName && <p className="text-accent-red text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="label">Nom</label>
              <input {...register('lastName')} className="input" />
              {errors.lastName && <p className="text-accent-red text-xs mt-1">Requis</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rôle</label>
              <select {...register('role')} className="input">
                <option value="employee">Employé</option>
                <option value="manager">Manager</option>
                <option value="rh">RH</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Département <span className="text-slate-400 font-normal">(opt.)</span></label>
              <input {...register('department')} className="input" placeholder="Optionnel" />
            </div>
          </div>

          <div>
            <label className="label">Service / Groupe de travail</label>
            <select {...register('serviceId')} className="input">
              <option value="">— Aucun service —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              Nouveau mot de passe{' '}
              <span className="text-slate-400 font-normal">(laisser vide pour ne pas modifier)</span>
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Minimum 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-accent-red text-xs mt-1">{errors.newPassword.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UsersTable({ users, onToggleStatus, onUpdateUser }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)

  const filtered = users.filter(u => {
    const matchSearch = search === '' ||
      `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleSave = (data: EditFormData) => {
    if (!editingUser) return
    onUpdateUser(editingUser.id, {
      ...data,
      serviceId:   data.serviceId   || undefined,
      newPassword: data.newPassword || undefined,
    })
    toast.success('Utilisateur mis à jour')
    setEditingUser(null)
  }

  return (
    <div className="space-y-4">
      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input w-72"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="input w-40"
        >
          <option value="all">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="rh">RH</option>
          <option value="manager">Manager</option>
          <option value="employee">Employé</option>
        </select>
        <span className="text-slate-500 text-sm ml-auto">
          {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200">
              {['Utilisateur', 'Email', 'Rôle', 'Service', 'Embauche', 'Statut', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {filtered.map(user => {
              const rc = roleConfig[user.role as keyof typeof roleConfig]
              return (
                <tr key={user.id} className="hover:bg-surface-200/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand text-xs font-semibold">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                        {user.department && (
                          <p className="text-xs text-slate-400 truncate">{user.department}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={clsx(rc.class, 'inline-flex items-center gap-1')}>
                      <rc.icon className="w-3 h-3" />
                      {rc.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.serviceName ? (
                      <span className="text-xs font-medium text-brand bg-brand/8 px-2 py-1 rounded-full whitespace-nowrap">
                        {user.serviceName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{user.hireDate}</td>
                  <td className="px-5 py-3">
                    <span className={user.active ? 'badge-green' : 'badge-red'}>
                      {user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="btn-secondary py-1 px-2 text-xs"
                      >
                        <Pencil className="w-3 h-3" />
                        Modifier
                      </button>
                      <button
                        onClick={() => onToggleStatus(user.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-accent-red border border-accent-red/30 hover:bg-accent-red/10 transition-colors"
                      >
                        <Ban className="w-3 h-3" />
                        {user.active ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
