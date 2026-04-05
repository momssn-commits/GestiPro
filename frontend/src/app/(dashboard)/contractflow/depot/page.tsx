'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileSignature, Users, Calendar, DollarSign, FileText,
  Paperclip, ChevronRight, Info, ArrowLeft, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { TYPE_LABEL } from '@/components/contractflow/shared'
import type { ActeType, CreateActePayload } from '@/lib/types'
import { useCreateActe } from '@/hooks/useContractflow'
import { useServices } from '@/hooks/useServices'

interface FormData {
  type: ActeType | ''
  titre: string
  partieB: string
  objet: string
  montant: string
  dateDebut: string
  dateFin: string
  service: string
  observations: string
}

const INIT: FormData = {
  type: '', titre: '', partieB: '', objet: '',
  montant: '', dateDebut: '', dateFin: '',
  service: '', observations: '',
}

const STEPS = ['Type & Titre', 'Parties', 'Objet & Montant', 'Dates & Service', 'Confirmation']

export default function DepotActePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INIT)
  const [files, setFiles] = useState<File[]>([])
  const [createdNumero, setCreatedNumero] = useState('')

  const { mutateAsync: createActe, isPending } = useCreateActe()
  const { data: servicesData } = useServices()
  const services = Array.isArray(servicesData) ? servicesData : []

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const canNext = () => {
    if (step === 0) return form.type !== '' && form.titre.trim() !== ''
    if (step === 1) return form.partieB.trim() !== ''
    if (step === 2) return form.objet.trim() !== ''
    if (step === 3) return true
    return true
  }

  const handleSubmit = async () => {
    const payload: CreateActePayload = {
      titre:        form.titre,
      type:         form.type as ActeType,
      partieB:      form.partieB,
      objet:        form.objet,
      montant:      form.montant ? Number(form.montant) : null,
      dateDebut:    form.dateDebut || null,
      dateFin:      form.dateFin   || null,
      service:      form.service   || null,
      observations: form.observations || null,
    }
    const acte = await createActe(payload)
    setCreatedNumero(acte.numero)
  }

  if (createdNumero) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FileSignature className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acte déposé avec succès</h2>
        <p className="text-slate-500 text-sm">
          Votre acte a été enregistré sous la référence{' '}
          <span className="font-mono font-semibold text-slate-800">{createdNumero}</span>.
          Il est en statut <strong>Brouillon</strong> et prêt pour le circuit de validation.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <button onClick={() => router.push('/contractflow')} className="btn-secondary">
            Retour au tableau de bord
          </button>
          <button onClick={() => { setForm(INIT); setStep(0); setCreatedNumero('') }} className="btn-primary">
            Déposer un autre acte
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dépôt d'un acte contractuel</h1>
          <p className="text-slate-500 text-sm mt-0.5">M1 — Création et dépôt d'actes</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={clsx(
              'flex items-center gap-1.5 text-xs font-medium flex-shrink-0',
              i < step ? 'text-green-600' : i === step ? 'text-brand' : 'text-slate-400'
            )}>
              <div className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand text-white' : 'bg-surface-200 text-slate-400'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx('flex-1 h-0.5 mx-2', i < step ? 'bg-green-400' : 'bg-surface-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="card space-y-5">

        {/* Step 0 */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <FileSignature className="w-3.5 h-3.5" /> Type d'acte <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.entries(TYPE_LABEL) as [ActeType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => set('type', key)}
                    className={clsx(
                      'px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all',
                      form.type === key
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-surface-200 hover:border-brand/40 text-slate-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Titre de l'acte <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.titre}
                onChange={e => set('titre', e.target.value)}
                placeholder="Ex : Convention de coopération culturelle 2025"
                className="input"
              />
            </div>
          </>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="bg-surface rounded-lg px-4 py-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                La <strong>Partie A</strong> est automatiquement votre organisation.
                Renseignez la <strong>Partie B</strong> (co-contractant).
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Partie A
              </label>
              <input type="text" value="Institut Français du Sénégal" disabled
                className="input bg-surface-100 text-slate-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Partie B — Co-contractant <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.partieB}
                onChange={e => set('partieB', e.target.value)}
                placeholder="Ex : Université Cheikh Anta Diop, SARL TechSolutions…"
                className="input"
              />
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Objet <span className="text-red-400">*</span>
              </label>
              <textarea rows={4} value={form.objet} onChange={e => set('objet', e.target.value)}
                placeholder="Décrivez l'objet principal de cet acte…" className="input resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Montant (FCFA) — optionnel
              </label>
              <input type="number" value={form.montant} onChange={e => set('montant', e.target.value)}
                placeholder="Ex : 1500000" className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Observations / Clauses particulières
              </label>
              <textarea rows={3} value={form.observations} onChange={e => set('observations', e.target.value)}
                placeholder="Notes internes, clauses spécifiques…" className="input resize-none" />
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date de début
                </label>
                <input type="date" value={form.dateDebut} onChange={e => set('dateDebut', e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date de fin
                </label>
                <input type="date" value={form.dateFin} onChange={e => set('dateFin', e.target.value)} className="input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Service responsable
              </label>
              {services.length > 0 ? (
                <select value={form.service} onChange={e => set('service', e.target.value)} className="input">
                  <option value="">— Sélectionnez un service —</option>
                  {services.map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={form.service} onChange={e => set('service', e.target.value)}
                  placeholder="Ex : Secrétariat Général" className="input" />
              )}
            </div>
          </>
        )}

        {/* Step 4 — Confirmation + pièces jointes */}
        {step === 4 && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-surface-300 rounded-xl p-8 text-center cursor-pointer hover:border-brand/40 transition-all"
              onClick={() => document.getElementById('cf-file-input')?.click()}
            >
              <Paperclip className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Joindre des documents (optionnel)</p>
              <p className="text-xs text-slate-400 mt-1">PDF, Word — max 25 Mo</p>
              <input id="cf-file-input" type="file" multiple className="hidden" accept=".pdf,.doc,.docx"
                onChange={e => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
            </div>
            {files.length > 0 && (
              <div className="space-y-1.5 border border-surface-200 rounded-lg p-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 truncate">
                      <Paperclip className="w-3 h-3 flex-shrink-0 text-slate-400" />{f.name}
                    </span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                      className="text-slate-300 hover:text-red-500 ml-2 flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Récapitulatif */}
            <div className="bg-surface rounded-xl p-4 space-y-2 border border-surface-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Récapitulatif</p>
              {[
                ['Type',     form.type ? TYPE_LABEL[form.type] : '—'],
                ['Titre',    form.titre || '—'],
                ['Partie B', form.partieB || '—'],
                ['Service',  form.service || '—'],
                ['Montant',  form.montant ? `${Number(form.montant).toLocaleString('fr-FR')} FCFA` : '—'],
                ['Durée',    form.dateDebut && form.dateFin ? `${form.dateDebut} → ${form.dateFin}` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="text-slate-400 w-20 flex-shrink-0">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.back()} className="btn-secondary text-sm">
            ← Précédent
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isPending}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</> : <><FileSignature className="w-4 h-4" /> Soumettre l'acte</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
