import { Link } from 'react-router-dom'
import {
  Upload,
  MessageSquare,
  Files,
  Search,
  Sparkles,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useUpload } from '@/context/UploadContext'

const features = [
  {
    icon: Files,
    title: 'Multi-format Support',
    desc: 'Upload PDFs, DOCX, TXT and more — parsed and indexed automatically.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    desc: 'Semantic similarity search across clauses, concepts, and facts.',
  },
  {
    icon: Sparkles,
    title: 'RAG Powered',
    desc: 'Ask grounded questions with citations back to source pages.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'Your documents stay in your stack — embeddings in your vector store.',
  },
]

export function HomePage() {
  const { openDialog } = useUpload()

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-bg-card via-bg-elevated to-bg p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 size-64 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium text-primary">Document intelligence</p>
            <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Upload. Ask.
              <br />
              Get Insights.
            </h1>
            <p className="mt-4 max-w-lg text-base text-text-muted">
              Turn your documents into a searchable knowledge base. Chat with your files,
              discover clauses and concepts, and trace every answer to its source chunk.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={openDialog}>
                <Upload className="size-4" />
                Upload Document
              </Button>
              <Link to="/chat">
                <Button size="lg" variant="outline">
                  <MessageSquare className="size-4" />
                  Go to Chat
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl" />
            <div className="relative space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="glass rounded-2xl p-4 shadow-xl"
                  style={{ transform: `translateX(${i * 12}px) rotate(${(i - 1) * 2}deg)` }}
                >
                  <div className="mb-3 h-2 w-1/3 rounded bg-primary/40" />
                  <div className="space-y-2">
                    <div className="h-2 rounded bg-border-light" />
                    <div className="h-2 w-5/6 rounded bg-border-light" />
                    <div className="h-2 w-4/6 rounded bg-border-light" />
                  </div>
                  <div className="mt-3 flex gap-1">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="size-1.5 rounded-full bg-primary/60" />
                    <span className="size-1.5 rounded-full bg-primary/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-border bg-bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            <h3 className="font-semibold text-text">{title}</h3>
            <p className="mt-2 text-sm text-text-muted">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
