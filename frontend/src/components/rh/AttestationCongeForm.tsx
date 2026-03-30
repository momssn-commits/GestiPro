'use client'

import { useState, useRef } from 'react'
import { FileText, Download, Eye, X } from 'lucide-react'
import { generateAttestationCongePdf } from '@/lib/pdf/attestationConge'

interface CongeField {
  label: string
  placeholder: string
  value: string
  key: string
  type?: 'text' | 'select'
  options?: string[]
}

const INITIAL_FIELDS: CongeField[] = [
  { label: 'Nom complet du signataire',    placeholder: 'Ex: François CHABANET',    value: '', key: 'signataire' },
  { label: 'Fonction du signataire',        placeholder: 'Ex: Secrétaire Général',   value: '', key: 'fonctionSignataire' },
  { label: 'Civilité (Madame / Monsieur)',  placeholder: '',                          value: 'Madame', key: 'civilite', type: 'select',
    options: ['Madame', 'Monsieur', 'M.'] },
  { label: 'Nom complet de l\'employé(e)', placeholder: 'Ex: Angèle Tening DIOUF', value: '', key: 'employe' },
  { label: 'Poste / Fonction',              placeholder: 'Ex: Aide Comptable',       value: '', key: 'poste' },
  { label: 'Date début de congé',           placeholder: 'Ex: 01 août 2024',         value: '', key: 'dateDebut' },
  { label: 'Date fin de congé',             placeholder: 'Ex: 31 août 2024',         value: '', key: 'dateFin' },
  { label: 'Fait à (lieu)',                 placeholder: 'Ex: Dakar',                value: '', key: 'lieu' },
  { label: 'Date du document',              placeholder: 'Ex: 05 août 2024',         value: '', key: 'dateFait' },
]

const PREVIEW_ID = 'conge-preview-content'

