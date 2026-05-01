import { useState, useRef, useCallback } from 'react'
import { Send, Square, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Summarize the main topics covered in the documents',
  'What are the key findings or conclusions?',
  'Explain the most important concepts mentioned',
  'What questions does this content answer?',
]

export function ChatInput({ onSend, onStop, streaming, hasDocuments }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const textareaRef = useRef(null)

  const handleSubmit = useCallback((e) => {
    e?.preventDefault()
    if (!input.trim() || streaming) return
    onSend(input.trim())
    setInput('')
    setShowSuggestions(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [input, streaming, onSend])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e) => {
    setInput(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 180) + 'px'
    }
  }

  const useSuggestion = (text) => {
    setInput(text)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="border-t border-gray-800 bg-gray-950 px-4 pb-4 pt-3">
      {/* Suggestions */}
      {showSuggestions && hasDocuments && (
        <div className="mb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => useSuggestion(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={hasDocuments ? 'Ask anything about your documents...' : 'Upload documents to get started...'}
            disabled={!hasDocuments && !streaming}
            rows={1}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm text-gray-100
              placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors scrollbar-thin"
            style={{ minHeight: '48px' }}
          />
          {hasDocuments && !streaming && (
            <button
              type="button"
              onClick={() => setShowSuggestions(s => !s)}
              className="absolute right-3 bottom-3 text-gray-500 hover:text-gray-300 transition-colors"
              title="Show suggestions"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

        {streaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40
              flex items-center justify-center text-red-400 transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || !hasDocuments}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40
              disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>

      <p className="text-center text-xs text-gray-600 mt-2">
        Press Enter to send, Shift+Enter for newline
      </p>
    </div>
  )
}
