import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useLocalStorage } from '@/utils/useLocalStorage'
import { cn } from '@/utils/format'

type SettingsTab = 'general' | 'ai' | 'database' | 'notifications'

interface AppSettings {
  appName: string
  defaultTopK: number
  theme: 'light' | 'dark' | 'system'
  enableNotifications: boolean
}

const defaults: AppSettings = {
  appName: 'Documental',
  defaultTopK: 8,
  theme: 'dark',
  enableNotifications: true,
}

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [settings, setSettings] = useLocalStorage<AppSettings>(
    'documental-settings',
    defaults,
  )
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'ai', label: 'AI & Model' },
    { id: 'database', label: 'Database' },
    { id: 'notifications', label: 'Notifications' },
  ]

  const save = () => {
    setSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Prefer preferences for this workspace (stored locally).
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside className="flex flex-row gap-1 overflow-x-auto md:flex-col">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-xl px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors',
                tab === t.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-muted hover:bg-bg-hover',
              )}
            >
              {t.label}
            </button>
          ))}
        </aside>

        <div className="rounded-2xl border border-border bg-bg-card p-6">
          {tab === 'general' && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Application Name</label>
                <input
                  value={draft.appName}
                  onChange={(e) => setDraft({ ...draft, appName: e.target.value })}
                  className="h-10 w-full max-w-md rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Default Search Results
                </label>
                <select
                  value={draft.defaultTopK}
                  onChange={(e) =>
                    setDraft({ ...draft, defaultTopK: Number(e.target.value) })
                  }
                  className="h-10 w-full max-w-md rounded-xl border border-border bg-bg px-3 text-sm outline-none focus:border-primary"
                >
                  {[3, 5, 8, 10, 15].map((n) => (
                      <option key={n} value={n}>
                        {n} results
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Theme</label>
                <div className="inline-flex rounded-xl border border-border p-1">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDraft({ ...draft, theme: t })}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-sm capitalize',
                        draft.theme === t
                          ? 'bg-primary text-white'
                          : 'text-text-muted hover:text-text',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-text-dim">
                  UI currently ships in dark mode to match the product design.
                </p>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-3 text-sm text-text-muted">
              <p>
                Chat and embeddings are configured on the Spring Boot backend via Gemini
                models.
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Chat model: configured by <code className="text-primary">GEMINI_CHAT_MODEL</code></li>
                <li>
                  Embedding model:{' '}
                  <code className="text-primary">GEMINI_EMBEDDING_MODEL</code>
                </li>
                <li>RAG chunk size & top-k: <code className="text-primary">app.rag</code> in application-dev.yml</li>
              </ul>
            </div>
          )}

          {tab === 'database' && (
            <div className="space-y-3 text-sm text-text-muted">
              <p>Document metadata and vector embeddings live in PostgreSQL + pgvector.</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Host port: 5434 (docker-compose)</li>
                <li>Database: documental</li>
                <li>Vector table: public.vector_store</li>
              </ul>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.enableNotifications}
                  onChange={(e) =>
                    setDraft({ ...draft, enableNotifications: e.target.checked })
                  }
                  className="size-4 rounded accent-primary"
                />
                Enable upload / indexing notifications (local preference)
              </label>
            </div>
          )}

          {(tab === 'general' || tab === 'notifications') && (
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={save}>Save changes</Button>
              {saved && <span className="text-sm text-success">Saved</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
