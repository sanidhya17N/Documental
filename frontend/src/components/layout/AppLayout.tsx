import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { UploadProvider } from '@/context/UploadContext'
import { UploadDialog } from '@/components/upload/UploadDialog'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <UploadProvider>
      <div className="flex min-h-screen bg-bg">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <UploadDialog />
    </UploadProvider>
  )
}
