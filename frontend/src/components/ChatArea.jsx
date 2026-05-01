import { useEffect, useRef } from 'react'
import { Bot, Trash2, MessageSquare } from 'lucide-react'
import { ChatMessage } from './ChatMessage.jsx'
import { ChatInput } from './ChatInput.jsx'

export function ChatArea({ messages, streaming, error, onSend, onStop, onClear, selectedDocIds, hasDocuments }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  const handleSend = (query) => onSend(query, selectedDocIds)

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Topbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-100">Assistant</h1>
            <p className="text-xs text-gray-500">
              {selectedDocIds.length > 0
                ? `Searching ${selectedDocIds.length} selected document${selectedDocIds.length > 1 ? 's' : ''}`
                : 'Searching all documents'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 px-2.5 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-700/20 border border-violet-500/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">Ask your documents anything</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              {hasDocuments
                ? 'Upload files in the sidebar, then ask questions. The AI will search for relevant information and answer with citations.'
                : 'Upload PDF, DOCX, TXT, or Markdown files in the left panel to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {error && (
              <div className="flex justify-center">
                <div className="px-4 py-2 bg-red-500/15 border border-red-500/30 rounded-lg text-sm text-red-300">
                  {error}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={onStop}
        streaming={streaming}
        hasDocuments={hasDocuments}
      />
    </div>
  )
}
