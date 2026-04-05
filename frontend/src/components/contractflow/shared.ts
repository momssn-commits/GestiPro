// ── Types et constantes d'affichage ContractFlow ─────────────────────────────
// Les types Acte, ActeHistory, ActeComment, payloads → voir @/lib/types

export type { ActeStatut as ActeStatus, ActeType, Acte } from '@/lib/types'

export const STATUS_LABEL: Record<string, string> = {
  brouillon:      'Brouillon',
  en_instruction: 'En instruction',
  en_validation:  'En validation',
  signe:          'Signé',
  archive:        'Archivé',
  rejete:         'Rejeté',
}

export const STATUS_COLOR: Record<string, string> = {
  brouillon:      'bg-slate-100 text-slate-600',
  en_instruction: 'bg-amber-100 text-amber-700',
  en_validation:  'bg-blue-100 text-blue-700',
  signe:          'bg-green-100 text-green-700',
  archive:        'bg-purple-100 text-purple-700',
  rejete:         'bg-red-100 text-red-700',
}

export const TYPE_LABEL: Record<string, string> = {
  convention:         'Convention de partenariat',
  contrat_prestation: 'Contrat de prestation',
  accord_cadre:       'Accord-cadre',
  protocole:          'Protocole d\'accord',
  avenant:            'Avenant',
}
