import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Bookmark, Lightbulb, KeyRound, FileText } from 'lucide-react'
import { searchSimilar } from '@/api/chat'
import { getErrorMessage } from '@/api/client'
import type { Citation, SavedQA } from '@/types'
import { Button } from '@/components/ui/Button'
import { useLocalStorage } from '@/utils/useLocalStorage'
import { formatDate, cn } from '@/utils/format'

type Tab = 'qa' | 'insights' | 'keypoints'

const PRESET_QUERIES: Record<'insights' | 'keypoints', { label: string; query: string }[]> = {
  insights: [
    { label: 'Clauses', query: 'important contractual clauses obligations rights termination' },
    { label: 'Risks', query: 'risks liabilities indemnification penalties warranties' },
    { label: 'Deadlines', query: 'deadlines timelines milestones delivery dates' },
  ],
  keypoints: [
    { label: 'Concepts', query: 'key concepts definitions terminology scope' },
    { label: 'Facts', query: 'key facts figures statistics numbers amounts' },
    { label: 'Requirements', query: 'requirements specifications must shall mandatory' },
  ],
}

export function KnowledgeBasePage() {
  const [tab, setTab] = useState<Tab>('qa')
  const [saved, setSaved] = useLocalStorage<SavedQA[]>('documental-saved-qa', [])
  const [qaQuery, setQaQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [matches, setMatches] = useState<Citation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const filteredSaved = useMemo(() => {
    if (!qaQuery.trim()) return saved
    const q = qaQuery.toLowerCase()
    return saved.filter(
      (s) =>
        s.question.toLowerCase().includes(q) ||
        s.answer.toLowerCase().includes(q) ||
        (s.source || '').toLowerCase().includes(q),
    )
  }, [saved, qaQuery])

  const runSearch = async (query: string, presetLabel?: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setActivePreset(presetLabel || null)
    setSearchQuery(trimmed)
    try {
      const result = await searchSimilar({ query: trimmed, topK: 12 })
      setMatches(result.matches || [])
    } catch (e) {
      setError(getErrorMessage(e))
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Bookmark }[] = [
    { id: 'qa', label: 'Saved Q&A', icon: Bookmark },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'keypoints', label: 'Key Points', icon: KeyRound },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Knowledge Base</h1>
        <p className="mt-1 text-sm text-text-muted">
          Search clauses, concepts, and facts across indexed documents — or revisit saved answers.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === id
                ? 'bg-primary/15 text-primary'
                : 'text-text-muted hover:bg-bg-hover hover:text-text',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'qa' && (
        <>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-dim" />
            <input
              value={qaQuery}
              onChange={(e) => setQaQuery(e.target.value)}
              placeholder="Search saved Q&A..."
              className="h-10 w-full rounded-xl border border-border bg-bg-card pr-3 pl-10 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="bg-bg-hover/50 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Question</th>
                  <th className="px-4 py-3 font-medium">Answer Preview</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredSaved.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-text-muted">
                      No saved Q&A yet. Use &quot;Save Q&A&quot; in Chat to pin answers here.
                    </td>
                  </tr>
                )}
                {filteredSaved.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="max-w-[200px] px-4 py-3 font-medium">{item.question}</td>
                    <td className="max-w-[280px] px-4 py-3 text-text-muted">
                      <span className="line-clamp-2">{item.answer}</span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{item.source || '—'}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-xs text-danger hover:underline"
                        onClick={() => setSaved(saved.filter((s) => s.id !== item.id))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-3 p-3 md:hidden">
              {filteredSaved.length === 0 && (
                <p className="py-6 text-center text-sm text-text-muted">No saved Q&A yet.</p>
              )}
              {filteredSaved.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-bg-card p-3">
                  <p className="font-medium text-text">{item.question}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-text-muted">{item.answer}</p>
                  <p className="mt-2 text-xs text-text-dim">
                    {item.source || '—'} · {formatDate(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {(tab === 'insights' || tab === 'keypoints') && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {PRESET_QUERIES[tab].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => void runSearch(p.query, p.label)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  activePreset === p.label
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-text-muted hover:border-primary/40',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <form
            className="mb-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              void runSearch(searchQuery)
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-dim" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  tab === 'insights'
                    ? 'Search clauses, risks, deadlines...'
                    : 'Search concepts, facts, requirements...'
                }
                className="h-10 w-full rounded-xl border border-border bg-bg-card pr-3 pl-10 text-sm outline-none focus:border-primary"
              />
            </div>
            <Button type="submit" loading={loading}>
              Search
            </Button>
          </form>

          {error && (
            <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {!loading && matches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-text-muted">
                Run a search to discover {tab === 'insights' ? 'clauses and insights' : 'concepts and facts'}{' '}
                from your indexed chunks.
              </div>
            )}
            {matches.map((m, i) => (
              <div
                key={`${m.documentId}-${m.chunkIndex}-${i}`}
                className="rounded-2xl border border-border bg-bg-card p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <FileText className="size-3.5 text-primary" />
                  <Link
                    to={`/documents/${m.documentId}?chunk=${m.chunkIndex}${
                      m.pageNumber != null ? `&page=${m.pageNumber}` : ''
                    }`}
                    className="font-medium text-text hover:text-primary"
                  >
                    {m.fileName || 'Document'}
                  </Link>
                  {m.pageNumber != null && <span>· Page {m.pageNumber}</span>}
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary">
                    Chunk {m.chunkIndex}
                  </span>
                  {m.similarityScore != null && (
                    <span className="ml-auto text-text-dim">
                      {(m.similarityScore * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-text-muted">{m.snippet}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
