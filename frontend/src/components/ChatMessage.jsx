import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, User, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

function SourceBadge({ source, index }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs">
      <ExternalLink className="w-2.5 h-2.5" />
      {source.filename}
      <span className="text-blue-500">·{Math.round(source.score * 100)}%</span>
    </span>
  )
}

export function ChatMessage({ message }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'
  const sources = message.sources || []

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-blue-600' : 'bg-gradient-to-br from-violet-600 to-indigo-700'}`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="prose-dark">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {message.streaming && <span className="typing-cursor" />}
            </div>
          )}
        </div>

        {/* Sources */}
        {!isUser && sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mt-1 ml-1"
            >
              {showSources ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {sources.length} source{sources.length > 1 ? 's' : ''}
            </button>
            {showSources && (
              <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
                {sources.map((s, i) => <SourceBadge key={i} source={s} index={i + 1} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
