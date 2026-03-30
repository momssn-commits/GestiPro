'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { rhApi } from '@/lib/api/rh'
import toast from 'react-hot-toast'

const TYPES = [
  { value: 'travail', label: 'Attestation de travail' },
  { value: 'salaire', label: 'Attestation de salaire' },
  { value: 'conge',   label: 'Attestation de congé' },
  { value: 'autre',   label: 'Autre' },
]

export function GenerateAttestation() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('travail')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await rhApi.createAttestation({ type: type as never, comments })
      toast.success('Demande d\'attestation soumise')
      setOpen(false)
      setComments('')
    } catch {
      toast.error('Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" />
        Nouvelle attestation
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="card w-full max-w-md mx-4 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-slate-900 mb-5">Demande d'attestation</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Type d'attestation</label>
                <select value={type} onChange={e => setType(e.target.value)} className="input">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Commentaire (optionnel)</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Précisez l'usage de cette attestation..."
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1 justify-center">
                  Annuler
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                  {loading ? 'Envoi...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
