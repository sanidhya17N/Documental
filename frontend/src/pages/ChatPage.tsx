import { useEffect, useRef, useState } from 'react'
import { Sparkles, BookmarkPlus } from 'lucide-react'
import { streamQuestion } from '@/api/chat'
import { listDocuments } from '@/api/documents'
import { getErrorMessage } from '@/api/client'
import type { ChatMessage, Citation, DocumentMetadata, SavedQA } from '@/types'
import { FeatureTemplates } from '@/components/chat/FeatureTemplates'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { useUpload } from '@/context/UploadContext'
import { useLocalStorage } from '@/utils/useLocalStorage'
import { uid } from '@/utils/format'

export function ChatPage() {
  const { refreshKey } = useUpload()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [searchAll, setSearchAll] = useState(true)
  const [detailed, setDetailed] = useState(false)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useLocalStorage<SavedQA[]>('documental-saved-qa', [])
  const [settings] = useLocalStorage('documental-settings', { defaultTopK: 4 })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]))
  }, [refreshKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || loading) return
    if (!searchAll && !selectedDocumentId) {
      setError('Select a document or enable “Search in all documents”.')
      return
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    const assistantId = uid()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      citations: [],
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)
    setError(null)

    const started = performance.now()

    try {
      const topK = detailed
        ? Math.max(settings.defaultTopK || 4, 8)
        : Math.min(settings.defaultTopK || 4, 4)

      const result = await streamQuestion(
        {
          question: trimmed,
          conversationId,
          documentId: searchAll ? null : selectedDocumentId,
          topK,
          detailed,
        },
        {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + token } : m,
              ),
            )
          },
          onCitations: (citations: Citation[]) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, citations } : m)),
            )
          },
        },
      )

      setConversationId(result.conversationId)
      const elapsed = Math.round(performance.now() - started)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                citations: result.citations.length ? result.citations : m.citations,
                responseTimeMs: elapsed,
              }
            : m,
        ),
      )
    } catch (e) {
      setError(getErrorMessage(e))
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content
            ? { ...m, content: 'Sorry — I could not generate a response.' }
            : m,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const saveLastExchange = () => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastAssistant || !lastUser) return

    const entry: SavedQA = {
      id: uid(),
      question: lastUser.content,
      answer: lastAssistant.content,
      source: lastAssistant.citations?.[0]?.fileName,
      citations: lastAssistant.citations,
      createdAt: new Date().toISOString(),
    }
    setSaved([entry, ...saved])
  }

  const isEmpty = messages.length === 0 && !loading

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">Chat</h1>
          <p className="text-sm text-text-muted">Ask questions grounded in your documents.</p>
        </div>
        {messages.some((m) => m.role === 'assistant' && m.content) && (
          <button
            type="button"
            onClick={saveLastExchange}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-hover hover:text-text"
          >
            <BookmarkPlus className="size-4" />
            Save Q&A
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated">
        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {isEmpty && (
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-7" />
              </div>
              <h2 className="text-xl font-semibold text-text">
                What would you like to know?
              </h2>
              <p className="mt-2 mb-6 text-sm text-text-muted">
                Pick a template or type your own question below.
              </p>
              <FeatureTemplates
                onSelect={(prompt) => {
                  setInput(prompt)
                  void send(prompt)
                }}
              />
            </div>
          )}

          {messages.map((m) => {
            if (m.role === 'assistant' && !m.content && loading) return null
            return <ChatMessageBubble key={m.id} message={m} />
          })}

          {loading &&
            (!messages.length ||
              messages[messages.length - 1]?.role !== 'assistant' ||
              !messages[messages.length - 1]?.content) && (
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <div className="rounded-2xl border border-border bg-bg-card px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => void send(input)}
            searchAll={searchAll}
            onSearchAllChange={setSearchAll}
            detailed={detailed}
            onDetailedChange={setDetailed}
            documents={documents}
            selectedDocumentId={selectedDocumentId}
            onDocumentChange={setSelectedDocumentId}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  )
}
