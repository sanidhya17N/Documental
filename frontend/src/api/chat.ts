import { api, unwrap, getAuthHeader, API_BASE } from './client'
import type { ChatRequest, ChatResponse, Citation, SearchRequest, SearchResult } from '@/types'

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

  if (
    (payload.startsWith('"') && payload.endsWith('"')) ||
    (payload.startsWith("'") && payload.endsWith("'"))
  ) {
    try {
      return JSON.parse(payload) as string
    } catch {
      // fall through
    }
  }
  return payload
}

async function parseHttpError(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) {
    if (response.status === 401) return 'Session expired — please sign in again'
    if (response.status === 403) return 'Access denied'
    if (response.status === 422) return 'Could not process this request'
    return `Request failed (${response.status})`
  }
  try {
    const json = JSON.parse(text) as { message?: string }
    if (json.message) return json.message
  } catch {
    // not JSON
  }
  // Avoid dumping huge HTML/stack traces into the UI
  if (text.length > 220 || text.trimStart().startsWith('<')) {
    if (response.status === 401) return 'Session expired — please sign in again'
    if (response.status === 403) return 'Access denied while streaming. Please retry.'
    return `Request failed (${response.status})`
  }
  return text
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
): Promise<{ conversationId: string; citations: Citation[]; receivedTokens: boolean }> {
  const conversationId = request.conversationId || crypto.randomUUID()
  const body = { ...request, conversationId }
  let receivedTokens = false

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

  let response: Response
  try {
    response = await fetch(`${API_BASE}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...getAuthHeader(),
      },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the server. Check that the backend is running.')
  }

  if (!response.ok) {
    throw new Error(await parseHttpError(response))
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
      if (decoded != null && decoded.length > 0) {
        receivedTokens = true
        handlers.onToken(decoded)
      }
      return
    }
    receivedTokens = true
    handlers.onToken(trimmed)
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let newlineIdx = buffer.indexOf('\n')
      while (newlineIdx !== -1) {
        const line = buffer.slice(0, newlineIdx)
        buffer = buffer.slice(newlineIdx + 1)
        emitDataLine(line)
        newlineIdx = buffer.indexOf('\n')
      }
    }

    buffer += decoder.decode()
    if (buffer.length > 0) {
      emitDataLine(buffer)
    }
  } catch (err) {
    if (receivedTokens) {
      throw new Error(
        'The answer stream was interrupted. Partial response is shown above — please retry if needed.',
      )
    }
    if (err instanceof Error && /network|fetch|abort/i.test(err.message)) {
      throw new Error('Connection lost while waiting for the answer. Please try again.')
    }
    throw err
  }

  const citations = await citationsPromise
  return { conversationId, citations, receivedTokens }
}
