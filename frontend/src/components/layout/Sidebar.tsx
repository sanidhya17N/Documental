import { NavLink } from 'react-router-dom'
import {
  FileText,
  Home,
  MessageSquare,
  BookOpen,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/utils/format'

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-bg-elevated transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <FileText className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Documental<span className="text-primary">.</span>
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-text-muted hover:bg-bg-hover lg:hidden"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-muted hover:bg-bg-hover hover:text-text',
                )
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4 text-xs text-text-dim">
          RAG-powered document intelligence
        </div>
      </aside>
    </>
  )
}
