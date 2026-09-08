import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { uploadDocument } from '@/api/documents'
import { getErrorMessage } from '@/api/client'
import type { UploadItem } from '@/types'
import { uid } from '@/utils/format'

interface UploadContextValue {
  open: boolean
  items: UploadItem[]
  openDialog: () => void
  closeDialog: () => void
  uploadFiles: (files: FileList | File[]) => Promise<void>
  clearDone: () => void
  refreshKey: number
  bumpRefresh: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const bumpRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files)
      if (!list.length) return

      const newItems: UploadItem[] = list.map((file) => ({
        id: uid(),
        file,
        progress: 0,
        status: 'pending',
      }))

      setItems((prev) => [...newItems, ...prev])
      setOpen(true)

      for (const item of newItems) {
        try {
          updateItem(item.id, { status: 'uploading', progress: 0 })
          await uploadDocument(item.file, (percent) => {
            updateItem(item.id, {
              progress: Math.min(percent, 95),
              status: percent >= 100 ? 'indexing' : 'uploading',
            })
            if (percent >= 95) {
              updateItem(item.id, { status: 'indexing', progress: 100 })
            }
          })
          updateItem(item.id, { status: 'indexing', progress: 100 })
          // brief indexing visual before done (backend indexes synchronously)
          await new Promise((r) => setTimeout(r, 400))
          updateItem(item.id, { status: 'done', progress: 100 })
        } catch (error) {
          updateItem(item.id, {
            status: 'error',
            error: getErrorMessage(error),
          })
        }
      }

      bumpRefresh()
    },
    [bumpRefresh, updateItem],
  )

  const value = useMemo(
    () => ({
      open,
      items,
      openDialog: () => setOpen(true),
      closeDialog: () => setOpen(false),
      uploadFiles,
      clearDone: () => setItems((prev) => prev.filter((i) => i.status !== 'done')),
      refreshKey,
      bumpRefresh,
    }),
    [open, items, uploadFiles, refreshKey, bumpRefresh],
  )

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
}

export function useUpload() {
  const ctx = useContext(UploadContext)
  if (!ctx) throw new Error('useUpload must be used within UploadProvider')
  return ctx
}
