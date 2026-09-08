export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'INDEXED' | 'FAILED'

export interface ApiResponse<T> {
  success: boolean
  message: string | null
  data: T
  timestamp: string
}

export interface DocumentMetadata {
  id: string
  filename?: string | null
  fileName?: string | null
  contentType: string
  fileSize: number
  totalPages: number | null
  totalChunks: number | null
  status: DocumentStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentUploadResult {
  id: string
  fileName: string
  fileSize: number
  status: DocumentStatus
  chunkCreated: number
  message: string
}

export interface Citation {
  documentId: string
  fileName: string
  chunkIndex: number
  pageNumber: number | null
  snippet: string
  similarityScore: number | null
  metadata?: Record<string, unknown>
}

export interface ChatRequest {
  question: string
  documentId?: string | null
  topK?: number
  minSimilarity?: number
  conversationId?: string
  detailed?: boolean
}

export interface ChatResponse {
  answer: string
  conversationId: string
  citations: Citation[]
  responseTimeMs: number
}

export interface SearchRequest {
  query: string
  documentId?: string | null
  topK?: number
  similaritySearch?: number
}

export interface SearchResult {
  query: string
  totalMatches: number
  matches: Citation[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  responseTimeMs?: number
  createdAt: string
}

export interface SavedQA {
  id: string
  question: string
  answer: string
  source?: string
  citations?: Citation[]
  createdAt: string
}

export interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'indexing' | 'done' | 'error'
  error?: string
}
