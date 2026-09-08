import { api, unwrap } from './client'
import type { Citation, DocumentMetadata } from '@/types'

export async function listDocuments(): Promise<DocumentMetadata[]> {
  const res = await api.get('/documents')
  return unwrap<DocumentMetadata[]>(res) ?? []
}

export async function getDocument(id: string): Promise<DocumentMetadata> {
  const res = await api.get(`/documents/${id}`)
  return unwrap<DocumentMetadata>(res)
}

export async function getDocumentChunks(id: string): Promise<Citation[]> {
  const res = await api.get(`/documents/${id}/chunks`)
  return unwrap<Citation[]>(res) ?? []
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await api.delete(`/documents/${id}`)
  unwrap(res)
}

export async function uploadDocument(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)

  await api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!event.total) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress?.(percent)
    },
  })
}
