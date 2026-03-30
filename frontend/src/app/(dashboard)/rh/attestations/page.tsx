import { AttestationsList } from '@/components/rh/AttestationsList'
import { GenerateAttestation } from '@/components/rh/GenerateAttestation'

export default function AttestationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attestations de travail</h1>
          <p className="text-slate-500 text-sm mt-1">Générez et suivez vos attestations</p>
        </div>
        <GenerateAttestation />
      </div>
      <AttestationsList />
    </div>
  )
}
