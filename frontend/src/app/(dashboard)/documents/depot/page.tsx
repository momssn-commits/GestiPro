'use client'

import { useState } from 'react'
import { FolderTree }     from '@/components/documents/FolderTree'
import { FileUploadZone } from '@/components/documents/FileUploadZone'
import { FilesList }      from '@/components/documents/FilesList'

export default function DepotPage() {
  const [selectedFolderId,  setSelectedFolderId]  = useState<string | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [selectedUserId,    setSelectedUserId]    = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dépôt de documents</h1>
        <p className="text-slate-500 text-sm mt-1">Déposez devis, APD, factures et pièces annexes</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Sidebar : arborescence des répertoires */}
        <FolderTree
          selectedFolderId={selectedFolderId}
          selectedServiceId={selectedServiceId}
          selectedUserId={selectedUserId}
          onSelectFolder={setSelectedFolderId}
          onSelectService={setSelectedServiceId}
          onSelectUser={setSelectedUserId}
        />

        {/* Zone principale */}
        <div className="flex-1 min-w-0 space-y-4">
          <FileUploadZone
            defaultFolderId={selectedFolderId}
            defaultServiceId={selectedServiceId}
          />
          <FilesList
            folderId={selectedFolderId}
            serviceId={selectedServiceId}
            userId={selectedUserId}
          />
        </div>
      </div>
    </div>
  )
}
