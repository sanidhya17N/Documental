import { useCallback, useRef, useState } from 'react'
import { CloudUpload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useUpload } from '@/context/UploadContext'
import { formatBytes, cn } from '@/utils/format'

const ACCEPT =
  '.pdf,.doc,.docx,.txt,.md,.rtf,.odt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

export function UploadDialog() {
  const { open, closeDialog, uploadFiles, items } = useUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files?.length) {
        void uploadFiles(e.dataTransfer.files)
      }
    },
    [uploadFiles],
  )

  return (
    <Modal
      open={open}
      onClose={closeDialog}
      title="Upload Documents"
      description="Add files to your knowledge base. They will be parsed, chunked, and indexed for RAG."
      wide
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/10'
            : 'border-border-light bg-bg/40 hover:border-primary/50',
        )}
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <CloudUpload className="size-7" />
        </div>
        <p className="text-base font-medium text-text">
          Drag & drop files here or click to browse
        </p>
        <p className="mt-2 max-w-md text-sm text-text-muted">
          Supported formats: PDF, DOCX, TXT, and more. Max 25MB per file.
        </p>
        <Button className="mt-5" onClick={() => inputRef.current?.click()}>
          Browse Files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void uploadFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold text-text">Recent Uploads</h3>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-hover/60 text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Size</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-primary" />
                        <span className="truncate font-medium">{item.file.name}</span>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-text-muted sm:table-cell">
                      {formatBytes(item.file.size)}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'uploading' && (
                        <ProgressBar value={item.progress} label="Uploading" />
                      )}
                      {item.status === 'indexing' && (
                        <ProgressBar indeterminate label="Indexing..." />
                      )}
                      {item.status === 'pending' && (
                        <span className="text-text-muted">Queued</span>
                      )}
                      {item.status === 'done' && (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="size-4" />
                          Indexed
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="inline-flex items-center gap-1.5 text-danger">
                          <AlertCircle className="size-4" />
                          {item.error || 'Failed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  )
}
