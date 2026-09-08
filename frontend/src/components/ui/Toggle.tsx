import { cn } from '@/utils/format'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  id?: string
}

export function Toggle({ checked, onChange, label, id = 'toggle' }: ToggleProps) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-border-light',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
      {label && <span className="text-sm text-text-muted">{label}</span>}
    </label>
  )
}
