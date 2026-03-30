'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, Building2, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useChangePassword } from '@/hooks/useRh'
import toast from 'react-hot-toast'

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Requis'),
  newPassword:     z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string().min(1, 'Requis'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})
type PwForm = z.infer<typeof pwSchema>

const roleLabels: Record<string, string> = {
  admin: 'Administrateur', rh: 'Ressources Humaines',
  manager: 'Manager', employee: 'Employé',
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const changePassword = useChangePassword()
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  })

  const onSubmit = async (data: PwForm) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword:     data.newPassword,
      })
      reset()
    } catch {
      // Fallback local si backend hors ligne : met à jour gestipro_credentials
      try {
        const stored = localStorage.getItem('gestipro_credentials')
        const creds  = stored ? JSON.parse(stored) as Record<string, { password: string; user: unknown }> : {}
        if (user?.email && creds[user.email]) {
          if (creds[user.email].password !== data.currentPassword) {
            toast.error('Mot de passe actuel incorrect')
            return
          }
          creds[user.email].password = data.newPassword
          localStorage.setItem('gestipro_credentials', JSON.stringify(creds))
          toast.success('Mot de passe modifié avec succès')
          reset()
        } else {
          toast.error('Impossible de modifier le mot de passe en mode local pour ce compte')
        }
      } catch {
        toast.error('Erreur lors du changement de mot de passe')
      }
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-slate-500 text-sm mt-1">Gestion du compte et préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil */}
        <div className="card flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-brand">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
          <p className="text-sm text-slate-500 mt-1">{roleLabels[user.role] ?? user.role}</p>
          <span className="badge-green mt-2">Actif</span>

          <div className="w-full mt-6 space-y-3 text-left">
            {[
              { icon: Mail,      label: 'Email',      value: user.email },
              { icon: Building2, label: 'Département', value: user.department ?? '—' },
              { icon: Shield,    label: 'Rôle',        value: roleLabels[user.role] ?? user.role },
            ].map(item => (
              <div key={item.label} className="bg-surface-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="w-3.5 h-3.5 text-slate-500" />
                  <p className="text-xs text-slate-500">{item.label}</p>
                </div>
                <p className="text-sm text-slate-200 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Changer mot de passe */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-5 h-5 text-brand" />
            <h3 className="text-base font-semibold text-slate-900">Changer le mot de passe</h3>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <div>
              <label className="label">Mot de passe actuel</label>
              <div className="relative">
                <input {...register('currentPassword')} type={showCurrent ? 'text' : 'password'}
                  className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-accent-red text-xs mt-1">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="label">Nouveau mot de passe</label>
              <div className="relative">
                <input {...register('newPassword')} type={showNew ? 'text' : 'password'}
                  className="input pr-10" placeholder="Minimum 8 caractères" />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-accent-red text-xs mt-1">{errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="label">Confirmer le nouveau mot de passe</label>
              <div className="relative">
                <input {...register('confirmPassword')} type={showConfirm ? 'text' : 'password'}
                  className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-accent-red text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || changePassword.isPending}
              className="btn-primary mt-2"
            >
              {(isSubmitting || changePassword.isPending) ? 'Enregistrement...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
