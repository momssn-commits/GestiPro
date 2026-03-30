import { DossierPersonnel } from '@/components/rh/DossierPersonnel'

export default function DossierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mon dossier personnel</h1>
        <p className="text-slate-500 text-sm mt-1">Informations professionnelles et documents RH</p>
      </div>
      <DossierPersonnel />
    </div>
  )
}
