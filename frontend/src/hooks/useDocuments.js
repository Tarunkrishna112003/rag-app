import { useState, useCallback, useEffect } from 'react'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/documents')
      if (!res.ok) throw new Error('Failed to fetch documents')
      const data = await res.json()
      setDocuments(data.documents || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadDocument = useCallback(async (file) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/documents', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      await fetchDocuments()
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setUploading(false)
    }
  }, [fetchDocuments])

  const deleteDocument = useCallback(async (docId) => {
    setError(null)
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Delete failed')
      setDocuments(prev => prev.filter(d => d.doc_id !== docId))
    } catch (e) {
      setError(e.message)
      throw e
    }
  }, [])

  const resetSession = useCallback(async () => {
    await fetch('/api/reset', { method: 'POST' })
    setDocuments([])
  }, [])

  // Clear all documents on every page load
  useEffect(() => {
    resetSession()
  }, [])

  return { documents, loading, uploading, error, uploadDocument, deleteDocument, fetchDocuments, resetSession }
}
