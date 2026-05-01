import { useState, useCallback } from 'react'
import { DocumentPanel } from './components/DocumentPanel.jsx'
import { ChatArea } from './components/ChatArea.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useChat } from './hooks/useChat.js'

export default function App() {
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const { documents, loading, uploading, error: docError, uploadDocument, deleteDocument, resetSession } = useDocuments()
  const { messages, streaming, error: chatError, sendMessage, stopStreaming, clearChat } = useChat()

  const handleNewSession = useCallback(async () => {
    await resetSession()
    clearChat()
    setSelectedDocIds([])
  }, [resetSession, clearChat])

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <DocumentPanel
        documents={documents}
        loading={loading}
        uploading={uploading}
        error={docError}
        onUpload={uploadDocument}
        onDelete={deleteDocument}
        selectedDocIds={selectedDocIds}
        onSelectionChange={setSelectedDocIds}
        onNewSession={handleNewSession}
      />
      <ChatArea
        messages={messages}
        streaming={streaming}
        error={chatError}
        onSend={sendMessage}
        onStop={stopStreaming}
        onClear={clearChat}
        selectedDocIds={selectedDocIds}
        hasDocuments={documents.length > 0}
      />
    </div>
  )
}
