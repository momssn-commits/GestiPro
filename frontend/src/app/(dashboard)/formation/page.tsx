import { FormationCatalog } from '@/components/formation/FormationCatalog'
import { MyFormations } from '@/components/formation/MyFormations'

export default function FormationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Centre de formation</h1>
        <p className="text-slate-500 text-sm mt-1">Catalogue de formations et suivi de progression</p>
      </div>
      <MyFormations />
      <FormationCatalog />
    </div>
  )
}
