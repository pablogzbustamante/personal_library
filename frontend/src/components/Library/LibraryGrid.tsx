import { Plus } from 'lucide-react'
import type { Document } from '../../types'
import DocumentCard from './DocumentCard'

export default function LibraryGrid({ documents, onEdit, onShowCreate }: { documents: Document[]; onEdit: (doc: Document) => void; onShowCreate?: () => void }) {
  const addCard = onShowCreate ? (
    <div
      className="flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
      style={{ border: '1.5px dashed var(--border)' }}
      onClick={onShowCreate}
    >
      <div className="flex items-center justify-center" style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)' }}>
        <Plus size={36} strokeWidth={1} style={{ color: 'var(--text-faint)' }} />
      </div>
      <div className="p-2 flex items-center justify-center">
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-faint)' }}>Agregar lectura</p>
      </div>
    </div>
  ) : null

  if (documents.length === 0) {
    return (
      <div className="p-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
        {addCard}
      </div>
    )
  }

  return (
    <div className="p-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onEdit={onEdit} />
      ))}
      {addCard}
    </div>
  )
}
