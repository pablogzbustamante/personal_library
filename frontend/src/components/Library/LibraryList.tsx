import { useNavigate } from 'react-router-dom'
import { Pencil, FileText } from 'lucide-react'
import type { Document } from '../../types'
import { getCoverPalette, getTagPillStyle } from './DocumentCard'

export default function LibraryList({ documents, onEdit }: { documents: Document[]; onEdit: (doc: Document) => void }) {
  const navigate = useNavigate()

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24" style={{ color: 'var(--text-faint)' }}>
        <p className="mt-3 text-sm">No hay documentos aquí todavía</p>
      </div>
    )
  }

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
      {documents.map((doc) => {
        const { bg, color } = getCoverPalette(doc.title)
        const tag = doc.tags[0] ?? null
        const pct = Math.round(doc.progress * 100)
        const year = doc.created_at ? new Date(doc.created_at).getFullYear() : null
        const meta = [doc.author, year ? String(year) : null].filter(Boolean).join(' · ')

        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
            onClick={() => navigate(`/read/${doc.id}`)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div className="shrink-0 rounded flex items-center justify-center" style={{ width: 36, height: 52, background: bg, fontSize: 18 }}>
              {doc.cover_image_path ? (
                <img src={`/${doc.cover_image_path}`} alt={doc.title} className="w-full h-full object-cover rounded" />
              ) : <FileText size={18} style={{ color }} strokeWidth={1.5} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {meta && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{meta}</span>}
                {tag && <span className="rounded-full" style={{ ...getTagPillStyle(tag.color), fontSize: 10, padding: '1px 7px' }}>{tag.name}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="rounded-full" style={{ width: 80, height: 3, background: 'var(--progress-track)' }}>
                <div className="rounded-full bg-[#534AB7]" style={{ width: `${pct}%`, height: 3 }} />
              </div>
              <span className="w-7 text-right" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{pct}%</span>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onEdit(doc) }}
              className="p-1.5 rounded-lg transition-colors shrink-0 hover:text-[#534AB7] hover:bg-[#f0eff8]"
              style={{ color: 'var(--text-faint)' }}
            >
              <Pencil size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
