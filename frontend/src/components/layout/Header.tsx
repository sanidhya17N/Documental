import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title?: string
  onMenuClick: () => void
}

function initials(name: string | undefined) {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
          <p className="text-sm font-medium text-text">{user?.fullName || 'User'}</p>
          <p className="text-xs text-text-dim">{user?.email || 'Workspace'}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
          {initials(user?.fullName)}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text"
          title="Log out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  )
}
