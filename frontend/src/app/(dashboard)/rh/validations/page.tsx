import { ValidationQueue } from '@/components/rh/ValidationQueue'

export default function ValidationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Circuit de validation</h1>
        <p className="text-slate-500 text-sm mt-1">Demandes en attente de validation hiérarchique</p>
      </div>
      <ValidationQueue />
    </div>
  )
}
