import { api, unwrap } from './client'
import type { ChatRequest, ChatResponse, Citation, SearchRequest, SearchResult } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export async function askQuestion(request: ChatRequest): Promise<ChatResponse> {
  const res = await api.post('/chat/query', request)
  return unwrap<ChatResponse>(res)
}

export async function searchSimilar(request: SearchRequest): Promise<SearchResult> {
  const res = await api.post('/chat/search/similarity', request)
  return unwrap<SearchResult>(res)
}

function decodeSsePayload(raw: string): string | null {
  let payload = raw
  if (payload.startsWith(' ')) payload = payload.slice(1)
  if (!payload || payload === '[DONE]') return null

  // Spring may JSON-encode string events: "hello" or "line\n"
  if (
    (payload.startsWith('"') && payload.endsWith('"')) ||
    (payload.startsWith("'") && payload.endsWith("'"))
  ) {
    try {
      return JSON.parse(payload) as string
    } catch {
      // fall through — treat as plain text
    }
  }
  return payload
}

/**
 * Streams answer tokens from POST /chat/stream (SSE).
 * Citations are fetched in parallel via similarity search.
 */
export async function streamQuestion(
  request: ChatRequest,
  handlers: {
    onToken: (token: string) => void
    onCitations?: (citations: Citation[]) => void
  },
): Promise<{ conversationId: string; citations: Citation[] }> {
  const conversationId = request.conversationId || crypto.randomUUID()
  const body = { ...request, conversationId }

  const citationsPromise = searchSimilar({
    query: request.question,
    documentId: request.documentId,
    topK: request.topK ?? 4,
  })
    .then((result) => {
      const citations = result.matches || []
      handlers.onCitations?.(citations)
      return citations
    })
    .catch(() => [] as Citation[])

  const response = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Stream failed (${response.status})`)
  }

  if (!response.body) {
    throw new Error('No response body from stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const emitDataLine = (line: string) => {
    const trimmed = line.replace(/\r$/, '')
    if (!trimmed || trimmed.startsWith(':')) return
    if (trimmed.startsWith('event:') || trimmed.startsWith('id:') || trimmed.startsWith('retry:')) {
      return
    }
    if (trimmed.startsWith('data:')) {
      const decoded = decodeSsePayload(trimmed.slice(5))
      if (decoded != null && decoded.length > 0) handlers.onToken(decoded)
      return
    }
    // Non-SSE framing fallback (raw chunk text)
    handlers.onToken(trimmed)
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE events are separated by blank lines; also flush complete lines as they arrive
    let newlineIdx = buffer.indexOf('\n')
    while (newlineIdx !== -1) {
      const line = buffer.slice(0, newlineIdx)
      buffer = buffer.slice(newlineIdx + 1)
      emitDataLine(line)
      newlineIdx = buffer.indexOf('\n')
    }
  }

  // Flush decoder + any remaining line (final token with no trailing newline)
  buffer += decoder.decode()
  if (buffer.length > 0) {
    emitDataLine(buffer)
  }

  const citations = await citationsPromise
  return { conversationId, citations }
}
