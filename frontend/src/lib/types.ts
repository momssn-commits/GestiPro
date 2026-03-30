// ─── User / Profile ─────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'rh' | 'manager' | 'employee'
  department?: string
  jobTitle?: string
  grade?: string
  contractType?: string
  phone?: string
  hireDate?: string
}

export interface UpdateProfilePayload {
  firstName?: string
  lastName?: string
  phone?: string
  department?: string
}

// ─── RH ─────────────────────────────────────────────────────────────────────

export type AttestationStatus = 'pending' | 'approved' | 'rejected' | 'signed'

export interface Attestation {
  id: string
  type: 'travail' | 'salaire' | 'conge' | 'autre'
  requestedAt: string
  updatedAt: string
  status: AttestationStatus
  signedFileUrl?: string
  comments?: string
  requestedBy: string
}

export interface ValidationRequest {
  id: string
  type: string
  subject: string
  requestedBy: string
  requestedAt: string
  currentStep: number
  totalSteps: number
  currentApproverRole: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  firstName?: string
  lastName?: string
}

export interface CreateValidationPayload {
  type: string
  subject: string
}

// ─── Documents ──────────────────────────────────────────────────────────────

export type DocumentCategory = 'devis' | 'apd' | 'facture' | 'contrat' | 'autre'
export type DocumentWorkflowStep = 'depot' | 'verification' | 'approbation' | 'archivage'
export type DocumentStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'archived'

export interface Document {
  id: string
  name: string
  category: DocumentCategory
  fileUrl: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  updatedAt: string
  workflowStep: DocumentWorkflowStep
  status: DocumentStatus
  comments?: string
  description?: string
  tags?: string[]
  firstName?: string
  lastName?: string
  folderId?: string | null
  folderName?: string | null
  serviceId?: string | null
  serviceName?: string | null
  serviceColor?: string | null
}

export interface UpdateDocumentPayload {
  name?: string
  category?: DocumentCategory
  comments?: string
  tags?: string[]
}

// ─── Formation ──────────────────────────────────────────────────────────────

export type FormationLevel = 'debutant' | 'intermediaire' | 'avance'

export interface Formation {
  id: string
  title: string
  description: string
  category: string
  level: FormationLevel
  duration: number        // in minutes
  instructor: string
  coverUrl?: string
  isPublished?: boolean
  modules: FormationModule[]
  enrolledCount: number
  rating: number
  isEnrolled?: boolean
  progress?: number
}

export interface FormationModule {
  id: string
  title: string
  duration: number
  type: 'video' | 'pdf' | 'quiz'
  contentUrl?: string
  orderIndex?: number
  completed?: boolean
}

export interface CreateFormationPayload {
  title: string
  description: string
  category: string
  level: FormationLevel
  duration: number
  instructor: string
  coverUrl?: string
  isPublished?: boolean
}

export type UpdateFormationPayload = Partial<CreateFormationPayload>

export interface CreateModulePayload {
  title: string
  type: 'video' | 'pdf' | 'quiz'
  contentUrl?: string
  duration: number
  orderIndex?: number
}

export type UpdateModulePayload = Partial<CreateModulePayload>

// ─── Services (groupes de travail) ───────────────────────────────────────────

export interface ServiceMember {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle?: string
  role: string
  phone?: string
  department?: string
}

export interface Service {
  id: string
  name: string
  code: string
  description?: string
  color: string
  isActive: boolean
  chefId?: string
  chefFirstName?: string
  chefLastName?: string
  chefJobTitle?: string
  memberCount: number
  createdAt: string
  members?: ServiceMember[]
}

export interface CreateServicePayload {
  name: string
  code: string
  description?: string
  color?: string
  chefId?: string | null
}

export type UpdateServicePayload = Partial<CreateServicePayload>

// ─── Dossiers ────────────────────────────────────────────────────────────────

export interface Folder {
  id: string
  name: string
  parentId?: string | null
  serviceId?: string | null
  serviceName?: string | null
  createdBy?: string | null
  creatorFirstName?: string | null
  creatorLastName?: string | null
  isSystem: boolean
  color: string
  icon?: string | null
  createdAt: string
  documentCount: number
  children?: Folder[]   // peuplé côté front pour l'arbre
}

export interface CreateFolderPayload {
  name: string
  parentId?: string | null
  serviceId?: string | null
  color?: string
  icon?: string
}

export type UpdateFolderPayload = Partial<CreateFolderPayload>

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
