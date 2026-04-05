'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Send, AtSign, Bell,
  CheckCircle2, Clock, FileSignature, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { TYPE_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/components/contractflow/shared'
import type { Acte, ActeComment } from '@/lib/types'
import { useActes, useActeComments, useAddComment } from '@/hooks/useContractflow'

// ── Activité ──────────────────────────────────────────────────────────────────
// (l'historique global serait idéalement un endpoint dédié ; ici on réutilise
//  les données des actes chargés pour construire un journal côté client)

function ActivityItem({ label, numero, titre, author, date, type }: {
  label: string; numero: string; titre: string; author: string; date: string
  type: 'depot' | 'validation' | 'signature' | 'comment' | 'complement'
}) {
  const icon = type === 'signature'
    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
    : type === 'validation'
    ? <Clock className="w-4 h-4 text-blue-500" />
    : type === 'complement'
    ? <MessageSquare className="w-4 h-4 text-amber-500" />
    : <FileSignature className="w-4 h-4 text-slate-400" />

  return (
    <div className="flex items-start gap-3 pb-3 border-b border-surface-50 last:border-0 last:pb-0">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          <span className="font-mono">{numero}</span>
          <span className="mx-1">·</span>
          {titre}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs text-slate-600 font-medium">{author}</p>
        <p className="text-xs text-slate-400">
          {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </p>
      </div>
    </div>
  )
}

// ── Thread ────────────────────────────────────────────────────────────────────
function ChatThread({ acteId, currentUserName }: { acteId: string; currentUserName: string }) {
  const { data: comments = [], isLoading } = useActeComments(acteId)
  const { mutate: addComment, isPending } = useAddComment()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  const send = () => {
    if (!draft.trim()) return
    addComment({ id: acteId, content: draft }, { onSuccess: () => setDraft('') })
  }

  const highlight = (text: string) =>
    text.split(/(@\S+)/g).map((p, i) =>
      p.startsWith('@')
        ? <span key={i} className="text-brand font-semibold">{p}</span>
        : p
    )

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
    </div>
  )

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {(comments as ActeComment[]).length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun message pour cet acte.</p>
            <p className="text-xs mt-1">Utilisez @ pour mentionner un collaborateur.</p>
          </div>
        )}
        {(comments as ActeComment[]).map(msg => {
          const isMe = msg.firstName + ' ' + msg.lastName === currentUserName
          return (
            <div key={msg.id} className={clsx('flex gap-3', isMe && 'flex-row-reverse')}>
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0 text-brand text-xs font-bold">
                {msg.firstName?.[0]}{msg.lastName?.[0]}
              </div>
              <div className={clsx('max-w-[75%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={clsx('text-xs font-semibold', isMe ? 'text-brand' : 'text-slate-700')}>
                    {msg.firstName} {msg.lastName}
                  </span>
                  <span className="text-xs text-slate-400">{msg.authorRole}</span>
                  <span className="text-xs text-slate-300">
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={clsx(
                  'px-3 py-2 rounded-xl text-sm leading-relaxed',
                  isMe ? 'bg-brand text-white rounded-tr-sm' : 'bg-surface text-slate-700 rounded-tl-sm'
                )}>
                  {highlight(msg.content)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 pt-3 border-t border-surface-100 flex gap-2">
        <div className="flex-1 relative">
          <AtSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Écrivez un message, @ pour mentionner…"
            className="input pl-9 text-sm"
          />
        </div>
        <button onClick={send} disabled={!draft.trim() || isPending}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CollaborationPage() {
  const [selectedActeId, setSelectedActeId] = useState<string | null>(null)
  const { data, isLoading } = useActes({ limit: 100 })
  const actes: Acte[] = data?.data ?? []

  // Sélectionner le premier acte actif par défaut
  useEffect(() => {
    if (!selectedActeId && actes.length > 0) {
      const active = actes.find(a => a.statut !== 'archive' && a.statut !== 'rejete')
      if (active) setSelectedActeId(active.id)
    }
  }, [actes, selectedActeId])

  const selectedActe = actes.find(a => a.id === selectedActeId) ?? null
  const actifs = actes.filter(a => a.statut !== 'archive' && a.statut !== 'rejete')

  // Journal d'activité synthétique basé sur les dates des actes
  const activityItems = [...actes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)
    .map(a => ({
      acte: a,
      label: a.statut === 'signe' ? 'Acte signé par toutes les parties'
           : a.statut === 'en_validation' ? 'Transmis à la validation juridique'
           : a.statut === 'en_instruction' ? 'En cours d\'instruction'
           : a.statut === 'rejete' ? 'Acte rejeté'
           : 'Acte mis à jour',
      type: (a.statut === 'signe' ? 'signature' : a.statut === 'en_validation' ? 'validation' : 'depot') as 'signature' | 'validation' | 'depot',
      author: `${a.initiateurFirstName ?? ''} ${a.initiateurLastName ?? ''}`.trim() || '—',
    }))

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 text-brand animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Espace collaboratif</h1>
        <p className="text-slate-500 text-sm mt-1">M5 — Discussions, mentions et journal d'activité</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threads list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Actes actifs</p>
          {actifs.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Aucun acte actif</p>
          )}
          {actifs.map(acte => (
            <button
              key={acte.id}
              onClick={() => setSelectedActeId(acte.id)}
              className={clsx(
                'w-full text-left card transition-all hover:shadow-md',
                selectedActeId === acte.id && 'ring-2 ring-brand'
              )}
            >
              <p className="font-mono text-xs text-slate-400">{acte.numero}</p>
              <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2 mt-0.5">{acte.titre}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={clsx('px-1.5 py-0.5 rounded-full text-xs', STATUS_COLOR[acte.statut])}>
                  {STATUS_LABEL[acte.statut]}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Chat panel */}
        <div className="lg:col-span-2 card flex flex-col min-h-[500px]">
          {selectedActe ? (
            <>
              <div className="pb-3 mb-3 border-b border-surface-100">
                <p className="font-semibold text-slate-900 text-sm">{selectedActe.titre}</p>
                <p className="text-xs text-slate-400 font-mono">{selectedActe.numero}
                  <span className="mx-1 text-slate-200">·</span>
                  {TYPE_LABEL[selectedActe.type]}
                </p>
              </div>
              <ChatThread acteId={selectedActe.id} currentUserName="" />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sélectionnez un acte</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand" />
          Journal d'activité récente
        </h2>
        {activityItems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Aucune activité récente</p>
        ) : (
          <div className="space-y-3">
            {activityItems.map(({ acte, label, type, author }) => (
              <ActivityItem
                key={acte.id}
                label={label}
                numero={acte.numero}
                titre={acte.titre}
                author={author}
                date={acte.updatedAt}
                type={type}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
