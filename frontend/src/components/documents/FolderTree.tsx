'use client'

import { useState } from 'react'
import {
  Folder, FolderOpen, FolderPlus, Trash2, ChevronRight, ChevronDown,
  Users, User, LayoutGrid, X, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useFolders, useCreateFolder, useDeleteFolder } from '@/hooks/useFolders'
import { useAuthStore } from '@/store/auth'
import type { Folder as FolderType } from '@/lib/types'
import toast from 'react-hot-toast'

// ─── Palette de couleurs ──────────────────────────────────────────────────────
const COLOR_DOT: Record<string, string> = {
  indigo: 'bg-indigo-400', blue: 'bg-blue-400',   sky: 'bg-sky-400',
  violet: 'bg-violet-400', pink: 'bg-pink-400',   red: 'bg-red-400',
  amber:  'bg-amber-400',  green: 'bg-green-400', teal: 'bg-teal-400',
  orange: 'bg-orange-400', slate: 'bg-slate-400',
}
const COLORS = Object.keys(COLOR_DOT)

// ─── Construire l'arbre depuis la liste plate ─────────────────────────────────
function buildTree(folders: FolderType[]): FolderType[] {
  const map: Record<string, FolderType> = {}
  folders.forEach(f => { map[f.id] = { ...f, children: [] } })
  const roots: FolderType[] = []
  folders.forEach(f => {
    if (f.parentId && map[f.parentId]) {
      map[f.parentId].children!.push(map[f.id])
    } else {
      roots.push(map[f.id])
    }
  })
  return roots
}

