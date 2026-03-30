'use client'

import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import type { Service } from '@/lib/types'

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  dot: 'bg-indigo-500' },
  slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-500' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600',   dot: 'bg-amber-500' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600',  dot: 'bg-violet-500' },
  pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    dot: 'bg-pink-500' },
  red:     { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
  sky:     { bg: 'bg-sky-50',     text: 'text-sky-600',     dot: 'bg-sky-500' },
  green:   { bg: 'bg-green-50',   text: 'text-green-600',   dot: 'bg-green-500' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  dot: 'bg-orange-500' },
  teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    dot: 'bg-teal-500' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  dot: 'bg-purple-500' },
}

export function ServiceCard({ service }: { service: Service }) {
  const c = COLOR_MAP[service.color] ?? COLOR_MAP.indigo

  return (
    <Link
      href={`/services/${service.code}`}
      className="card group flex flex-col gap-4 hover:border-slate-300 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
          <div className={`w-3 h-3 rounded-full ${c.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand transition-colors truncate">
            {service.name}
          </h3>
          {service.chefFirstName && (
            <p className="text-xs text-slate-500 mt-0.5">
              Chef : {service.chefFirstName} {service.chefLastName}
            </p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-colors flex-shrink-0" />
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{service.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-surface-200">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">
            {service.memberCount} {service.memberCount > 1 ? 'membres' : 'membre'}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
          {service.code}
        </span>
      </div>
    </Link>
  )
}
