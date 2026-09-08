import type { DocumentStatus } from '@/types'
import { cn } from '@/utils/format'

const labels: Record<DocumentStatus, string> = {
  UPLOADING: 'Uploading...',
  PROCESSING: 'Indexing...',
  INDEXED: 'Indexed',
  FAILED: 'Failed',
}

export function StatusBadge({ status }: { status: DocumentStatus | string }) {
  const normalized = (status || 'PROCESSING').toUpperCase() as DocumentStatus
  const isIndexed = normalized === 'INDEXED'
  const isFailed = normalized === 'FAILED'
  const isBusy = normalized === 'UPLOADING' || normalized === 'PROCESSING'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium',
        isIndexed && 'text-success',
        isFailed && 'text-danger',
        isBusy && 'text-primary',
      )}
    >
      <span
        className={cn(
          'size-2 rounded-full',
          isIndexed && 'bg-success',
          isFailed && 'bg-danger',
          isBusy && 'bg-primary animate-pulse',
        )}
      />
      {labels[normalized] || status}
    </span>
  )
}
