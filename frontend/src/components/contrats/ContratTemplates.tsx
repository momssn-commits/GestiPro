'use client'

import { useState } from 'react'
import { X, Download, Eye, FileSignature, FileText, Handshake, Plane, ScrollText } from 'lucide-react'

// ── PDF export ───────────────────────────────────────────────────────────────
async function exportPdf(elementId: string, filename: string) {
  const { default: html2canvas } = await import('html2canvas')
  const { default: jsPDF }       = await import('jspdf')
  const el = document.getElementById(elementId)
  if (!el) throw new Error(`#${elementId} introuvable`)
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
  const imgData   = canvas.toDataURL('image/jpeg', 0.97)
  const pdfW = 215.9; const pdfH = 279.4
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfW, pdfH] })
  const ratio = canvas.height / canvas.width
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(pdfW * ratio, pdfH))
  pdf.save(filename)
}

// ── Shared field types ───────────────────────────────────────────────────────
interface Field { key: string; label: string; placeholder: string; value: string; type?: 'text' | 'textarea' }
type Fields = Field[]

// ── Bold variable field ──────────────────────────────────────────────────────
function V({ value, placeholder }: { value: string; placeholder: string }) {
  return <span className="font-bold" style={{ color: '#000000' }}>{value || placeholder}</span>
}

// ── Shared doc header (logo IFS) ─────────────────────────────────────────────
function DocHeader({ fullSize }: { fullSize?: boolean }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <img src="/images/ifs-logo-header.jpg" alt="IFS" className={fullSize ? 'h-20' : 'h-12'} />
    </div>
  )
}

