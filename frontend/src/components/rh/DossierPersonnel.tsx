'use client'

import { Briefcase, Phone, Mail, MapPin, Loader2 } from 'lucide-react'
import { useMyProfile } from '@/hooks/useRh'
import { useAuthStore } from '@/store/auth'

export function DossierPersonnel() {
  const { user: authUser } = useAuthStore()
  const { data: profile, isLoading, isError } = useMyProfile()

  const p = profile as Record<string, string> | undefined
  const firstName    = p?.firstName    ?? authUser?.firstName  ?? '—'
  const lastName     = p?.lastName     ?? authUser?.lastName   ?? '—'
  const email        = p?.email        ?? authUser?.email      ?? '—'
  const department   = p?.department   ?? authUser?.department ?? '—'
  const jobTitle     = p?.jobTitle     ?? '—'
  const grade        = p?.grade        ?? '—'
  const contractType = p?.contractType ?? '—'
  const phone        = p?.phone        ?? '—'
  const hireDate     = p?.hireDate
    ? new Date(p.hireDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="card flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          {isLoading
            ? <Loader2 className="w-8 h-8 text-brand animate-spin" />
            : <span className="text-2xl font-bold text-brand">{firstName[0]}{lastName[0]}</span>
          }
        </div>
        <h2 className="text-lg font-bold text-slate-900">{firstName} {lastName}</h2>
        <p className="text-sm text-slate-500">{jobTitle !== '—' ? jobTitle : department}</p>
        <span className="badge-green mt-2">Actif</span>
        {isError && <p className="text-xs text-amber-400 mt-2">Mode local — backend hors ligne</p>}

        <div className="w-full mt-6 space-y-3">
          {[
            { icon: Mail,   label: email },
            { icon: Phone,  label: phone !== '—' ? phone : 'Non renseigné' },
            { icon: MapPin, label: department },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-slate-500">
              <item.icon className="w-4 h-4 flex-shrink-0 text-slate-600" />
              <span className="text-xs truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card lg:col-span-2 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Informations professionnelles</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Matricule',        value: authUser?.id ? `EMP-${authUser.id.slice(0,8).toUpperCase()}` : '—' },
            { label: "Date d'embauche",  value: hireDate },
            { label: 'Département',      value: department },
            { label: 'Poste',            value: jobTitle },
            { label: 'Grade',            value: grade },
            { label: 'Type de contrat',  value: contractType },
          ].map(item => (
            <div key={item.label} className="bg-surface-200 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-surface-200">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Documents personnels</h4>
          <div className="space-y-2">
            {[
              { name: 'Contrat de travail',      status: 'Archivé' },
              { name: 'Fiche de poste actuelle', status: 'Actif' },
            ].map(doc => (
              <div key={doc.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-200 transition-all">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">{doc.name}</span>
                </div>
                <span className={doc.status === 'Actif' ? 'badge-green' : 'badge-blue'}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
