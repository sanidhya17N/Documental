import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User } from 'lucide-react'
import type { ChatMessage } from '@/types'
import { Citations } from './Citations'
import { cn } from '@/utils/format'

interface ChatMessageBubbleProps {
  message: ChatMessage
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-white' : 'bg-bg-hover text-primary',
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      <div className={cn('max-w-[min(100%,42rem)]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-md bg-primary text-white'
              : 'rounded-tl-md border border-border bg-bg-card text-text',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-text">{children}</strong>
                  ),
                  h1: ({ children }) => (
                    <h3 className="mb-2 text-base font-semibold">{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h3 className="mb-2 text-base font-semibold">{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="mb-1.5 text-sm font-semibold">{children}</h4>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-bg px-1 py-0.5 text-xs text-primary">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.citations && <Citations citations={message.citations} />}

        {!isUser && message.responseTimeMs != null && (
          <p className="mt-1 text-[11px] text-text-dim">
            Responded in {(message.responseTimeMs / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  )
}
