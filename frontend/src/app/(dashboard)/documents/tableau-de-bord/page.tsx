import { DocumentStats } from '@/components/documents/DocumentStats'
import { DocumentsTable } from '@/components/documents/DocumentsTable'

export default function TableauDeBordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord documentaire</h1>
        <p className="text-slate-500 text-sm mt-1">Statistiques et suivi des documents</p>
      </div>
      <DocumentStats />
      <DocumentsTable />
    </div>
  )
}
