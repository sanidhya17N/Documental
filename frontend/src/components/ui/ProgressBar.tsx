import { cn } from '@/utils/format'

interface ProgressBarProps {
  value?: number
  indeterminate?: boolean
  className?: string
  label?: string
}

export function ProgressBar({ value = 0, indeterminate, className, label }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('w-full', className)}>
      {(label || !indeterminate) && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
          <span>{label}</span>
          {!indeterminate && <span>{clamped}%</span>}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        {indeterminate ? (
          <div className="h-full w-1/3 animate-[progress-slide_1.2s_ease-in-out_infinite] rounded-full bg-primary" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
      <style>{`
        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
