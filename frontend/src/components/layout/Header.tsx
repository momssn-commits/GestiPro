'use client'

import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useState } from 'react'

export function Header() {
  const { user } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-surface-200 h-14 shadow-sm">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher un document, collaborateur..."
          className="input pl-10 py-1.5 text-xs h-8"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-surface-200">
          <div className="w-8 h-8 rounded-full bg-brand/8 flex items-center justify-center">
            <span className="text-brand text-xs font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
