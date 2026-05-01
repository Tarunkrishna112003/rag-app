import { useState, useCallback, useRef } from 'react'

const SOURCE_PATTERN = /__SOURCES__(.*?)__SOURCES_END__/s

export function useChat() {
  const [messages, setMessages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const sendMessage = useCallback(async (query, selectedDocIds = []) => {
    if (!query.trim() || streaming) return

    const userMsg = { id: Date.now(), role: 'user', content: query, sources: [] }
    setMessages(prev => [...prev, userMsg])
    setStreaming(true)
    setError(null)

    const assistantId = Date.now() + 1
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', sources: [], streaming: true }])

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    try {
      abortRef.current = new AbortController()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history,
          doc_ids: selectedDocIds.length > 0 ? selectedDocIds : null,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Chat request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sources = []
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            let text = parsed.text || ''

            // Extract sources metadata if present
            const sourceMatch = SOURCE_PATTERN.exec(text)
            if (sourceMatch) {
              sources = JSON.parse(sourceMatch[1])
              text = text.replace(SOURCE_PATTERN, '')
            }

            fullText += text
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: fullText, sources, streaming: true }
                  : m
              )
            )
          } catch {}
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      )
    } catch (e) {
      if (e.name === 'AbortError') return
      setError(e.message)
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setStreaming(false)
    }
  }, [messages, streaming])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
    setMessages(prev =>
      prev.map(m => m.streaming ? { ...m, streaming: false } : m)
    )
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, streaming, error, sendMessage, stopStreaming, clearChat }
}
