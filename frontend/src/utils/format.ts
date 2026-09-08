export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function fileExtension(name: string | null | undefined): string {
  if (!name) return 'FILE'
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE'
}

export function contentTypeLabel(contentType: string | null | undefined, filename?: string | null): string {
  if (filename) {
    const ext = fileExtension(filename)
    if (ext !== 'FILE') return ext
  }
  if (!contentType) return 'FILE'
  if (contentType.includes('pdf')) return 'PDF'
  if (contentType.includes('word') || contentType.includes('docx')) return 'DOCX'
  if (contentType.includes('text')) return 'TXT'
  return contentType.split('/').pop()?.toUpperCase() || 'FILE'
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function uid(): string {
  return crypto.randomUUID()
}

export function documentName(doc: {
  filename?: string | null
  fileName?: string | null
} | null | undefined): string {
  return doc?.filename || doc?.fileName || 'Untitled'
}
