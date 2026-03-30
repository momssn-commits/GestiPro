'use client'

import { useState } from 'react'
import { UserPlus, X, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useServices } from '@/hooks/useServices'
import type { AppUser } from '@/app/(dashboard)/admin/utilisateurs/page'

const schema = z.object({
  firstName:   z.string().min(2),
  lastName:    z.string().min(2),
  email:       z.string().email('Email invalide'),
  password:    z.string().min(8, 'Minimum 8 caractères'),
  role:        z.enum(['admin', 'rh', 'manager', 'employee']),
  department:  z.string().optional(),
  jobTitle:    z.string().optional(),
  serviceId:   z.string().optional(),
})
type FormData = z.infer<typeof schema>

type Props = {
  onUserCreated: (user: Omit<AppUser, 'id' | 'active' | 'hireDate' | 'department'> & { password: string; department?: string; jobTitle?: string; serviceId?: string }) => void
}

export function InviteUser({ onUserCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { data: servicesData } = useServices()

  const services: { id: string; name: string }[] = Array.isArray(servicesData)
    ? servicesData
    : (servicesData as { id: string; name: string }[] | undefined) ?? []

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  })

  const onSubmit = async (data: FormData) => {
    await onUserCreated({
      firstName:  data.firstName,
      lastName:   data.lastName,
      email:      data.email,
      role:       data.role,
      department: data.department || undefined,
      password:   data.password,
      jobTitle:   data.jobTitle   || undefined,
      serviceId:  data.serviceId  || undefined,
    })
    setOpen(false)
    reset()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <UserPlus className="w-4 h-4" />
        Créer un utilisateur
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card w-full max-w-lg mx-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-slate-900 mb-5">Créer un utilisateur</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Prénom</label>
                  <input {...register('firstName')} className="input" placeholder="Jean" />
                  {errors.firstName && <p className="text-accent-red text-xs mt-1">Requis</p>}
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input {...register('lastName')} className="input" placeholder="Dupont" />
                  {errors.lastName && <p className="text-accent-red text-xs mt-1">Requis</p>}
                </div>
              </div>

              <div>
                <label className="label">Email professionnel</label>
                <input {...register('email')} type="email" className="input" placeholder="prenom.nom@entreprise.sn" />
                {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Mot de passe</label>
                <div className="relative">
                  <input
                    {...register('password')}
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
                {errors.password && <p className="text-accent-red text-xs mt-1">{errors.password.message}</p>}
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
                  <label className="label">Poste</label>
                  <input {...register('jobTitle')} className="input" placeholder="Ingénieur Principal" />
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
                  Département <span className="text-slate-400 font-normal">(optionnel)</span>
                </label>
                <input {...register('department')} className="input" placeholder="Direction Technique" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
                  {isSubmitting ? 'Création...' : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
