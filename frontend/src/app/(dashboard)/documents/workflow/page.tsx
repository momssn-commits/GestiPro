import { WorkflowBoard } from '@/components/documents/WorkflowBoard'

export default function WorkflowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Workflow de validation</h1>
        <p className="text-slate-500 text-sm mt-1">Suivi des 4 étapes : Dépôt → Vérification → Approbation → Archivage</p>
      </div>
      <WorkflowBoard />
    </div>
  )
}