// ── Shared modal frame ───────────────────────────────────────────────────────
interface ModalProps {
  title: string
  fields: Fields
  onChange: (key: string, val: string) => void
  previewContent: React.ReactNode
  previewId: string
  filename: string
  onClose: () => void
}
function DocModal({ title, fields, onChange, previewContent, previewId, filename, onClose }: ModalProps) {
  const [fullPreview, setFullPreview] = useState(false)
  const [loading, setLoading]         = useState(false)
  const isComplete = fields.every(f => f.value.trim() !== '')

  const handleExport = async () => {
    setLoading(true)
    try { await exportPdf(previewId, filename) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Remplissez les champs puis exportez en PDF</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
            {/* Form */}
            <div className="lg:w-1/2 p-6 space-y-3 border-r border-slate-100 overflow-y-auto">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Champs à remplir</h3>
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {f.label} <span className="text-red-500">*</span>
                  </label>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={f.value}
                      onChange={e => onChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={f.value}
                      onChange={e => onChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="lg:w-1/2 p-6 bg-slate-50 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aperçu</h3>
                <button onClick={() => setFullPreview(true)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Plein écran
                </button>
              </div>
              <div id={previewId}>{previewContent}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
            <p className="text-xs text-slate-500">
              {isComplete ? '✅ Tous les champs sont remplis' : `⚠️ ${fields.filter(f => !f.value.trim()).length} champ(s) restant(s)`}
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition">
                Annuler
              </button>
              <button
                onClick={handleExport}
                disabled={!isComplete || loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                {loading ? 'Génération...' : 'Exporter en PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full preview */}
      {fullPreview && (
        <div className="fixed inset-0 z-[60] bg-white overflow-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <button onClick={() => setFullPreview(false)} className="btn-secondary py-1.5 text-xs">
              <X className="w-4 h-4" /> Fermer
            </button>
          </div>
          <div className="flex justify-center py-8">
            <div className="w-[210mm] min-h-[297mm]" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              {previewContent}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DÉCISION D'ATTRIBUTION D'UN FINANCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
const DECISION_INIT: Fields = [
  { key: 'numDecision',         label: 'Numéro de décision',        placeholder: 'Ex: 2024-001'                      , value: '' },
  { key: 'annee',               label: 'Année',                     placeholder: 'Ex: 2024'                          , value: '' },
  { key: 'signataire',          label: 'Nom du signataire',         placeholder: 'Ex: François CHABANET'             , value: '' },
  { key: 'fonctionSignataire',  label: 'Fonction du signataire',    placeholder: 'Ex: Secrétaire Général'            , value: '' },
  { key: 'beneficiaire',        label: 'Bénéficiaire',              placeholder: 'Ex: Association Culturelle Dakar'  , value: '' },
  { key: 'objet',               label: 'Objet du financement',      placeholder: 'Ex: Soutien à la création artistique', value: '', type: 'textarea' },
  { key: 'montant',             label: 'Montant (chiffres)',        placeholder: 'Ex: 500 000 FCFA'                  , value: '' },
  { key: 'montantLettres',      label: 'Montant (lettres)',         placeholder: 'Ex: Cinq cent mille francs CFA'    , value: '' },
  { key: 'exercice',            label: 'Exercice budgétaire',       placeholder: 'Ex: 2024'                          , value: '' },
  { key: 'lieuFait',            label: 'Lieu',                      placeholder: 'Ex: Dakar'                         , value: '' },
  { key: 'dateFait',            label: 'Date',                      placeholder: 'Ex: 15 mars 2024'                  , value: '' },
]

function DecisionPreview({ fields }: { fields: Fields }) {
  const v = (k: string) => fields.find(f => f.key === k)?.value || ''
  return (
    <div className="bg-white border border-slate-300 shadow-lg w-full relative" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000', padding: '20px 24px', fontSize: '10pt', minHeight: '400px' }}>
      <DocHeader />
      <div className="text-center mb-2" style={{ fontSize: '9pt' }}>
        INSTITUT FRANÇAIS DU SÉNÉGAL
      </div>
      <div className="text-right mb-6" style={{ fontSize: '9pt' }}>
        <V value={v('lieuFait')} placeholder="Lieu" />, le <V value={v('dateFait')} placeholder="Date" />
      </div>
      <div className="text-center mb-1 font-bold underline" style={{ fontSize: '11pt', letterSpacing: '1px' }}>
        DÉCISION N° <V value={v('numDecision')} placeholder="____" /> / <V value={v('annee')} placeholder="AAAA" />
      </div>
      <div className="text-center mb-6 font-bold" style={{ fontSize: '10pt' }}>
        ATTRIBUTION D'UN FINANCEMENT DANS LE CADRE D'UNE DÉPENSE DE TRANSFERT
      </div>
      <p className="mb-3">
        <span className="font-bold">Je soussigné(e),</span> <V value={v('signataire')} placeholder="________________" />,{' '}
        <V value={v('fonctionSignataire')} placeholder="________________" /> de l'Institut Français du Sénégal,
      </p>
      <p className="mb-3 font-bold">DÉCIDE :</p>
      <p className="mb-2">
        <span className="font-bold">Article 1 :</span> D'attribuer à <V value={v('beneficiaire')} placeholder="________________" /> un financement
        dans le cadre d'une dépense de transfert d'un montant de <V value={v('montant')} placeholder="________________" />{' '}
        (<V value={v('montantLettres')} placeholder="________________" />), imputé sur l'exercice budgétaire{' '}
        <V value={v('exercice')} placeholder="____" />.
      </p>
      <p className="mb-4">
        <span className="font-bold">Article 2 :</span> Ce financement est accordé pour :{' '}
        <V value={v('objet')} placeholder="________________" />.
      </p>
      <p className="mb-6">
        <span className="font-bold">Article 3 :</span> La présente décision prend effet à compter de sa date de signature.
      </p>
      <div className="text-right mt-8">
        <p>Le <V value={v('fonctionSignataire')} placeholder="Secrétaire Général" /></p>
        <div className="h-12" />
        <p className="font-bold"><V value={v('signataire')} placeholder="________________" /></p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CONTRAT DE PRESTATION
// ═══════════════════════════════════════════════════════════════════════════════
const PRESTATION_INIT: Fields = [
  { key: 'client',              label: 'Client (nom/organisme)',         placeholder: 'Ex: Institut Français du Sénégal'  , value: '' },
  { key: 'representantClient',  label: 'Représentant du client',        placeholder: 'Ex: François CHABANET, S.G.'       , value: '' },
  { key: 'prestataire',         label: 'Prestataire (nom/entreprise)',  placeholder: 'Ex: SARL Tech Solutions'            , value: '' },
  { key: 'representantPrestataire', label: 'Représentant du prestataire', placeholder: 'Ex: Mamadou DIOP, Directeur'     , value: '' },
  { key: 'objet',               label: 'Objet de la prestation',        placeholder: 'Ex: Maintenance du parc informatique', value: '', type: 'textarea' },
  { key: 'montant',             label: 'Montant (FCFA)',                placeholder: 'Ex: 1 200 000 FCFA TTC'             , value: '' },
  { key: 'duree',               label: 'Durée du contrat',              placeholder: 'Ex: 12 mois'                        , value: '' },
  { key: 'dateDebut',           label: 'Date de début',                 placeholder: 'Ex: 1er janvier 2024'               , value: '' },
  { key: 'dateFin',             label: 'Date de fin',                   placeholder: 'Ex: 31 décembre 2024'               , value: '' },
  { key: 'lieuFait',            label: 'Lieu de signature',             placeholder: 'Ex: Dakar'                          , value: '' },
  { key: 'dateFait',            label: 'Date de signature',             placeholder: 'Ex: 02 janvier 2024'                , value: '' },
]

function PrestationPreview({ fields }: { fields: Fields }) {
  const v = (k: string) => fields.find(f => f.key === k)?.value || ''
  return (
    <div className="bg-white border border-slate-300 shadow-lg w-full relative" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000', padding: '20px 24px', fontSize: '10pt', minHeight: '400px' }}>
      <DocHeader />
      <div className="text-center mb-6">
        <p className="font-bold underline" style={{ fontSize: '13pt', letterSpacing: '1px' }}>CONTRAT DE PRESTATION DE SERVICES</p>
      </div>
      <p className="mb-4">Entre les soussignés :</p>
      <p className="mb-2">
        <span className="font-bold">Le Client :</span> <V value={v('client')} placeholder="________________" />,
        représenté par <V value={v('representantClient')} placeholder="________________" />,
        ci-après dénommé « <span className="font-bold">LE CLIENT</span> »,
      </p>
      <p className="mb-4">
        D'une part, et
      </p>
      <p className="mb-4">
        <span className="font-bold">Le Prestataire :</span> <V value={v('prestataire')} placeholder="________________" />,
        représenté par <V value={v('representantPrestataire')} placeholder="________________" />,
        ci-après dénommé « <span className="font-bold">LE PRESTATAIRE</span> »,
      </p>
      <p className="mb-4">D'autre part.</p>
      <p className="mb-2 font-bold">Il a été convenu ce qui suit :</p>
      <p className="mb-2">
        <span className="font-bold">Article 1 – Objet :</span>{' '}
        <V value={v('objet')} placeholder="________________" />
      </p>
      <p className="mb-2">
        <span className="font-bold">Article 2 – Durée :</span> Le présent contrat est conclu pour une durée de{' '}
        <V value={v('duree')} placeholder="________________" />, du{' '}
        <V value={v('dateDebut')} placeholder="________________" /> au{' '}
        <V value={v('dateFin')} placeholder="________________" />.
      </p>
      <p className="mb-4">
        <span className="font-bold">Article 3 – Rémunération :</span> En contrepartie des prestations fournies,
        le Client s'engage à verser au Prestataire la somme de{' '}
        <V value={v('montant')} placeholder="________________" />.
      </p>
      <div className="flex justify-between mt-8" style={{ fontSize: '9.5pt' }}>
        <div className="text-center w-2/5">
          <p>Pour le Client</p>
          <div className="h-12" />
          <p className="font-bold"><V value={v('representantClient')} placeholder="________________" /></p>
        </div>
        <div className="text-center w-2/5">
          <p>Pour le Prestataire</p>
          <div className="h-12" />
          <p className="font-bold"><V value={v('representantPrestataire')} placeholder="________________" /></p>
        </div>
      </div>
      <p className="text-right mt-4" style={{ fontSize: '9pt' }}>
        Fait à <V value={v('lieuFait')} placeholder="________________" />, le <V value={v('dateFait')} placeholder="________________" />
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CONVENTION DE PARTENARIAT
// ═══════════════════════════════════════════════════════════════════════════════
const CONVENTION_INIT: Fields = [
  { key: 'partieA',           label: 'Première partie (organisme)',    placeholder: 'Ex: Institut Français du Sénégal'   , value: '' },
  { key: 'representantA',     label: 'Représentant partie A',          placeholder: 'Ex: François CHABANET, S.G.'        , value: '' },
  { key: 'partieB',           label: 'Deuxième partie (organisme)',    placeholder: 'Ex: Université Cheikh Anta Diop'    , value: '' },
  { key: 'representantB',     label: 'Représentant partie B',          placeholder: 'Ex: Pr. Ibrahima THIAM, Recteur'   , value: '' },
  { key: 'objet',             label: 'Objet de la convention',         placeholder: 'Ex: Coopération culturelle et éducative', value: '', type: 'textarea' },
  { key: 'obligations',       label: 'Engagements principaux',         placeholder: "Ex: Échange d'expertise, co-organisation d'événements", value: '', type: 'textarea' },
  { key: 'duree',             label: 'Durée de la convention',         placeholder: 'Ex: 3 ans renouvelables'            , value: '' },
  { key: 'dateEntreeVigueur', label: 'Date d\'entrée en vigueur',      placeholder: 'Ex: 1er mars 2024'                  , value: '' },
  { key: 'lieuFait',          label: 'Lieu de signature',              placeholder: 'Ex: Dakar'                          , value: '' },
  { key: 'dateFait',          label: 'Date de signature',              placeholder: 'Ex: 28 février 2024'                , value: '' },
]

function ConventionPreview({ fields }: { fields: Fields }) {
  const v = (k: string) => fields.find(f => f.key === k)?.value || ''
  return (
    <div className="bg-white border border-slate-300 shadow-lg w-full relative" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000', padding: '20px 24px', fontSize: '10pt', minHeight: '400px' }}>
      <DocHeader />
      <div className="text-center mb-6">
        <p className="font-bold underline" style={{ fontSize: '13pt', letterSpacing: '1px' }}>CONVENTION DE PARTENARIAT</p>
      </div>
      <p className="mb-4">Entre :</p>
      <p className="mb-2">
        <V value={v('partieA')} placeholder="________________" />,
        représenté(e) par <V value={v('representantA')} placeholder="________________" />,
        ci-après dénommé(e) « <span className="font-bold">LA PREMIÈRE PARTIE</span> »,
      </p>
      <p className="mb-4">Et :</p>
      <p className="mb-4">
        <V value={v('partieB')} placeholder="________________" />,
        représenté(e) par <V value={v('representantB')} placeholder="________________" />,
        ci-après dénommé(e) « <span className="font-bold">LA DEUXIÈME PARTIE</span> ».
      </p>
      <p className="mb-2 font-bold">Il est convenu ce qui suit :</p>
      <p className="mb-2">
        <span className="font-bold">Article 1 – Objet :</span>{' '}
        <V value={v('objet')} placeholder="________________" />
      </p>
      <p className="mb-2">
        <span className="font-bold">Article 2 – Engagements :</span>{' '}
        <V value={v('obligations')} placeholder="________________" />
      </p>
      <p className="mb-4">
        <span className="font-bold">Article 3 – Durée :</span> La présente convention est conclue pour{' '}
        <V value={v('duree')} placeholder="________________" />, prenant effet le{' '}
        <V value={v('dateEntreeVigueur')} placeholder="________________" />.
      </p>
      <div className="flex justify-between mt-8" style={{ fontSize: '9.5pt' }}>
        <div className="text-center w-2/5">
          <p>Pour la Première Partie</p>
          <div className="h-12" />
          <p className="font-bold"><V value={v('representantA')} placeholder="________________" /></p>
        </div>
        <div className="text-center w-2/5">
          <p>Pour la Deuxième Partie</p>
          <div className="h-12" />
          <p className="font-bold"><V value={v('representantB')} placeholder="________________" /></p>
        </div>
      </div>
      <p className="text-right mt-4" style={{ fontSize: '9pt' }}>
        Fait à <V value={v('lieuFait')} placeholder="________________" />, le <V value={v('dateFait')} placeholder="________________" />
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ORDRE DE MISSION
// ═══════════════════════════════════════════════════════════════════════════════
const MISSION_INIT: Fields = [
  { key: 'numOrdre',           label: 'Numéro d\'ordre',              placeholder: 'Ex: OM-2024-015'                    , value: '' },
  { key: 'signataire',         label: 'Nom du signataire',            placeholder: 'Ex: François CHABANET'              , value: '' },
  { key: 'fonctionSignataire', label: 'Fonction du signataire',       placeholder: 'Ex: Secrétaire Général'             , value: '' },
  { key: 'agent',              label: 'Agent(s) désigné(s)',          placeholder: 'Ex: Amadou FALL'                    , value: '' },
  { key: 'fonctionAgent',      label: 'Fonction de l\'agent',         placeholder: 'Ex: Chargé de communication'        , value: '' },
  { key: 'objetMission',       label: 'Objet de la mission',          placeholder: 'Ex: Participation au séminaire...', value: '', type: 'textarea' },
  { key: 'destination',        label: 'Destination',                  placeholder: 'Ex: Saint-Louis, Sénégal'           , value: '' },
  { key: 'dateDepart',         label: 'Date de départ',               placeholder: 'Ex: 15 mars 2024'                   , value: '' },
  { key: 'dateRetour',         label: 'Date de retour',               placeholder: 'Ex: 17 mars 2024'                   , value: '' },
  { key: 'transport',          label: 'Mode de transport',            placeholder: 'Ex: Véhicule de service'            , value: '' },
  { key: 'lieuFait',           label: 'Lieu',                         placeholder: 'Ex: Dakar'                          , value: '' },
  { key: 'dateFait',           label: 'Date',                         placeholder: 'Ex: 12 mars 2024'                   , value: '' },
]

function MissionPreview({ fields }: { fields: Fields }) {
  const v = (k: string) => fields.find(f => f.key === k)?.value || ''
  return (
    <div className="bg-white border border-slate-300 shadow-lg w-full relative" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000', padding: '20px 24px', fontSize: '10pt', minHeight: '400px' }}>
      <DocHeader />
      <div className="flex justify-between mb-2" style={{ fontSize: '9pt' }}>
        <div>
          <p>INSTITUT FRANÇAIS DU SÉNÉGAL</p>
          <p>Réf. : <V value={v('numOrdre')} placeholder="OM-____-___" /></p>
        </div>
        <div className="text-right">
          <p><V value={v('lieuFait')} placeholder="Lieu" />, le <V value={v('dateFait')} placeholder="Date" /></p>
        </div>
      </div>
      <div className="text-center mb-6">
        <p className="font-bold underline" style={{ fontSize: '13pt', letterSpacing: '1px' }}>ORDRE DE MISSION</p>
      </div>
      <p className="mb-4">
        <span className="font-bold">Je soussigné(e),</span> <V value={v('signataire')} placeholder="________________" />,{' '}
        <V value={v('fonctionSignataire')} placeholder="________________" /> de l'Institut Français du Sénégal,
      </p>
      <p className="mb-4 font-bold">DONNE ORDRE DE MISSION À :</p>
      <table className="w-full mb-4" style={{ fontSize: '9.5pt', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            ['Nom et prénom(s)', v('agent')],
            ['Fonction',        v('fonctionAgent')],
            ['Destination',     v('destination')],
            ['Objet',           v('objetMission')],
            ['Date de départ',  v('dateDepart')],
            ['Date de retour',  v('dateRetour')],
            ['Transport',       v('transport')],
          ].map(([label, val]) => (
            <tr key={label} style={{ borderBottom: '1px solid #ddd' }}>
              <td className="font-bold py-1 pr-3 w-1/3">{label} :</td>
              <td className="py-1"><V value={val} placeholder="________________" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mb-6 text-sm">Le présent ordre de mission est établi pour permettre l'accomplissement de la mission ci-dessus désignée.</p>
      <div className="text-right mt-6">
        <p>Le <V value={v('fonctionSignataire')} placeholder="Secrétaire Général" /></p>
        <div className="h-12" />
        <p className="font-bold"><V value={v('signataire')} placeholder="________________" /></p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. CONTRAT (générique)
// ═══════════════════════════════════════════════════════════════════════════════
const CONTRAT_INIT: Fields = [
  { key: 'numContrat',        label: 'Référence du contrat',          placeholder: 'Ex: CTR-2024-042'                   , value: '' },
  { key: 'partieA',           label: 'Partie A (nom/organisme)',      placeholder: 'Ex: Institut Français du Sénégal'   , value: '' },
  { key: 'representantA',     label: 'Représentant partie A',         placeholder: 'Ex: François CHABANET, S.G.'        , value: '' },
  { key: 'partieB',           label: 'Partie B (nom/organisme)',      placeholder: 'Ex: Entreprise XYZ'                 , value: '' },
  { key: 'representantB',     label: 'Représentant partie B',         placeholder: 'Ex: Jean DUPONT, Directeur'         , value: '' },
  { key: 'objet',             label: 'Objet du contrat',              placeholder: 'Ex: Fourniture de matériaux...'     , value: '', type: 'textarea' },
  { key: 'obligations',       label: 'Obligations des parties',       placeholder: 'Ex: La partie A s\'engage à...'    , value: '', type: 'textarea' },
  { key: 'montant',           label: 'Conditions financières',        placeholder: 'Ex: 800 000 FCFA TTC'               , value: '' },
  { key: 'duree',             label: 'Durée',                         placeholder: 'Ex: 6 mois'                         , value: '' },
  { key: 'dateDebut',         label: 'Date de début',                 placeholder: 'Ex: 1er avril 2024'                 , value: '' },
  { key: 'dateFin',           label: 'Date de fin',                   placeholder: 'Ex: 30 septembre 2024'              , value: '' },
  { key: 'lieuFait',          label: 'Lieu de signature',             placeholder: 'Ex: Dakar'                          , value: '' },
  { key: 'dateFait',          label: 'Date de signature',             placeholder: 'Ex: 28 mars 2024'                   , value: '' },
]

function ContratPreview({ fields }: { fields: Fields }) {
  const v = (k: string) => fields.find(f => f.key === k)?.value || ''
  return (
    <div className="bg-white border border-slate-300 shadow-lg w-full relative" style={{ fontFamily: '"Times New Roman", Times, serif', color: '#000', padding: '20px 24px', fontSize: '10pt', minHeight: '400px' }}>
      <DocHeader />
      <div className="text-center mb-2" style={{ fontSize: '9pt' }}>
        Réf. : <V value={v('numContrat')} placeholder="CTR-____-___" />
      </div>
      <div className="text-center mb-6">
        <p className="font-bold underline" style={{ fontSize: '13pt', letterSpacing: '1px' }}>CONTRAT</p>
      </div>
      <p className="mb-4">Entre les soussignés :</p>
      <p className="mb-2">
        <V value={v('partieA')} placeholder="________________" />,
        représenté(e) par <V value={v('representantA')} placeholder="________________" />,
        ci-après dénommé(e) « <span className="font-bold">LA PARTIE A</span> »,
      </p>
      <p className="mb-4">Et :</p>
      <p className="mb-4">
        <V value={v('partieB')} placeholder="________________" />,
        représenté(e) par <V value={v('representantB')} placeholder="________________" />,
        ci-après dénommé(e) « <span className="font-bold">LA PARTIE B</span> ».
      </p>
      <p className="mb-3 font-bold">Il a été convenu et arrêté ce qui suit :</p>
      <p className="mb-2">
        <span className="font-bold">Article 1 – Objet :</span>{' '}
        <V value={v('objet')} placeholder="________________" />
      </p>
      <p className="mb-2">
        <span className="font-bold">Article 2 – Obligations des parties :</span>{' '}
        <V value={v('obligations')} placeholder="________________" />
      </p>
      <p className="mb-2">
        <span className="font-bold">Article 3 – Conditions financières :</span>{' '}
        <V value={v('montant')} placeholder="________________" />
      </p>
      <p className="mb-4">
        <span className="font-bold">Article 4 – Durée :</span> Le présent contrat est conclu pour{' '}
        <V value={v('duree')} placeholder="________________" />, du{' '}
        <V value={v('dateDebut')} placeholder="________________" /> au{' '}
        <V value={v('dateFin')} placeholder="________________" />.
      </p>
      <div className="flex justify-between mt-8" style={{ fontSize: '9.5pt' }}>
        <div className="text-center w-2/5">
          <p>Pour la Partie A</p>
          <div className="h-12" />
          <p className="font-bold"><V value={v('representantA')} placeholder="________________" /></p>
        </div>
        <div className="text-center w-2/5">
          <p>Pour la Partie B</p>
          <div className="h-12" />
          <p className="font-bold"><V value={v('representantB')} placeholder="________________" /></p>
        </div>
      </div>
      <p className="text-right mt-4" style={{ fontSize: '9pt' }}>
        Fait à <V value={v('lieuFait')} placeholder="________________" />, le <V value={v('dateFait')} placeholder="________________" />
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — grid of 5 template cards
// ═══════════════════════════════════════════════════════════════════════════════
type DocId = 'decision' | 'prestation' | 'convention' | 'mission' | 'contrat'

const TEMPLATES = [
  {
    id: 'decision' as DocId,
    label: 'Décision d\'attribution d\'un financement dans le cadre d\'une dépense de transfert',
    shortLabel: 'Décision de financement',
    icon: ScrollText,
    color: 'text-amber-600 bg-amber-50',
    init: DECISION_INIT,
    filename: 'Decision_Attribution_Financement.pdf',
  },
  {
    id: 'prestation' as DocId,
    label: 'Contrat de prestation',
    shortLabel: 'Contrat de prestation',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50',
    init: PRESTATION_INIT,
    filename: 'Contrat_de_Prestation.pdf',
  },
  {
    id: 'convention' as DocId,
    label: 'Convention de partenariat',
    shortLabel: 'Convention de partenariat',
    icon: Handshake,
    color: 'text-green-600 bg-green-50',
    init: CONVENTION_INIT,
    filename: 'Convention_de_Partenariat.pdf',
  },
  {
    id: 'mission' as DocId,
    label: 'Ordre de mission',
    shortLabel: 'Ordre de mission',
    icon: Plane,
    color: 'text-purple-600 bg-purple-50',
    init: MISSION_INIT,
    filename: 'Ordre_de_Mission.pdf',
  },
  {
    id: 'contrat' as DocId,
    label: 'Contrat',
    shortLabel: 'Contrat',
    icon: FileSignature,
    color: 'text-slate-600 bg-slate-100',
    init: CONTRAT_INIT,
    filename: 'Contrat.pdf',
  },
]

export function ContratTemplates() {
  const [activeDoc, setActiveDoc] = useState<DocId | null>(null)

  // State for each document's fields
  const [decisionFields, setDecisionFields]     = useState(DECISION_INIT)
  const [prestationFields, setPrestationFields] = useState(PRESTATION_INIT)
  const [conventionFields, setConventionFields] = useState(CONVENTION_INIT)
  const [missionFields, setMissionFields]       = useState(MISSION_INIT)
  const [contratFields, setContratFields]       = useState(CONTRAT_INIT)

  const fieldStateMap: Record<DocId, { fields: Fields; setFields: (f: Fields) => void }> = {
    decision:   { fields: decisionFields,   setFields: setDecisionFields },
    prestation: { fields: prestationFields, setFields: setPrestationFields },
    convention: { fields: conventionFields, setFields: setConventionFields },
    mission:    { fields: missionFields,    setFields: setMissionFields },
    contrat:    { fields: contratFields,    setFields: setContratFields },
  }

  const previewMap: Record<DocId, (fields: Fields) => React.ReactNode> = {
    decision:   (f) => <DecisionPreview fields={f} />,
    prestation: (f) => <PrestationPreview fields={f} />,
    convention: (f) => <ConventionPreview fields={f} />,
    mission:    (f) => <MissionPreview fields={f} />,
    contrat:    (f) => <ContratPreview fields={f} />,
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-700">Modèles de documents</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEMPLATES.map(tpl => {
          const Icon = tpl.icon
          return (
            <button
              key={tpl.id}
              onClick={() => setActiveDoc(tpl.id)}
              className="card text-left hover:shadow-md transition-all hover:border-brand/30 group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tpl.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-brand transition-colors leading-snug">
                    {tpl.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Cliquez pour remplir et exporter en PDF</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Modal for active document */}
      {activeDoc && (() => {
        const tpl   = TEMPLATES.find(t => t.id === activeDoc)!
        const state = fieldStateMap[activeDoc]
        const onChange = (key: string, val: string) =>
          state.setFields(state.fields.map(f => f.key === key ? { ...f, value: val } : f))
        return (
          <DocModal
            key={activeDoc}
            title={tpl.label}
            fields={state.fields}
            onChange={onChange}
            previewContent={previewMap[activeDoc](state.fields)}
            previewId={`contrat-preview-${activeDoc}`}
            filename={tpl.filename}
            onClose={() => setActiveDoc(null)}
          />
        )
      })()}
    </div>
  )
}
