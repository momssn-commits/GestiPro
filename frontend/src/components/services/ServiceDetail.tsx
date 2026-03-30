'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Users, Mail, Phone, Loader2, UserPlus, UserMinus,
  ChevronRight, Pencil, X, Eye, EyeOff, Search, WifiOff,
} from 'lucide-react'
import { useService, useAssignMember, useRemoveMember } from '@/hooks/useServices'
import { useAdminUsers, useUpdateAdminUser } from '@/hooks/useAdmin'
import { useAuthStore } from '@/store/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import type { Service, ServiceMember } from '@/lib/types'

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_SERVICES: Record<string, Service> = {
  'secretariat-general': { id:'1', name:'Secrétariat Général', code:'secretariat-general', description:'Coordination administrative et correspondance officielle', color:'indigo',  isActive:true, memberCount:4, createdAt:'', members:[] },
  'technique':           { id:'2', name:'Technique',           code:'technique',           description:'Maintenance, infrastructure et support technique',        color:'slate',  isActive:true, memberCount:6, createdAt:'', members:[] },
  'mediatheque':         { id:'3', name:'Médiathèque',         code:'mediatheque',         description:'Gestion des fonds documentaires et multimédia',          color:'amber',  isActive:true, memberCount:3, createdAt:'', members:[] },
  'pole-images':         { id:'4', name:'Pole Images',         code:'pole-images',         description:'Production et gestion des contenus visuels',             color:'violet', isActive:true, memberCount:2, createdAt:'', members:[] },
  'pole-culture':        { id:'5', name:'Pole Culture',        code:'pole-culture',        description:'Animation culturelle et événements',                     color:'pink',   isActive:true, memberCount:5, createdAt:'', members:[] },
  'direction':           { id:'6', name:'Direction',           code:'direction',           description:'Direction générale et pilotage stratégique',             color:'red',    isActive:true, memberCount:3, createdAt:'', members:[] },
  'communication':       { id:'7', name:'Communication',       code:'communication',       description:'Communication interne et externe',                       color:'sky',    isActive:true, memberCount:4, createdAt:'', members:[] },
  'agence-comptable':    { id:'8', name:'Agence Comptable',    code:'agence-comptable',    description:'Gestion comptable et financière',                       color:'green',  isActive:true, memberCount:3, createdAt:'', members:[] },
  'cours-de-langue':     { id:'9', name:'Cours de Langue',     code:'cours-de-langue',     description:'Enseignement des langues étrangères',                   color:'orange', isActive:true, memberCount:8, createdAt:'', members:[] },
  'campus-france':       { id:'10',name:'Campus France',       code:'campus-france',       description:'Orientation et mobilité étudiante',                     color:'teal',   isActive:true, memberCount:5, createdAt:'', members:[] },
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200' },
  slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200' },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   border: 'border-green-200' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200' },
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', rh: 'RH', manager: 'Manager', employee: 'Employé',
}

// ─── Edit member schema ───────────────────────────────────────────────────────
const editMemberSchema = z.object({
  firstName:   z.string().min(2, 'Requis'),
  lastName:    z.string().min(2, 'Requis'),
  role:        z.enum(['admin', 'rh', 'manager', 'employee']),
  department:  z.string().optional(),
  jobTitle:    z.string().optional(),
  newPassword: z.string().min(8, 'Minimum 8 caractères').or(z.literal('')),
})
type EditMemberForm = z.infer<typeof editMemberSchema>

