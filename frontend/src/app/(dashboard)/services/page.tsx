import { ServicesList } from '@/components/services/ServicesList'

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Services</h1>
        <p className="text-slate-500 text-sm mt-1">Groupes de travail de l&apos;organisation</p>
      </div>
      <ServicesList />
    </div>
  )
}
