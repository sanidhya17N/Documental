import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { DocumentViewerPage } from '@/pages/DocumentViewerPage'
import { ChatPage } from '@/pages/ChatPage'
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage'
import { SettingsPage } from '@/pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentViewerPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="knowledge" element={<KnowledgeBasePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
