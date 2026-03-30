'use client'

import { useState } from 'react'
import { FileText, Download, Eye, X } from 'lucide-react'
import { generateAttestationDocx } from '@/lib/docx/attestationTravail'

interface AttestationField {
  label: string
  placeholder: string
  value: string
  key: string
}

const INITIAL_FIELDS: AttestationField[] = [
  { label: 'Nom complet du signataire',   placeholder: 'Ex: François CHABANET',       value: '', key: 'signataire' },
  { label: 'Fonction du signataire',       placeholder: 'Ex: Secrétaire Général',      value: '', key: 'fonctionSignataire' },
  { label: 'Nom complet de l\'employ\u00e9(e)', placeholder: 'Ex: Ang\u00e8le Tening DIOUF',  value: '', key: 'employe' },
  { label: 'Date de naissance',            placeholder: 'Ex: 27 ao\u00fbt 1990',             value: '', key: 'dateNaissance' },
  { label: 'Lieu de naissance',            placeholder: 'Ex: Dakar',                   value: '', key: 'lieuNaissance' },
  { label: 'Poste / Fonction',            placeholder: 'Ex: Aide Comptable',           value: '', key: 'poste' },
  { label: 'Date d\'embauche',             placeholder: 'Ex: 01 juin 2020',            value: '', key: 'dateEmbauche' },
  { label: 'Fait \u00e0 (lieu)',                  placeholder: 'Ex: Dakar',                   value: '', key: 'lieuFait' },
  { label: 'Date du document',            placeholder: 'Ex: 05 ao\u00fbt 2024',              value: '', key: 'dateFait' },
]

