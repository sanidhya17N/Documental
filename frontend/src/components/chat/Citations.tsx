import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import type { Citation } from '@/types'

interface CitationsProps {
  citations: Citation[]
}

export function Citations({ citations }: CitationsProps) {
  if (!citations?.length) return null

  const uniqueDocs = new Set(citations.map((c) => c.documentId)).size

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg/50 p-3">
      <p className="mb-2 text-xs font-medium text-text-muted">
        Found in {uniqueDocs} document{uniqueDocs === 1 ? '' : 's'}
      </p>
      <div className="flex flex-wrap gap-2">
        {citations.map((c, idx) => (
          <Link
            key={`${c.documentId}-${c.chunkIndex}-${idx}`}
            to={`/documents/${c.documentId}?chunk=${c.chunkIndex}${
              c.pageNumber != null ? `&page=${c.pageNumber}` : ''
            }`}
            className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-bg-card px-2.5 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
            title={c.snippet}
          >
            <FileText className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{c.fileName || 'Document'}</span>
            {c.pageNumber != null && (
              <span className="shrink-0 text-text-dim">· Page {c.pageNumber}</span>
            )}
            {c.chunkIndex != null && (
              <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                Chunk {c.chunkIndex}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
