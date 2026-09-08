import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { getDocument, getDocumentChunks } from '@/api/documents'
import { searchSimilar } from '@/api/chat'
import { getErrorMessage } from '@/api/client'
import type { Citation, DocumentMetadata } from '@/types'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  contentTypeLabel,
  formatBytes,
  formatDate,
  cn,
  documentName,
} from '@/utils/format'

export function DocumentViewerPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [doc, setDoc] = useState<DocumentMetadata | null>(null)
  const [chunks, setChunks] = useState<Citation[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [mode, setMode] = useState<'all' | 'search'>('all')

  const selectedChunk = Number(searchParams.get('chunk') ?? -1)
  const selectedPage = searchParams.get('page')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([getDocument(id), getDocumentChunks(id)])
      .then(([d, listed]) => {
        setDoc(d)
        setChunks(listed)
        setMode('all')
        if (listed[0] && searchParams.get('chunk') == null) {
          setSearchParams(
            {
              chunk: String(listed[0].chunkIndex ?? 0),
              ...(listed[0].pageNumber != null
                ? { page: String(listed[0].pageNumber) }
                : {}),
            },
            { replace: true },
          )
        }
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const runChunkSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!id || !query.trim()) return
    setSearching(true)
    setError(null)
    try {
      const result = await searchSimilar({
        query: query.trim(),
        documentId: id,
        topK: 20,
      })
      setChunks(result.matches || [])
      setMode('search')
      if (result.matches?.[0]) {
        setSearchParams({
          chunk: String(result.matches[0].chunkIndex),
          ...(result.matches[0].pageNumber != null
            ? { page: String(result.matches[0].pageNumber) }
            : {}),
        })
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  const showAllChunks = async () => {
    if (!id) return
    setSearching(true)
    setError(null)
    try {
      const listed = await getDocumentChunks(id)
      setChunks(listed)
      setMode('all')
      setQuery('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  const active =
    chunks.find((c) => c.chunkIndex === selectedChunk) || chunks[0] || null

  if (loading) {
    return <p className="text-text-muted">Loading document...</p>
  }

  if (!doc) {
    return (
      <div>
        <p className="text-danger">{error || 'Document not found'}</p>
        <Link to="/documents" className="mt-4 inline-block text-primary">
          Back to documents
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" />
          Documents
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-bg-card px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{documentName(doc)}</h1>
            <p className="text-xs text-text-muted">
              {contentTypeLabel(doc.contentType, documentName(doc))} · {formatBytes(doc.fileSize)} ·{' '}
              {doc.totalChunks ?? chunks.length} chunks
              {doc.totalPages != null ? ` · ${doc.totalPages} pages` : ''} ·{' '}
              {formatDate(doc.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={doc.status} />
          <div className="flex items-center gap-1 rounded-xl border border-border p-1">
            <button
              type="button"
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover"
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
            >
              <ZoomOut className="size-4" />
            </button>
            <span className="w-12 text-center text-xs text-text-muted">{zoom}%</span>
            <button
              type="button"
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
            >
              <ZoomIn className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={runChunkSearch} className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Semantic search within this document..."
            className="h-10 w-full rounded-xl border border-border bg-bg-card pr-3 pl-10 text-sm outline-none focus:border-primary"
          />
        </div>
        <Button type="submit" loading={searching}>
          Search
        </Button>
        {mode === 'search' && (
          <Button type="button" variant="secondary" onClick={() => void showAllChunks()}>
            Show all chunks
          </Button>
        )}
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-border bg-bg-elevated p-3">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-text-muted">
            <Layers className="size-3.5" />
            {mode === 'all' ? 'All chunks' : 'Search hits'} ({chunks.length})
          </div>
          {chunks.length === 0 && (
            <p className="px-1 text-xs text-text-dim">No chunks found for this document.</p>
          )}
          {chunks.map((c) => {
            const activeItem = active?.chunkIndex === c.chunkIndex
            return (
              <button
                key={`${c.chunkIndex}-${c.pageNumber}-${c.snippet?.slice(0, 12)}`}
                type="button"
                onClick={() =>
                  setSearchParams({
                    chunk: String(c.chunkIndex),
                    ...(c.pageNumber != null ? { page: String(c.pageNumber) } : {}),
                  })
                }
                className={cn(
                  'w-full rounded-xl border p-2 text-left transition-colors',
                  activeItem
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-bg-card hover:border-primary/40',
                )}
              >
                <div className="mb-1.5 flex h-16 items-center justify-center rounded-lg bg-bg text-[10px] text-text-dim">
                  {c.pageNumber != null ? `Page ${c.pageNumber}` : `Chunk ${c.chunkIndex}`}
                </div>
                <p className="truncate text-[11px] font-medium text-text">
                  Chunk #{c.chunkIndex}
                </p>
                {c.similarityScore != null && (
                  <p className="text-[10px] text-text-dim">
                    {(c.similarityScore * 100).toFixed(0)}% similar
                  </p>
                )}
              </button>
            )
          })}
        </aside>

        <section className="min-h-[60vh] rounded-2xl border border-border bg-bg-card p-4 sm:p-6">
          {active ? (
            <div style={{ fontSize: `${zoom}%` }}>
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-4 text-sm text-text-muted">
                <span className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
                  Chunk {active.chunkIndex}
                </span>
                {(active.pageNumber != null || selectedPage) && (
                  <span>
                    Page {active.pageNumber ?? selectedPage}
                    {doc.totalPages != null ? ` / ${doc.totalPages}` : ''}
                  </span>
                )}
                {active.similarityScore != null && (
                  <span className="ml-auto text-xs">
                    Similarity {(active.similarityScore * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-text/90">
                {active.snippet}
              </p>
            </div>
          ) : (
            <div className="flex h-full min-h-[40vh] items-center justify-center text-sm text-text-muted">
              Select a chunk from the sidebar to view its content.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