export function AttestationTravailForm() {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [loading, setLoading] = useState(false)

  const updateField = (key: string, value: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f))
  }

  const getVal = (key: string) => fields.find(f => f.key === key)?.value || ''

  const isComplete = fields.every(f => f.value.trim() !== '')

  const handleExportWord = async () => {
    setLoading(true)
    try {
      await generateAttestationDocx({
        signataire:         getVal('signataire'),
        fonctionSignataire: getVal('fonctionSignataire'),
        employe:            getVal('employe'),
        dateNaissance:      getVal('dateNaissance'),
        lieuNaissance:      getVal('lieuNaissance'),
        poste:              getVal('poste'),
        dateEmbauche:       getVal('dateEmbauche'),
        lieuFait:           getVal('lieuFait'),
        dateFait:           getVal('dateFait'),
      })
    } catch (err) {
      console.error('Erreur export Word:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <FileText className="w-4 h-4" />
        Attestation de travail
      </button>

      {/* ── Modal formulaire ───────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Attestation de travail</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Remplissez les champs puis exportez en Word
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
                    Champs \u00e0 remplir
                  </h3>
                  <p className="text-xs text-red-500 font-medium mb-2">
                    * Ces champs apparaissent en rouge dans le document
                  </p>

                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {field.label} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.value}
                        onChange={e => updateField(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                   placeholder:text-slate-400"
                      />
                    </div>
                  ))}
                </div>

                {/* ── Apercu (droite) ──────────────────────────────────── */}
                <div className="lg:w-1/2 p-6 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                      Aper\u00e7u du document
                    </h3>
                    <button
                      onClick={() => setPreview(!preview)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {preview ? 'Masquer' : 'Plein \u00e9cran'}
                    </button>
                  </div>

                  <AttestationPreview
                    signataire={getVal('signataire')}
                    fonctionSignataire={getVal('fonctionSignataire')}
                    employe={getVal('employe')}
                    dateNaissance={getVal('dateNaissance')}
                    lieuNaissance={getVal('lieuNaissance')}
                    poste={getVal('poste')}
                    dateEmbauche={getVal('dateEmbauche')}
                    lieuFait={getVal('lieuFait')}
                    dateFait={getVal('dateFait')}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
              <p className="text-xs text-slate-500">
                {isComplete
                  ? '\u2705 Tous les champs sont remplis'
                  : `\u26a0\ufe0f ${fields.filter(f => !f.value.trim()).length} champ(s) restant(s)`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExportWord}
                  disabled={!isComplete || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                             hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'G\u00e9n\u00e9ration...' : 'Exporter en Word'}
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
            <h3 className="font-semibold text-slate-900">Aper\u00e7u - Attestation de travail</h3>
            <button onClick={() => setPreview(false)} className="btn-secondary py-1.5 text-xs">
              <X className="w-4 h-4" /> Fermer
            </button>
          </div>
          <div className="flex justify-center py-8">
            <AttestationPreview
              signataire={getVal('signataire')}
              fonctionSignataire={getVal('fonctionSignataire')}
              employe={getVal('employe')}
              dateNaissance={getVal('dateNaissance')}
              lieuNaissance={getVal('lieuNaissance')}
              poste={getVal('poste')}
              dateEmbauche={getVal('dateEmbauche')}
              lieuFait={getVal('lieuFait')}
              dateFait={getVal('dateFait')}
              fullSize
            />
          </div>
        </div>
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Aperçu visuel identique au document Word
   ═══════════════════════════════════════════════════════════════════════════ */

interface PreviewProps {
  signataire: string
  fonctionSignataire: string
  employe: string
  dateNaissance: string
  lieuNaissance: string
  poste: string
  dateEmbauche: string
  lieuFait: string
  dateFait: string
  fullSize?: boolean
}

function RedField({ value, placeholder }: { value: string; placeholder: string }) {
  return (
    <span className="font-bold text-red-600">
      {value || placeholder}
    </span>
  )
}

function AttestationPreview(props: PreviewProps) {
  const {
    signataire, fonctionSignataire, employe, dateNaissance,
    lieuNaissance, poste, dateEmbauche, lieuFait, dateFait, fullSize,
  } = props

  const scale = fullSize ? 'w-[210mm] min-h-[297mm]' : 'w-full min-h-[400px]'

  return (
    <div
      className={`bg-white border border-slate-300 shadow-lg ${scale} relative`}
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        padding: fullSize ? '25mm 30mm 25mm 30mm' : '24px 28px',
      }}
    >
      {/* ── En-tête logos ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <img
          src="/images/ifs-logo-header.jpg"
          alt="Ambassade de France / Institut Fran\u00e7ais"
          className={fullSize ? 'h-20' : 'h-12'}
        />
      </div>

      {/* ── Espacement ───────────────────────────────────────────────── */}
      <div className={fullSize ? 'h-16' : 'h-6'} />

      {/* ── Titre ────────────────────────────────────────────────────── */}
      <h1
        className="text-center font-normal"
        style={{ fontSize: fullSize ? '18pt' : '15pt' }}
      >
        ATTESTATION DE TRAVAIL
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
        Je soussign\u00e9,{' '}
        <RedField value={signataire} placeholder="________________" />,{' '}
        <RedField value={fonctionSignataire} placeholder="________________" />{' '}
        de l&apos;Institut Fran\u00e7ais du S\u00e9n\u00e9gal, atteste par la pr\u00e9sente que{' '}
        <RedField value={employe} placeholder="________________" />,{' '}
        n\u00e9(e) le{' '}
        <RedField value={dateNaissance} placeholder="________________" />{' '}
        \u00e0 {lieuNaissance || '________________'},{' '}
        est{' '}
        <RedField value={poste} placeholder="________________" />{' '}
        au service de notre Etablissement, depuis le{' '}
        <RedField value={dateEmbauche} placeholder="________________" />.
      </p>

      {/* ── Phrase de clôture ────────────────────────────────────────── */}
      <p
        className="text-justify mt-4"
        style={{
          fontSize: fullSize ? '14pt' : '11pt',
          textIndent: '2em',
        }}
      >
        La pr\u00e9sente attestation lui est d\u00e9livr\u00e9e pour servir et valoir ce que de droit.
      </p>

      {/* ── Date ─────────────────────────────────────────────────────── */}
      <p
        className="mt-6"
        style={{
          fontSize: fullSize ? '14pt' : '11pt',
          textIndent: '2em',
        }}
      >
        Fait \u00e0 {lieuFait || '________'}, le{' '}
        <span className="text-red-600">{dateFait || '________________'}</span>.
      </p>

      {/* ── Bloc signature ───────────────────────────────────────────── */}
      <div
        className="text-center mt-16"
        style={{
          fontSize: fullSize ? '14pt' : '11pt',
          marginLeft: '35%',
        }}
      >
        <p>Le {fonctionSignataire || 'Secr\u00e9taire G\u00e9n\u00e9ral'} de</p>
        <p>L&apos;Institut Fran\u00e7ais du S\u00e9n\u00e9gal</p>

        <div className={fullSize ? 'h-24' : 'h-12'} />

        <p className="font-bold">
          {signataire || '________________'}
        </p>
      </div>

      {/* ── Pied de page ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-4 right-6 text-xs text-slate-400"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        Page 1 sur 1
      </div>
    </div>
  )
}
