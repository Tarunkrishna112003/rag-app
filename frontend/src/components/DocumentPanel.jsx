import { useRef, useState } from 'react'
import { Upload, FileText, Trash2, RefreshCw, CheckSquare, Square, FileX, Loader2, RotateCcw } from 'lucide-react'

const FILE_ICONS = { pdf: '📄', docx: '📝', doc: '📝', txt: '📃', md: '📋' }

function getExt(filename) {
  return filename.split('.').pop().toLowerCase()
}

export function DocumentPanel({ documents, loading, uploading, error, onUpload, onDelete, onSelectionChange, selectedDocIds, onNewSession }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleFiles = async (files) => {
    for (const file of Array.from(files)) {
      try {
        const result = await onUpload(file)
        showToast(`"${file.name}" indexed (${result.total_chunks} chunks)`)
      } catch (e) {
        showToast(e.message, 'error')
      }
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDelete = async (docId, filename) => {
    setDeletingId(docId)
    try {
      await onDelete(docId)
      showToast(`"${filename}" removed`)
      if (selectedDocIds.includes(docId)) {
        onSelectionChange(selectedDocIds.filter(id => id !== docId))
      }
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSelect = (docId) => {
    if (selectedDocIds.includes(docId)) {
      onSelectionChange(selectedDocIds.filter(id => id !== docId))
    } else {
      onSelectionChange([...selectedDocIds, docId])
    }
  }

  const selectAll = () => {
    if (selectedDocIds.length === documents.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(documents.map(d => d.doc_id))
    }
  }

  return (
    <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Knowledge Base</h2>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
            <button
              onClick={onNewSession}
              title="New session — clears all documents and chat"
              className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''} indexed</p>
      </div>

      {/* Upload Zone */}
      <div className="p-3">
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
            ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'}
            ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto mb-1" />
          ) : (
            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          )}
          <p className="text-xs text-gray-400">
            {uploading ? 'Processing...' : 'Drop files or click to upload'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">PDF, DOCX, TXT, MD</p>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Filter notice */}
      {selectedDocIds.length > 0 && (
        <div className="mx-3 mb-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400">
            Searching {selectedDocIds.length} selected doc{selectedDocIds.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Select All */}
      {documents.length > 0 && (
        <div className="px-3 mb-1">
          <button
            onClick={selectAll}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors w-full"
          >
            {selectedDocIds.length === documents.length && documents.length > 0
              ? <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
              : <Square className="w-3.5 h-3.5" />}
            {selectedDocIds.length === documents.length && documents.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      )}

      {/* Document List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {documents.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-600">
            <FileX className="w-8 h-8 mb-2" />
            <p className="text-xs">No documents yet</p>
          </div>
        )}
        {documents.map(doc => {
          const ext = getExt(doc.filename)
          const icon = FILE_ICONS[ext] || '📄'
          const selected = selectedDocIds.includes(doc.doc_id)
          const isDeleting = deletingId === doc.doc_id
          return (
            <div
              key={doc.doc_id}
              className={`flex items-start gap-2 p-2.5 rounded-lg mb-1 cursor-pointer transition-all group
                ${selected ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-gray-800 border border-transparent'}`}
              onClick={() => toggleSelect(doc.doc_id)}
            >
              <div className="mt-0.5">
                {selected
                  ? <CheckSquare className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  : <Square className="w-4 h-4 text-gray-600 flex-shrink-0 group-hover:text-gray-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{icon}</span>
                  <p className="text-xs font-medium text-gray-200 truncate">{doc.filename}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{doc.total_chunks} chunks</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(doc.doc_id, doc.filename) }}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all flex-shrink-0"
              >
                {isDeleting
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`m-3 px-3 py-2 rounded-lg text-xs font-medium transition-all
          ${toast.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
          {toast.msg}
        </div>
      )}
    </aside>
  )
}
