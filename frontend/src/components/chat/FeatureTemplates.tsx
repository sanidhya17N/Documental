import {
  ListChecks,
  ClipboardList,
  DollarSign,
  GitCompare,
} from 'lucide-react'

export const FEATURE_TEMPLATES = [
  {
    id: 'summarize',
    icon: ListChecks,
    title: 'Summarize key points',
    prompt: 'Summarize the key points from the documents.',
  },
  {
    id: 'requirements',
    icon: ClipboardList,
    title: 'What are the main requirements?',
    prompt: 'What are the main requirements described in the documents?',
  },
  {
    id: 'pricing',
    icon: DollarSign,
    title: 'Find information about pricing',
    prompt: 'Find information about pricing, costs, and commercial terms.',
  },
  {
    id: 'compare',
    icon: GitCompare,
    title: 'Compare different sections',
    prompt: 'Compare different sections and highlight important differences.',
  },
] as const

interface FeatureTemplatesProps {
  onSelect: (prompt: string) => void
}

export function FeatureTemplates({ onSelect }: FeatureTemplatesProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FEATURE_TEMPLATES.map(({ id, icon: Icon, title, prompt }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(prompt)}
          className="group rounded-2xl border border-border bg-bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-bg-hover"
        >
          <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Icon className="size-4" />
          </div>
          <p className="text-sm font-medium text-text">{title}</p>
          <p className="mt-1 line-clamp-2 text-xs text-text-dim">{prompt}</p>
        </button>
      ))}
    </div>
  )
}
