import { apiClient } from './client'

export interface OnlyOfficeEditorConfig {
  documentServerUrl: string
  config: {
    document: {
      fileType: string
      key: string
      title: string
      url: string
      permissions: Record<string, boolean>
    }
    documentType: string
    editorConfig: {
      callbackUrl: string
      lang: string
      mode: 'edit' | 'view'
      user: { id: string; name: string }
      customization: Record<string, unknown>
    }
    token: string
  }
}

export const onlyofficeApi = {
  getEditorConfig: async (documentId: string): Promise<OnlyOfficeEditorConfig> => {
    const { data } = await apiClient.get<OnlyOfficeEditorConfig>(
      `/onlyoffice/editor-config/${documentId}`
    )
    return data
  },
}
