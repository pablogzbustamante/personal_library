import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag as TagIcon, Pencil, FileText } from 'lucide-react'
import type { Document as Doc } from '../../types'
import { useLibraryStore } from '../../store/useLibraryStore'

const COVER_PALETTES = [
  { bg: '#EDE9FE', color: '#7C3AED' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#D1FAE5', color: '#059669' },
  { bg: '#FEE2E2', color: '#DC2626' },
  { bg: '#FCE7F3', color: '#DB2777' },
  { bg: '#FEF3C7', color: '#D97706' },
  { bg: '#E0F2FE', color: '#0284C7' },
  { bg: '#F0FDF4', color: '#16A34A' },
  { bg: '#FFF7ED', color: '#EA580C' },
  { bg: '#F5F3FF', color: '#7C3AED' },
]

export function getCoverPalette(title: string) {
  const hash = [...title].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COVER_PALETTES[hash % COVER_PALETTES.length]
}

export function getTagPillStyle(color: string) {
  return {
    backgroundColor: color + '22',
    color: color,
    border: `1px solid ${color}44`,
  }
}

export default function DocumentCard({ document: doc, onEdit }: { document: Doc; onEdit?: (doc: Doc) => void }) {
  const navigate = useNavigate()
  const { tags, addTagToDocument, removeTagFromDocument } = useLibraryStore()
  const { bg, color } = getCoverPalette(doc.title)
  const pct = Math.round(doc.progress * 100)

  const [showPicker, setShowPicker] = useState(false)
  const [hovered, setHovered] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [showPicker])

  const toggleTag = async (e: React.MouseEvent, tagId: string) => {
    e.stopPropagation()
    const has = doc.tags.some((t) => t.id === tagId)
    if (has) await removeTagFromDocument(doc.id, tagId)
    else await addTagToDocument(doc.id, tagId)
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden cursor-pointer transition-colors"
      style={{ minWidth: 0, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/read/${doc.id}`)}
    >
      {/* Cover */}
      <div className="flex items-center justify-center" style={{ aspectRatio: '2/3', background: bg, position: 'relative' }}>
        {doc.cover_image_path ? (
          <img src={`/${doc.cover_image_path}`} alt={doc.title} className="w-full h-full object-cover" />
        ) : (
          <FileText size={32} style={{ color }} strokeWidth={1.5} />
        )}

        {(hovered || showPicker) && (
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            {onEdit && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(doc) }} className="p-1 rounded-md bg-white/80 backdrop-blur-sm text-[#534AB7] hover:bg-white transition-colors shadow-sm">
                <Pencil size={12} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setShowPicker((v) => !v) }} className="p-1 rounded-md bg-white/80 backdrop-blur-sm text-[#534AB7] hover:bg-white transition-colors shadow-sm">
              <TagIcon size={12} />
            </button>
          </div>
        )}

        {showPicker && (
          <div
            ref={pickerRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute top-7 right-1.5 z-20 rounded-xl shadow-lg py-1.5 min-w-[140px]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {tags.length === 0 ? (
              <p className="text-[11px] px-3 py-1" style={{ color: 'var(--text-faint)' }}>Sin etiquetas</p>
            ) : (
              tags.map((tag) => {
                const active = doc.tags.some((t) => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={(e) => toggleTag(e, tag.id)}
                    className="flex items-center gap-2 w-full px-3 py-1 transition-colors text-left"
                    style={{ color: 'var(--text-primary)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                    <span className="text-[12px] flex-1">{tag.name}</span>
                    {active && <span className="text-[#534AB7] text-[10px]">✓</span>}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col gap-1 flex-1">
        <p
          className="font-semibold leading-snug"
          style={{
            fontSize: 12, color: 'var(--text-primary)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {doc.title}
        </p>
        {doc.author && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {doc.author.split('; ').join(' · ')}
          </p>
        )}

        <div className="mt-auto pt-1">
          <div className="w-full rounded-full" style={{ height: 3, background: 'var(--progress-track)' }}>
            <div className="rounded-full bg-[#534AB7]" style={{ height: 3, width: `${pct}%` }} />
          </div>
          <p className="mt-0.5" style={{ fontSize: 10, color: 'var(--text-faint)' }}>{pct}%</p>
        </div>

        {doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {doc.tags.slice(0, 2).map((tag) => (
              <span key={tag.id} className="rounded-full" style={{ ...getTagPillStyle(tag.color), fontSize: 10, padding: '1px 7px' }}>
                {tag.name}
              </span>
            ))}
            {doc.tags.length > 2 && (
              <span className="self-center" style={{ fontSize: 10, color: 'var(--text-faint)' }}>+{doc.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
