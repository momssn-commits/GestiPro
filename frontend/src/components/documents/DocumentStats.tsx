'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const data = [
  { name: 'Devis',    count: 18, color: '#4f6ef7' },
  { name: 'APD',      count: 12, color: '#a855f7' },
  { name: 'Factures', count: 35, color: '#22c55e' },
  { name: 'Contrats', count: 8,  color: '#eab308' },
  { name: 'Autres',   count: 5,  color: '#06b6d4' },
]

export function DocumentStats() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card lg:col-span-2">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Documents par catégorie</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#1e293b' }}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Statut global</h3>
        {[
          { label: 'En dépôt',      value: 5,  color: 'bg-brand' },
          { label: 'En vérification', value: 8, color: 'bg-accent-yellow' },
          { label: 'En approbation', value: 3,  color: 'bg-accent-green' },
          { label: 'Archivés',      value: 62, color: 'bg-accent-purple' },
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">{s.label}</span>
              <span className="text-slate-900 font-medium">{s.value}</span>
            </div>
            <div className="h-1.5 bg-surface-300 rounded-full">
              <div
                className={`h-1.5 rounded-full ${s.color}`}
                style={{ width: `${(s.value / 78) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
