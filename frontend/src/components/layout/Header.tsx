import { Menu } from 'lucide-react'

interface HeaderProps {
  title?: string
  onMenuClick: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-text-muted hover:bg-bg-hover lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        {title && <h1 className="text-lg font-semibold text-text">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-text">Sankhya Srivastava</p>
          <p className="text-xs text-text-dim">Workspace</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          SS
        </div>
      </div>
    </header>
  )
}
