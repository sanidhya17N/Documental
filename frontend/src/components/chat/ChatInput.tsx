import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Paperclip, SendHorizontal } from 'lucide-react'
import { Toggle } from '@/components/ui/Toggle'
import { useUpload } from '@/context/UploadContext'
import { cn, documentName } from '@/utils/format'
import type { DocumentMetadata } from '@/types'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  searchAll: boolean
  onSearchAllChange: (value: boolean) => void
  detailed: boolean
  onDetailedChange: (value: boolean) => void
  documents: DocumentMetadata[]
  selectedDocumentId: string
  onDocumentChange: (id: string) => void
  disabled?: boolean
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  searchAll,
  onSearchAllChange,
  detailed,
  onDetailedChange,
  documents,
  selectedDocumentId,
  onDocumentChange,
  disabled,
}: ChatInputProps) {
  const { openDialog } = useUpload()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [focused, setFocused] = useState(false)

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!value.trim() || disabled) return
    onSubmit()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'rounded-2xl border bg-bg-card p-3 transition-colors',
        focused ? 'border-primary' : 'border-border',
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={2}
        placeholder="Ask anything about your documents..."
        disabled={disabled}
        className="w-full resize-none bg-transparent text-sm text-text outline-none placeholder:text-text-dim disabled:opacity-60"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openDialog}
            className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text"
            title="Attach files"
          >
            <Paperclip className="size-4" />
          </button>
          <Toggle
            id="search-all"
            checked={searchAll}
            onChange={onSearchAllChange}
            label="Search in all documents"
          />
          <Toggle
            id="detailed-answer"
            checked={detailed}
            onChange={onDetailedChange}
            label="Detailed answer"
          />
          {!searchAll && (
            <select
              value={selectedDocumentId}
              onChange={(e) => onDocumentChange(e.target.value)}
              className="h-8 max-w-[200px] rounded-lg border border-border bg-bg px-2 text-xs text-text outline-none focus:border-primary"
            >
              <option value="">Select document...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {documentName(d)}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled || !value.trim() || (!searchAll && !selectedDocumentId)}
          className="flex size-10 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
          aria-label="Send"
        >
          <SendHorizontal className="size-4" />
        </button>
      </div>
    </form>
  )
}
