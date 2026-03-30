'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  User,
  FolderOpen,
  GraduationCap,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Briefcase,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

interface NavChild {
  label: string
  href: string
  roles?: string[]
}

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  roles?: string[]
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Espace RH',
    icon: User,
    children: [
      { label: 'Mon dossier',  href: '/rh/dossier' },
      { label: 'Attestations', href: '/rh/attestations' },
      { label: 'Validations',  href: '/rh/validations', roles: ['admin', 'rh', 'manager'] },
    ],
  },
  {
    label: 'Documents',
    icon: FolderOpen,
    roles: ['admin', 'rh', 'manager'],
    children: [
      { label: 'Dépôt de fichiers', href: '/documents/depot' },
      { label: 'Workflow',          href: '/documents/workflow' },
      { label: 'Tableau de bord',   href: '/documents/tableau-de-bord' },
    ],
  },
  { label: 'Formation', href: '/formation', icon: GraduationCap, roles: ['admin', 'rh', 'manager'] },
  { label: 'Services',  href: '/services',  icon: Briefcase },
  {
    label: 'Administration',
    icon: ShieldCheck,
    roles: ['admin'],
    children: [
      { label: 'Utilisateurs', href: '/admin/utilisateurs' },
    ],
  },
]

function NavGroup({ item, role }: { item: NavItem; role: string }) {
  const pathname = usePathname()
  const visibleChildren = item.children?.filter(c => !c.roles || c.roles.includes(role))
  const isActive = item.href
    ? pathname === item.href
    : visibleChildren?.some(c => pathname.startsWith(c.href)) ?? false
  const [open, setOpen] = useState(isActive)

  if (item.href) {
    return (
      <Link
        href={item.href}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-indigo-200 hover:bg-white/10 hover:text-white'
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive ? 'text-white' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
        )}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
      </button>

      {open && (
        <div className="ml-7 mt-1 space-y-0.5 border-l border-white/20 pl-3">
          {visibleChildren?.map(child => {
            const childActive = pathname === child.href
            return (
              <Link
                key={child.href}
                href={child.href}
                className={clsx(
                  'block px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  childActive
                    ? 'text-white bg-white/15'
                    : 'text-indigo-300 hover:text-white hover:bg-white/10'
                )}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside
      className="flex flex-col bg-sidebar border-r border-sidebar-border h-screen"
      style={{ width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">G</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm">GestiPro</p>
          <p className="text-indigo-300 text-xs truncate">Plateforme RH & Docs</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-1">Navigation</p>
        {navItems
          .filter(item => !item.roles || item.roles.includes(user?.role ?? ''))
          .map(item => (
            <NavGroup key={item.label} item={item} role={user?.role ?? ''} />
          ))}

        <div className="pt-4 mt-4 border-t border-white/10">
          <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Système</p>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-200 hover:bg-white/10 hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </Link>
        </div>
      </nav>

      {/* User profile */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-indigo-300 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-indigo-300 hover:text-white transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
