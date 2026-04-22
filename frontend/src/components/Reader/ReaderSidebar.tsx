import { useState, useRef, useCallback, useEffect } from 'react'
import { Bookmark, StickyNote, Plus, Trash2, Check, X, Tag as TagIcon, Pencil } from 'lucide-react'
import type { Bookmark as BookmarkType, Tag, Note } from '../../types'
import { bookmarksApi } from '../../api/bookmarks'
import { tagsApi } from '../../api/tags'
import { notesApi } from '../../api/notes'
import { getTagPillStyle } from '../Library/DocumentCard'

// ── Predefined color palette ──────────────────────────────────────────────────
const PRESET_COLORS = [
  '#534AB7', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4',
  '#84CC16', '#F97316', '#6B7280', '#1F2937',
]

const SAVED_COLORS_KEY = 'folio_bookmark_colors'

function getSavedColors(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_COLORS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveColor(color: string) {
  const saved = getSavedColors()
  if (saved.includes(color) || PRESET_COLORS.includes(color)) return
  const updated = [color, ...saved].slice(0, 12)
  localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(updated))
}

// ── Color picker ──────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [customHex, setCustomHex] = useState(value)
  const [savedColors, setSavedColors] = useState<string[]>(getSavedColors)

  const pick = (color: string) => {
    onChange(color)
    setCustomHex(color)
    saveColor(color)
    setSavedColors(getSavedColors())
  }

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setCustomHex(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) pick(v)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Preset grid */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => pick(c)}
            className="w-5 h-5 rounded-full transition-transform hover:scale-110 relative"
            style={{ background: c }}
          >
            {value === c && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check size={10} color="white" strokeWidth={3} />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Saved colors */}
      {savedColors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {savedColors.map((c) => (
            <button
              key={c}
              onClick={() => pick(c)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110 relative"
              style={{ background: c }}
            >
              {value === c && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check size={10} color="white" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Custom hex input + color swatch */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#534AB7'}
          onChange={(e) => pick(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0"
          style={{ background: 'transparent' }}
          title="Elegir color personalizado"
        />
        <input
          type="text"
          value={customHex}
          onChange={handleCustomInput}
          placeholder="#534AB7"
          maxLength={7}
          className="flex-1 px-2 py-1 text-xs rounded-lg font-mono focus:outline-none"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  )
}

// ── Tag selector inside bookmark form ─────────────────────────────────────────
function TagSelector({ tags, selected, onToggle }: {
  tags: Tag[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => {
        const active = selected.includes(tag.id)
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.id)}
            className="rounded-full text-[10px] px-2 py-0.5 transition-opacity"
            style={active ? getTagPillStyle(tag.color) : {
              background: 'var(--bg-elevated)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}

// ── Bookmark form (create / edit) ─────────────────────────────────────────────
interface BookmarkFormProps {
  initial: { label: string; color: string; tagIds: string[] }
  tags: Tag[]
  onSave: (label: string, color: string, tagIds: string[]) => void
  onCancel: () => void
}

function BookmarkForm({ initial, tags, onSave, onCancel }: BookmarkFormProps) {
  const [label, setLabel] = useState(initial.label)
  const [color, setColor] = useState(initial.color)
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds)
  const [showColor, setShowColor] = useState(false)

  const toggleTag = (id: string) =>
    setTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        {/* Color dot */}
        <button
          onClick={() => setShowColor((v) => !v)}
          className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-1 transition-transform hover:scale-110"
          style={{ background: color, outline: `2px solid var(--bg-elevated)` }}
          title="Cambiar color"
        />
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nombre del marcador…"
          autoFocus
          className="flex-1 text-xs bg-transparent focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(label, color, tagIds) }}
        />
      </div>

      {showColor && <ColorPicker value={color} onChange={setColor} />}

      {tags.length > 0 && (
        <TagSelector tags={tags} selected={tagIds} onToggle={toggleTag} />
      )}

      <div className="flex gap-1.5 justify-end pt-0.5">
        <button
          onClick={onCancel}
          className="p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-faint)' }}
        >
          <X size={13} />
        </button>
        <button
          onClick={() => onSave(label, color, tagIds)}
          className="p-1 rounded-lg transition-colors text-white"
          style={{ background: '#534AB7' }}
        >
          <Check size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Single bookmark row ────────────────────────────────────────────────────────
function BookmarkRow({
  bookmark,
  tags,
  onNavigate,
  onUpdate,
  onDelete,
}: {
  bookmark: BookmarkType
  tags: Tag[]
  onNavigate: (page: number) => void
  onUpdate: (id: string, label: string, color: string, tagIds: string[]) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <BookmarkForm
        initial={{
          label: bookmark.label ?? '',
          color: bookmark.color ?? '#534AB7',
          tagIds: bookmark.tags.map((t) => t.id),
        }}
        tags={tags}
        onSave={(label, color, tagIds) => {
          onUpdate(bookmark.id, label, color, tagIds)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div
      className="group flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
      style={{ color: 'var(--text-primary)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      onClick={() => onNavigate(bookmark.page_number)}
    >
      {/* Color strip */}
      <div
        className="w-1 rounded-full shrink-0 mt-0.5"
        style={{ background: bookmark.color ?? '#534AB7', minHeight: 14, alignSelf: 'stretch' }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {bookmark.label || `Pág. ${bookmark.page_number}`}
          </span>
          <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--text-faint)' }}>
            {bookmark.page_number}
          </span>
        </div>
        {bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {bookmark.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full"
                style={{ ...getTagPillStyle(tag.color), fontSize: 9, padding: '1px 5px' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          <TagIcon size={11} />
        </button>
        <button
          onClick={() => onDelete(bookmark.id)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NoteForm({
  initial,
  tags,
  onSave,
  onCancel,
}: {
  initial: { quote: string; content: string; tagIds: string[] }
  tags: Tag[]
  onSave: (quote: string, content: string, tagIds: string[]) => void | Promise<void>
  onCancel: () => void
}) {
  const [quote, setQuote] = useState(initial.quote)
  const [content, setContent] = useState(initial.content)
  const [tagIds, setTagIds] = useState<string[]>(initial.tagIds)

  const toggleTag = (id: string) =>
    setTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      {/* Quote block */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-[#534AB7]/60" />
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Cita o texto de referencia (opcional)…"
          rows={3}
          className="w-full pl-3 text-xs bg-transparent resize-none focus:outline-none"
          style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
        />
      </div>
      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />
      {/* Note/apunte block */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Apunte o nota…"
        rows={4}
        autoFocus={!initial.quote}
        className="w-full text-xs bg-transparent resize-none focus:outline-none"
        style={{ color: 'var(--text-primary)' }}
      />
      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => {
            const active = tagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className="rounded-full text-[10px] px-2 py-0.5 transition-opacity"
                style={active ? getTagPillStyle(tag.color) : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
      <div className="flex gap-1.5 justify-end">
        <button onClick={onCancel} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--text-faint)' }}>
          <X size={13} />
        </button>
        <button
          onClick={() => onSave(quote, content, tagIds)}
          className="p-1 rounded-lg transition-colors text-white"
          style={{ background: '#534AB7' }}
          disabled={!content.trim() && !quote.trim()}
        >
          <Check size={13} />
        </button>
      </div>
    </div>
  )
}

function NoteCard({
  note,
  tags,
  onUpdate,
  onDelete,
}: {
  note: Note
  tags: Tag[]
  onUpdate: (id: string, quote: string, content: string, tagIds: string[]) => Promise<void>
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <NoteForm
        initial={{ quote: note.quote ?? '', content: note.content, tagIds: note.tags.map((t) => t.id) }}
        tags={tags}
        onSave={async (quote, content, tagIds) => { try { await onUpdate(note.id, quote, content, tagIds) } finally { setEditing(false) } }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <div
      className="group rounded-xl p-3 flex flex-col gap-1.5 transition-colors"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      {/* Page badge */}
      {note.page_number && (
        <span className="text-[10px] font-medium" style={{ color: '#534AB7' }}>Pág. {note.page_number}</span>
      )}
      {/* Quote */}
      {note.quote && (
        <div className="flex gap-2">
          <div className="w-0.5 rounded-full shrink-0 self-stretch bg-[#534AB7]/50" />
          <p className="text-[11px] italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note.quote}</p>
        </div>
      )}
      {/* Content */}
      {note.content && (
        <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{note.content}</p>
      )}
      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {note.tags.map((tag) => (
            <span key={tag.id} className="rounded-full" style={{ ...getTagPillStyle(tag.color), fontSize: 9, padding: '1px 5px' }}>{tag.name}</span>
          ))}
        </div>
      )}
      {/* Actions */}
      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

function NotesTab({ documentId, currentPage, tags }: { documentId: string; currentPage: number; tags: Tag[] }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    notesApi.list({ document_id: documentId }).then(setNotes).catch(() => {})
  }, [documentId])

  const handleCreate = async (quote: string, content: string, tagIds: string[]) => {
    if (!quote.trim() && !content.trim()) return
    let note = await notesApi.create({
      document_id: documentId,
      page_number: currentPage,
      quote: quote.trim() ? quote : undefined,
      content: content.trim(),
    })
    for (const tagId of tagIds) {
      try {
        note = await notesApi.addTag(note.id, tagId)
      } catch {}
    }
    setNotes((prev) => [note, ...prev])
    setCreating(false)
  }

  const handleUpdate = async (id: string, quote: string, content: string, tagIds: string[]) => {
    let updated = await notesApi.update(id, { quote: quote || undefined, content })
    const currentTagIds = updated.tags.map((t) => t.id)
    for (const tid of currentTagIds) {
      if (!tagIds.includes(tid)) updated = await notesApi.removeTag(id, tid)
    }
    for (const tid of tagIds) {
      if (!currentTagIds.includes(tid)) updated = await notesApi.addTag(id, tid)
    }
    setNotes((prev) => prev.map((n) => n.id === id ? updated : n))
  }

  const handleDelete = async (id: string) => {
    await notesApi.delete(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <>
      {/* Sub-header */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{notes.length} nota{notes.length !== 1 ? 's' : ''} en esta lectura</span>
        <button
          onClick={() => setCreating((v) => !v)}
          className="ml-auto p-1 rounded-lg transition-colors"
          style={{ color: creating ? '#534AB7' : 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = creating ? '#534AB7' : 'var(--text-faint)' }}
          title={`Añadir nota en página ${currentPage}`}
        >
          <Plus size={13} />
        </button>
      </div>

      {creating && (
        <div className="px-2 pt-2 shrink-0">
          <NoteForm
            initial={{ quote: '', content: '', tagIds: [] }}
            tags={tags}
            onSave={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-2">
        {notes.length === 0 && !creating ? (
          <p className="text-center text-xs py-8" style={{ color: 'var(--text-faint)' }}>Sin notas en esta lectura</p>
        ) : (
          notes.map((note) => (
            <NoteCard key={note.id} note={note} tags={tags} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))
        )}
      </div>
    </>
  )
}

// ── Main ReaderSidebar ─────────────────────────────────────────────────────────
interface ReaderSidebarProps {
  documentId: string
  currentPage: number
  side: 'left' | 'right'
  onNavigate: (page: number) => void
}

const MIN_WIDTH = 200
const MAX_WIDTH = 420
const DEFAULT_WIDTH = 260

export default function ReaderSidebar({ documentId, currentPage, side, onNavigate }: ReaderSidebarProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks')
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  // Load bookmarks and tags
  useEffect(() => {
    bookmarksApi.list(documentId).then(setBookmarks).catch(() => {})
    tagsApi.list().then(setTags).catch(() => {})
  }, [documentId])

  // ── Resize drag ──────────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
  }, [width])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = side === 'right'
        ? startX.current - e.clientX
        : e.clientX - startX.current
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta)))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [side])

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const handleCreate = async (label: string, color: string, tagIds: string[]) => {
    const bm = await bookmarksApi.create({ document_id: documentId, page_number: currentPage, label: label || undefined, color })
    let updated = bm
    for (const tagId of tagIds) {
      updated = await bookmarksApi.addTag(updated.id, tagId)
    }
    setBookmarks((prev) => [...prev, updated].sort((a, b) => a.page_number - b.page_number))
    setCreating(false)
  }

  const handleUpdate = async (id: string, label: string, color: string, tagIds: string[]) => {
    let updated = await bookmarksApi.update(id, { label: label || undefined, color })
    // Sync tags: remove ones no longer selected, add new ones
    const currentTagIds = updated.tags.map((t) => t.id)
    for (const tid of currentTagIds) {
      if (!tagIds.includes(tid)) updated = await bookmarksApi.removeTag(id, tid)
    }
    for (const tid of tagIds) {
      if (!currentTagIds.includes(tid)) updated = await bookmarksApi.addTag(id, tid)
    }
    setBookmarks((prev) => prev.map((b) => b.id === id ? updated : b))
  }

  const handleDelete = async (id: string) => {
    await bookmarksApi.delete(id)
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  const sorted = [...bookmarks].sort((a, b) => a.page_number - b.page_number)

  return (
    <div
      className="relative shrink-0 flex flex-col h-full overflow-hidden"
      style={{
        width,
        background: 'var(--bg-surface)',
        borderLeft: side === 'right' ? '1px solid var(--border)' : undefined,
        borderRight: side === 'left' ? '1px solid var(--border)' : undefined,
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-[#534AB7]/40 transition-colors"
        style={{ [side === 'right' ? 'left' : 'right']: 0 }}
      />

      {/* Tab bar */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {([
          { id: 'bookmarks', label: 'Marcadores', icon: Bookmark },
          { id: 'notes', label: 'Notas', icon: StickyNote },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setCreating(false) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
            style={{
              color: activeTab === id ? '#534AB7' : 'var(--text-muted)',
              borderBottom: activeTab === id ? '2px solid #534AB7' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Bookmarks tab */}
      {activeTab === 'bookmarks' && (
        <>
          <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{bookmarks.length} marcador{bookmarks.length !== 1 ? 'es' : ''}</span>
            <button
              onClick={() => setCreating((v) => !v)}
              className="ml-auto p-1 rounded-lg transition-colors"
              style={{ color: creating ? '#534AB7' : 'var(--text-faint)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = creating ? '#534AB7' : 'var(--text-faint)' }}
              title="Añadir marcador en página actual"
            >
              <Plus size={13} />
            </button>
          </div>

          {creating && (
            <div className="px-2 pt-2 shrink-0">
              <BookmarkForm
                initial={{ label: '', color: '#534AB7', tagIds: [] }}
                tags={tags}
                onSave={handleCreate}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-1 py-1">
            {sorted.length === 0 && !creating ? (
              <p className="text-center text-xs py-8" style={{ color: 'var(--text-faint)' }}>Sin marcadores</p>
            ) : (
              sorted.map((bm) => (
                <BookmarkRow
                  key={bm.id}
                  bookmark={bm}
                  tags={tags}
                  onNavigate={onNavigate}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <NotesTab documentId={documentId} currentPage={currentPage} tags={tags} />
      )}
    </div>
  )
}
