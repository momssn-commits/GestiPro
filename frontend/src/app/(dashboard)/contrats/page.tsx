import { ContratsList } from '@/components/contrats/ContratsList'
import { ContratUpload } from '@/components/contrats/ContratUpload'
import { ContratTemplates } from '@/components/contrats/ContratTemplates'

export default function ContratsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contrats</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez et suivez vos contrats</p>
        </div>
        <ContratUpload />
      </div>
      <ContratTemplates />
      <ContratsList />
    </div>
  )
}