// ─── Edit member modal ────────────────────────────────────────────────────────
function EditMemberModal({ member, onClose }: { member: ServiceMember; onClose: () => void }) {
  const [showPwd, setShowPwd] = useState(false)
  const update = useUpdateAdminUser()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName:   member.firstName,
      lastName:    member.lastName,
      role:        member.role as EditMemberForm['role'],
      department:  member.department ?? '',
      jobTitle:    member.jobTitle ?? '',
      newPassword: '',
    },
  })

  const onSubmit = async (data: EditMemberForm) => {
    try {
      await update.mutateAsync({
        id: member.id,
        data: {
          firstName:   data.firstName,
          lastName:    data.lastName,
          role:        data.role,
          department:  data.department || undefined,
          jobTitle:    data.jobTitle   || undefined,
          newPassword: data.newPassword || undefined,
        },
      })
      toast.success('Membre mis à jour')
      onClose()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="card w-full max-w-md mx-4 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-base font-semibold text-slate-900 mb-5">
          Modifier — {member.firstName} {member.lastName}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input {...register('firstName')} className="input" />
              {errors.firstName && <p className="text-accent-red text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">Nom</label>
              <input {...register('lastName')} className="input" />
              {errors.lastName && <p className="text-accent-red text-xs mt-1">{errors.lastName.message}</p>}
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
            <label className="label">Poste <span className="text-slate-400 font-normal">(opt.)</span></label>
            <input {...register('jobTitle')} className="input" placeholder="Ex : Ingénieur Principal" />
          </div>
          <div>
            <label className="label">
              Nouveau mot de passe{' '}
              <span className="text-slate-400 font-normal">(laisser vide pour ne pas modifier)</span>
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showPwd ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Minimum 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

// ─── Member card ──────────────────────────────────────────────────────────────
function MemberCard({ member, serviceId, canManage, onEdit }: {
  member: ServiceMember
  serviceId: string
  canManage: boolean
  onEdit: (m: ServiceMember) => void
}) {
  const remove = useRemoveMember()
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleRemove = () => {
    remove.mutate(
      { serviceId, userId: member.id },
      { onSuccess: () => setConfirmRemove(false) }
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-surface-200 bg-white hover:border-slate-300 transition-colors">
      <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
        <span className="text-brand text-sm font-semibold">
          {member.firstName[0]}{member.lastName[0]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {member.firstName} {member.lastName}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {member.jobTitle ?? ROLE_LABEL[member.role] ?? member.role}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {member.email && (
            <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <Mail className="w-3 h-3" />{member.email}
            </span>
          )}
          {member.phone && (
            <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Phone className="w-3 h-3" />{member.phone}
            </span>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Edit button */}
          <button
            onClick={() => onEdit(member)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-brand/8 transition-colors"
            title="Modifier le membre"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Remove — with inline confirm */}
          {confirmRemove ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Retirer ?</span>
              <button
                onClick={handleRemove}
                disabled={remove.isPending}
                className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {remove.isPending ? '...' : 'Oui'}
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-2 py-1 rounded text-xs font-medium border border-slate-200 hover:bg-surface-100 transition-colors"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRemove(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Retirer du service"
            >
              <UserMinus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add member panel ─────────────────────────────────────────────────────────
function AddMemberPanel({ serviceId, currentMemberIds }: {
  serviceId: string
  currentMemberIds: string[]
}) {
  const { data, isLoading, isError } = useAdminUsers()
  const assign = useAssignMember()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allUsers: { id: string; firstName: string; lastName: string; jobTitle?: string; department?: string }[] =
    Array.isArray(data)
      ? data
      : (data as { data?: { id: string; firstName: string; lastName: string; jobTitle?: string; department?: string }[] })?.data ?? []

  const available = allUsers
    .filter(u => !currentMemberIds.includes(u.id))
    .filter(u =>
      search === '' ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex items-center gap-2 text-sm"
      >
        <UserPlus className="w-4 h-4" />
        Ajouter un membre
      </button>
    )
  }

  return (
    <div className="card space-y-3 w-72">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Ajouter un membre</p>
        <button onClick={() => { setOpen(false); setSearch('') }} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="input pl-8 text-sm"
          autoFocus
        />
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
            <span className="text-xs text-slate-500">Chargement...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <WifiOff className="w-5 h-5 text-slate-300" />
            <p className="text-xs text-slate-400">Backend hors ligne</p>
            <p className="text-xs text-slate-400">Impossible de charger les utilisateurs</p>
          </div>
        )}

        {!isLoading && !isError && available.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">
            {search ? 'Aucun résultat' : 'Tous les utilisateurs sont déjà membres'}
          </p>
        )}

        {!isLoading && !isError && available.map(u => (
          <button
            key={u.id}
            onClick={() => assign.mutate(
              { serviceId, userId: u.id },
              { onSuccess: () => { setOpen(false); setSearch('') } }
            )}
            disabled={assign.isPending}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 transition-colors text-left disabled:opacity-60"
          >
            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
              <span className="text-brand text-xs font-semibold">{u.firstName[0]}{u.lastName[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 truncate">{u.firstName} {u.lastName}</p>
              {(u.jobTitle ?? u.department) && (
                <p className="text-xs text-slate-400 truncate">{u.jobTitle ?? u.department}</p>
              )}
            </div>
            {assign.isPending
              ? <Loader2 className="w-3.5 h-3.5 text-brand animate-spin flex-shrink-0" />
              : <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
            }
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main detail component ────────────────────────────────────────────────────
export function ServiceDetail({ code }: { code: string }) {
  const { data: apiService, isLoading, isError } = useService(code)
  const { user } = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'rh'

  const [editingMember, setEditingMember] = useState<ServiceMember | null>(null)

  const service = (isError || !apiService) ? (MOCK_SERVICES[code] ?? null) : apiService

  if (isLoading && !MOCK_SERVICES[code]) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center">
        <Loader2 className="w-5 h-5 text-brand animate-spin" />
        <span className="text-sm text-slate-500">Chargement...</span>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500">Service introuvable</p>
        <Link href="/services" className="text-sm text-brand hover:underline mt-2 block">
          ← Retour aux services
        </Link>
      </div>
    )
  }

  const c = COLOR_MAP[service.color] ?? COLOR_MAP.indigo
  const members: ServiceMember[] = service.members ?? []

  return (
    <div className="space-y-6">
      {/* Edit member modal */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
        />
      )}

      {/* Back */}
      <Link href="/services" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Tous les services
      </Link>

      {/* Header */}
      <div className={`card border-l-4 ${c.border}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
            <Users className={`w-6 h-6 ${c.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{service.name}</h1>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                {service.code}
              </span>
            </div>
            {service.description && (
              <p className="text-sm text-slate-500 mt-1">{service.description}</p>
            )}
            {service.chefFirstName && (
              <p className="text-sm text-slate-600 mt-2 font-medium">
                Chef de service : {service.chefFirstName} {service.chefLastName}
                {service.chefJobTitle && (
                  <span className="font-normal text-slate-400"> — {service.chefJobTitle}</span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">{service.memberCount}</span>
            <span className="text-sm text-slate-400">membres</span>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand" />
            Membres du service
            <span className="text-xs font-normal text-slate-400 bg-surface-200 px-2 py-0.5 rounded-full">
              {members.length}
            </span>
          </h2>
          {canManage && (
            <AddMemberPanel
              serviceId={service.id}
              currentMemberIds={members.map(m => m.id)}
            />
          )}
        </div>

        {members.length === 0 ? (
          <div className="card text-center py-10">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Aucun membre affecté à ce service</p>
            {canManage && (
              <p className="text-xs text-slate-400 mt-1">
                Utilisez le bouton « Ajouter un membre » pour affecter des utilisateurs.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map(m => (
              <MemberCard
                key={m.id}
                member={m}
                serviceId={service.id}
                canManage={canManage}
                onEdit={setEditingMember}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
