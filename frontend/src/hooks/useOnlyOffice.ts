import { useQuery } from '@tanstack/react-query'
import { onlyofficeApi } from '@/lib/api/onlyoffice'

export function useEditorConfig(documentId: string | null) {
  return useQuery({
    queryKey: ['onlyoffice', 'editor-config', documentId],
    queryFn:  () => onlyofficeApi.getEditorConfig(documentId!),
    enabled:  !!documentId,
    staleTime: 0,          // toujours fraîche (clé unique à chaque ouverture)
    gcTime:    0,
    retry: false,
  })
}