export function AttestationCongeForm() {
  const [open, setOpen]       = useState(false)
  const [preview, setPreview] = useState(false)
  const [fields, setFields]   = useState(INITIAL_FIELDS)
  const [loading, setLoading] = useState(false)

  const updateField = (key: string, value: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f))
  }

  const getVal = (key: string) => fields.find(f => f.key === key)?.value || ''

  const isComplete = fields.every(f => f.value.trim() !== '')

  const handleExportPdf = async () => {
    setLoading(true)
    try {
      await generateAttestationCongePdf(PREVIEW_ID)
    } catch (err) {
      console.error('Erreur export PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <FileText className="w-4 h-4" />
        Attestation de congé
      </button>

      {/* ── Modal formulaire ───────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Attestation de congé</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Remplissez les champs puis exportez en PDF
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row">

                {/* ── Formulaire (gauche) ──────────────────────────────── */}
                <div className="lg:w-1/2 p-6 space-y-4 border-r border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    Champs à remplir
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-2">
                    * Ces champs apparaîtront en gras dans le document
                  </p>

                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {field.label} <span className="text-red-500">*</span>
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={field.value}
                          onChange={e => updateField(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={e => updateField(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     placeholder:text-slate-400"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* ── Aperçu (droite) ──────────────────────────────────── */}
                <div className="lg:w-1/2 p-6 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Aperçu du document
                    </h3>
                    <button
                      onClick={() => setPreview(!preview)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {preview ? 'Masquer' : 'Plein écran'}
                    </button>
                  </div>

                  <CongePreview
                    id={undefined}
                    signataire={getVal('signataire')}
                    fonctionSignataire={getVal('fonctionSignataire')}
                    civilite={getVal('civilite')}
                    employe={getVal('employe')}
                    poste={getVal('poste')}
                    dateDebut={getVal('dateDebut')}
                    dateFin={getVal('dateFin')}
                    lieu={getVal('lieu')}
                    dateFait={getVal('dateFait')}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
              <p className="text-xs text-slate-500">
                {isComplete
                  ? '✅ Tous les champs sont remplis'
                  : `⚠️ ${fields.filter(f => !f.value.trim()).length} champ(s) restant(s)`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={!isComplete || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                             hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Génération...' : 'Exporter en PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal plein écran aperçu ──────────────────────────────────── */}
      {preview && (
        <div className="fixed inset-0 z-[60] bg-white overflow-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Aperçu - Attestation de congé</h3>
            <div className="flex gap-3">
              <button
                onClick={handleExportPdf}
                disabled={!isComplete || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                           hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Génération...' : 'Exporter en PDF'}
              </button>
              <button onClick={() => setPreview(false)} className="btn-secondary py-1.5 text-xs">
                <X className="w-4 h-4" /> Fermer
              </button>
            </div>
          </div>
          <div className="flex justify-center py-8">
            <CongePreview
              id={undefined}
              signataire={getVal('signataire')}
              fonctionSignataire={getVal('fonctionSignataire')}
              civilite={getVal('civilite')}
              employe={getVal('employe')}
              poste={getVal('poste')}
              dateDebut={getVal('dateDebut')}
              dateFin={getVal('dateFin')}
              lieu={getVal('lieu')}
              dateFait={getVal('dateFait')}
              fullSize
            />
          </div>
        </div>
      )}

      {/* ── Div cachée pour export PDF — toujours montée quand modal ouvert ── */}
      {open && (
        <div className="fixed left-[-9999px] top-0 pointer-events-none" aria-hidden="true">
          <CongePreview
            id={PREVIEW_ID}
            signataire={getVal('signataire')}
            fonctionSignataire={getVal('fonctionSignataire')}
            civilite={getVal('civilite')}
            employe={getVal('employe')}
            poste={getVal('poste')}
            dateDebut={getVal('dateDebut')}
            dateFin={getVal('dateFin')}
            lieu={getVal('lieu')}
            dateFait={getVal('dateFait')}
            fullSize
          />
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Aperçu visuel identique au document Word
   ═══════════════════════════════════════════════════════════════════════════ */

interface PreviewProps {
  id?: string
  signataire: string
  fonctionSignataire: string
  civilite: string
  employe: string
  poste: string
  dateDebut: string
  dateFin: string
  lieu: string
  dateFait: string
  fullSize?: boolean
}

function BoldField({ value, placeholder }: { value: string; placeholder: string }) {
  return (
    <span className="font-bold" style={{ color: '#000000' }}>
      {value || placeholder}
    </span>
  )
}

function CongePreview(props: PreviewProps) {
  const {
    id, signataire, fonctionSignataire, civilite, employe,
    poste, dateDebut, dateFin, lieu, dateFait, fullSize,
  } = props

  const scale = fullSize ? 'w-[215.9mm] min-h-[279.4mm]' : 'w-full min-h-[400px]'

  return (
    <div
      id={id}
      className={`bg-white border border-slate-300 shadow-lg ${scale} relative`}
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        color: '#000000',
        padding: fullSize ? '25.4mm 31.75mm 25.4mm 31.75mm' : '24px 28px',
      }}
    >
      {/* ── En-tête logo ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <img
          src="/images/ifs-logo-header.jpg"
          alt="Ambassade de France / Institut Français"
          className={fullSize ? 'h-20' : 'h-12'}
        />
      </div>

      {/* ── Espacement ───────────────────────────────────────────────── */}
      <div className={fullSize ? 'h-16' : 'h-6'} />

      {/* ── Titre ────────────────────────────────────────────────────── */}
      <h1
        className="text-center font-normal underline"
        style={{
          fontSize: fullSize ? '18pt' : '15pt',
          color: '#000000',
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        ATTESTATION DE CONGÉS
      </h1>

      {/* ── Espacement ───────────────────────────────────────────────── */}
      <div className={fullSize ? 'h-12' : 'h-6'} />

      {/* ── Corps du texte ───────────────────────────────────────────── */}
      <p
        className="text-justify leading-relaxed"
        style={{
          fontSize: fullSize ? '14pt' : '11pt',
          textIndent: '2em',
        }}
      >
        Je soussigné(e),{' '}
        <BoldField value={signataire} placeholder="________________" />,{' '}
        <BoldField value={fonctionSignataire} placeholder="________________" />{' '}
        de l&apos;Institut Français du Sénégal, atteste par la présente que{' '}
        <BoldField value={employe ? `${civilite} ${employe}` : ''} placeholder="________________" />,
        {' '}<BoldField value={poste} placeholder="________________" />,
        {' '}de notre institution, suspendra ses activités du{' '}
        <BoldField value={dateDebut} placeholder="________________" />{' '}
        au{' '}
        <BoldField value={dateFin} placeholder="________________" />{' '}
        afin de bénéficier de ses congés annuels&nbsp;; conformément à la réglementation en vigueur.
      </p>

      {/* ── Date ─────────────────────────────────────────────────────── */}
      <p
        className="mt-8"
        style={{
          fontSize: fullSize ? '14pt' : '11pt',
          textIndent: '2em',
        }}
      >
        Fait à{' '}
        <BoldField value={lieu} placeholder="________" />, le{' '}
        <BoldField value={dateFait} placeholder="________________" />,
        {' '}pour servir et valoir ce que de droit.
      </p>

      {/* ── Bloc signature ───────────────────────────────────────────── */}
      <div
        className="text-center mt-16"
        style={{
          fontSize: fullSize ? '14pt' : '11pt',
          marginLeft: '35%',
        }}
      >
        <p>Le {fonctionSignataire || 'Secrétaire Général'} de</p>
        <p>L&apos;Institut Français du Sénégal,</p>

        <div className={fullSize ? 'h-24' : 'h-12'} />

        <p className="font-bold">
          {signataire || '________________'}
        </p>
      </div>

      {/* ── Pied de page ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 right-6 text-xs"
        style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000000' }}
      >
        Page 1 sur 1
      </div>
    </div>
  )
}