// ─── Formulaire de création de dossier ───────────────────────────────────────
function NewFolderForm({ parentId, onClose }: { parentId?: string | null; onClose: () => void }) {
  const [name, setName]     = useState('')
  const [color, setColor]   = useState('indigo')
  const create              = useCreateFolder()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nom requis'); return }
    await create.mutateAsync({ name: name.trim(), parentId: parentId ?? null, color })
    onClose()
  }

  return (
    <form onSubmit={submit} className="mt-1 mb-2 px-2 space-y-2">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom du dossier"
        className="input text-sm py-1.5"
      />
      <div className="flex items-center gap-1 flex-wrap">
        {COLORS.map(c => (
          <button
            key={c} type="button"
            onClick={() => setColor(c)}
            className={clsx(
              'w-4 h-4 rounded-full transition-all',
              COLOR_DOT[c],
              color === c ? 'ring-2 ring-offset-1 ring-brand scale-125' : 'opacity-60 hover:opacity-100'
            )}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={create.isPending} className="btn-primary py-1 px-3 text-xs flex-1 justify-center">
          {create.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Créer'}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary py-1 px-3 text-xs">
          <X className="w-3 h-3" />
        </button>
      </div>
    </form>
  )
}

// ─── Nœud d'arbre récursif ────────────────────────────────────────────────────
function FolderNode({ folder, selectedId, onSelect, depth, canManage }: {
  folder:     FolderType
  selectedId: string | null
  onSelect:   (id: string | null) => void
  depth:      number
  canManage:  boolean
}) {
  const [open,      setOpen]      = useState(false)
  const [creating,  setCreating]  = useState(false)
  const [hovering,  setHovering]  = useState(false)
  const deleteFolder              = useDeleteFolder()

  const hasChildren = (folder.children?.length ?? 0) > 0 || folder.documentCount > 0
  const isSelected  = selectedId === folder.id

  const dot = COLOR_DOT[folder.color] ?? COLOR_DOT.indigo

  return (
    <div>
      <div
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group',
          isSelected ? 'bg-brand/10 text-brand' : 'hover:bg-surface-200 text-slate-700',
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => {
          onSelect(isSelected ? null : folder.id)
          if (folder.children?.length) setOpen(v => !v)
        }}
      >
        {/* Chevron d'expansion */}
        {(folder.children?.length ?? 0) > 0 ? (
          <button
            onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}

        {/* Icône dossier + point couleur */}
        <span className="relative flex-shrink-0">
          {open || isSelected
            ? <FolderOpen className="w-4 h-4" />
            : <Folder     className="w-4 h-4" />
          }
          <span className={clsx('absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white', dot)} />
        </span>

        <span className="flex-1 text-xs font-medium truncate">{folder.name}</span>

        {folder.documentCount > 0 && (
          <span className={clsx(
            'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
            isSelected ? 'bg-brand/20 text-brand' : 'bg-surface-200 text-slate-500'
          )}>
            {folder.documentCount}
          </span>
        )}

        {/* Actions (visible au hover) */}
        {canManage && hovering && !folder.isSystem && (
          <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setCreating(v => !v)}
              className="p-0.5 rounded text-slate-400 hover:text-brand hover:bg-brand/10 transition-colors"
              title="Sous-dossier"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Supprimer "${folder.name}" ?`)) deleteFolder.mutate(folder.id)
              }}
              className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {creating && (
        <NewFolderForm parentId={folder.id} onClose={() => setCreating(false)} />
      )}

      {open && (folder.children ?? []).map(child => (
        <FolderNode
          key={child.id}
          folder={child}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
          canManage={canManage}
        />
      ))}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface FolderTreeProps {
  selectedFolderId:  string | null
  selectedServiceId: string | null
  selectedUserId:    string | null
  onSelectFolder:    (id: string | null) => void
  onSelectService:   (id: string | null) => void
  onSelectUser:      (id: string | null) => void
}

export function FolderTree({
  selectedFolderId, selectedServiceId, selectedUserId,
  onSelectFolder, onSelectService, onSelectUser,
}: FolderTreeProps) {
  const [creating, setCreating] = useState(false)
  const { data: folders = [], isLoading } = useFolders()
  const { user } = useAuthStore()
  const canManage = user?.role === 'admin' || user?.role === 'rh' || user?.role === 'manager'

  const tree = buildTree(folders)

  const isAllSelected     = !selectedFolderId && !selectedServiceId && !selectedUserId
  const isByServiceActive = !!selectedServiceId
  const isByUserActive    = !!selectedUserId

  return (
    <aside className="w-60 flex-shrink-0 space-y-1">
      {/* Tous les fichiers */}
      <button
        onClick={() => { onSelectFolder(null); onSelectService(null); onSelectUser(null) }}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isAllSelected ? 'bg-brand text-white' : 'text-slate-600 hover:bg-surface-200'
        )}
      >
        <LayoutGrid className="w-4 h-4 flex-shrink-0" />
        Tous les fichiers
      </button>

      {/* Section Dossiers */}
      <div className="pt-2">
        <div className="flex items-center justify-between px-2 mb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Répertoires
          </span>
          {canManage && (
            <button
              onClick={() => setCreating(v => !v)}
              className="text-slate-400 hover:text-brand transition-colors"
              title="Nouveau dossier"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {creating && <NewFolderForm parentId={null} onClose={() => setCreating(false)} />}

        {isLoading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
            <Loader2 className="w-3 h-3 animate-spin" />Chargement…
          </div>
        ) : tree.length === 0 ? (
          <p className="px-3 py-2 text-xs text-slate-400 italic">Aucun dossier</p>
        ) : tree.map(folder => (
          <FolderNode
            key={folder.id}
            folder={folder}
            selectedId={selectedFolderId}
            onSelect={id => { onSelectFolder(id); onSelectService(null); onSelectUser(null) }}
            depth={0}
            canManage={canManage}
          />
        ))}
      </div>

      {/* Par service */}
      <div className="pt-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
          Par service
        </p>
        <ServiceFilter
          selected={selectedServiceId}
          onSelect={id => { onSelectService(id); onSelectFolder(null); onSelectUser(null) }}
        />
      </div>

      {/* Par employé (admin/rh only) */}
      {canManage && (
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
            Par employé
          </p>
          <EmployeeFilter
            selected={selectedUserId}
            onSelect={id => { onSelectUser(id); onSelectFolder(null); onSelectService(null) }}
          />
        </div>
      )}
    </aside>
  )
}

// ─── Filtre par service ───────────────────────────────────────────────────────
import { useServices } from '@/hooks/useServices'

function ServiceFilter({ selected, onSelect }: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const { data: services = [] } = useServices()
  const list = Array.isArray(services) ? services : []

  return (
    <div className="space-y-0.5">
      {list.map(s => (
        <button
          key={s.id}
          onClick={() => onSelect(selected === s.id ? null : s.id)}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
            selected === s.id ? 'bg-brand/10 text-brand font-medium' : 'text-slate-600 hover:bg-surface-200'
          )}
        >
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{s.name}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Filtre par employé ───────────────────────────────────────────────────────
import { useAdminUsers } from '@/hooks/useAdmin'

function EmployeeFilter({ selected, onSelect }: {
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const { data } = useAdminUsers()
  const users: { id: string; firstName: string; lastName: string }[] =
    Array.isArray(data) ? data : (data as { data?: { id: string; firstName: string; lastName: string }[] })?.data ?? []

  return (
    <div className="space-y-0.5 max-h-40 overflow-y-auto">
      {users.map(u => (
        <button
          key={u.id}
          onClick={() => onSelect(selected === u.id ? null : u.id)}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
            selected === u.id ? 'bg-brand/10 text-brand font-medium' : 'text-slate-600 hover:bg-surface-200'
          )}
        >
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{u.firstName} {u.lastName}</span>
        </button>
      ))}
    </div>
  )
}
