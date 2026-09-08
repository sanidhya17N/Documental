import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { listDocuments, deleteDocument } from '@/api/documents'
import { getErrorMessage } from '@/api/client'
import type { DocumentMetadata, DocumentStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useUpload } from '@/context/UploadContext'
import {
  contentTypeLabel,
  formatBytes,
  formatDate,
  cn,
  documentName,
} from '@/utils/format'

const PAGE_SIZE = 5

export function DocumentsPage() {
  const { openDialog, refreshKey } = useUpload()
  const [docs, setDocs] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [menuId, setMenuId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listDocuments()
      setDocs(data)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [refreshKey])

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const name = documentName(d).toLowerCase()
      const matchesQuery = !query || name.includes(query.toLowerCase())
      const type = contentTypeLabel(d.contentType, documentName(d))
      const matchesType = typeFilter === 'all' || type === typeFilter
      const matchesStatus =
        statusFilter === 'all' || d.status === (statusFilter as DocumentStatus)
      return matchesQuery && matchesType && matchesStatus
    })
  }, [docs, query, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const onDelete = async (id: string) => {
    if (!confirm('Delete this document and its embeddings?')) return
    try {
      await deleteDocument(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      setMenuId(null)
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">My Documents</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage uploaded files and their indexing status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button onClick={openDialog}>
            <Upload className="size-4" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-dim" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search documents..."
            className="h-10 w-full rounded-xl border border-border bg-bg-card pr-3 pl-10 text-sm text-text outline-none placeholder:text-text-dim focus:border-primary"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-xl border border-border bg-bg-card px-3 text-sm text-text outline-none focus:border-primary"
        >
          <option value="all">All Types</option>
          <option value="PDF">PDF</option>
          <option value="DOCX">DOCX</option>
          <option value="TXT">TXT</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="h-10 rounded-xl border border-border bg-bg-card px-3 text-sm text-text outline-none focus:border-primary"
        >
          <option value="all">All Status</option>
          <option value="INDEXED">Indexed</option>
          <option value="PROCESSING">Indexing</option>
          <option value="UPLOADING">Uploading</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden rounded-2xl border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-hover/50 text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Uploaded At</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  Loading documents...
                </td>
              </tr>
            )}
            {!loading && pageItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No documents found. Upload your first file to get started.
                </td>
              </tr>
            )}
            {pageItems.map((doc) => (
              <tr key={doc.id} className="border-t border-border hover:bg-bg-hover/40">
                <td className="px-4 py-3">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex items-center gap-2 font-medium text-text hover:text-primary"
                  >
                    <FileText className="size-4 text-primary" />
                    <span className="max-w-[220px] truncate">
                      {documentName(doc)}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {contentTypeLabel(doc.contentType, documentName(doc))}
                </td>
                <td className="px-4 py-3 text-text-muted">{formatBytes(doc.fileSize)}</td>
                <td className="px-4 py-3 text-text-muted">{formatDate(doc.createdAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="relative flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuId(menuId === doc.id ? null : doc.id)
                      }}
                    >
                      <MoreVertical className="size-4" />
                    </button>
                    {menuId === doc.id && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-40 cursor-default"
                          aria-label="Close menu"
                          onClick={() => setMenuId(null)}
                        />
                        <div className="absolute top-full right-0 z-50 mt-1 w-44 rounded-xl border border-border bg-bg-elevated py-1 shadow-2xl">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="flex items-center gap-2 px-3 py-2.5 text-sm text-text hover:bg-bg-hover"
                            onClick={() => setMenuId(null)}
                          >
                            <Eye className="size-4" /> View chunks
                          </Link>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-bg-hover"
                            onClick={() => void onDelete(doc.id)}
                          >
                            <Trash2 className="size-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading && <p className="text-center text-text-muted">Loading...</p>}
        {!loading && pageItems.length === 0 && (
          <p className="text-center text-text-muted">No documents found.</p>
        )}
        {pageItems.map((doc) => (
          <div key={doc.id} className="rounded-2xl border border-border bg-bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/documents/${doc.id}`} className="min-w-0">
                <p className="truncate font-medium text-text">{documentName(doc)}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {contentTypeLabel(doc.contentType, documentName(doc))} · {formatBytes(doc.fileSize)}
                </p>
              </Link>
              <StatusBadge status={doc.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-text-dim">
              <span>{formatDate(doc.createdAt)}</span>
              <button
                type="button"
                className="text-danger"
                onClick={() => void onDelete(doc.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}{' '}
            documents
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={cn(
                  'size-8 rounded-lg text-sm font-medium',
                  n === currentPage
                    ? 'bg-primary text-white'
                    : 'bg-bg-card text-text-muted hover:bg-bg-hover',
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
