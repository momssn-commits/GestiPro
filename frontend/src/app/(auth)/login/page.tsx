'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/lib/api/auth'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      const { user, token } = await authApi.login(data)
      setAuth(user, token)
      router.push('/dashboard')
    } catch {
      toast.error('Identifiants incorrects')
    }
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Panneau gauche indigo */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col items-center justify-center px-12">
        <div className="max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
            <span className="text-white text-3xl font-bold">G</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">GestiPro</h1>
          <p className="text-indigo-200 text-base leading-relaxed">
            Plateforme intranet RH & documentaire.<br />
            Gérez vos dossiers, documents et formations en un seul endroit.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Modules', value: '3' },
              { label: 'Sécurisé', value: 'JWT' },
              { label: 'Rôles', value: '4' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3">
                <p className="text-white font-bold text-lg">{s.value}</p>
                <p className="text-indigo-300 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit formulaire */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand rounded-xl mb-3">
              <span className="text-white text-xl font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">GestiPro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
            <p className="text-slate-500 text-sm mt-1">Accédez à votre espace GestiPro</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vous@entreprise.com"
                  className="input pl-10"
                />
              </div>
              {errors.email && <p className="text-accent-red text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pl-10 pr-10"
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

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5 mt-2">
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-8">
            GestiPro v1.0 — Accès réservé aux collaborateurs autorisés
          </p>
        </div>
      </div>
    </div>
  )
}
