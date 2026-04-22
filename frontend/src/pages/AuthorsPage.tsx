import { useEffect, useState, useRef } from 'react'
import { Search, ArrowLeft, Plus, ArrowUp, ArrowDown, ChevronDown, FileText, User, Image } from 'lucide-react'
import { useLibraryStore } from '../store/useLibraryStore'
import { useNavigate } from 'react-router-dom'
import type { Author, Document as Doc, Tag } from '../types'

const TAG_COLORS = [
  '#534AB7', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4',
]

// ── Cover picker ───────────────────────────────────────────────────────────────
function CoverPicker({ cover, setCover, existingUrl }: {
  cover: File | null
  setCover: (f: File | null) => void
  existingUrl?: string | null
}) {
  const id = useRef(`cp-${Math.random().toString(36).slice(2)}`)
  const preview = cover ? URL.createObjectURL(cover) : existingUrl ? `/${existingUrl}` : null

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) { setCover(file); break }
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [setCover])

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-[#aaa] font-medium">Portada (opcional)</p>
      <label
        htmlFor={id.current}
        className="relative flex items-center justify-center rounded-lg border border-dashed border-[#d0d0d8] cursor-pointer hover:border-[#534AB7] transition-colors overflow-hidden"
        style={{ height: 96 }}
      >
        {preview ? (
          <>
            <img src={preview} alt="portada" className="w-full h-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-medium">
              Cambiar
            </span>
          </>
        ) : (
          <span className="text-[#bbb] text-xs flex items-center gap-1"><Image size={13} />Selecciona o pega imagen</span>
        )}
      </label>
      <input
        id={id.current}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setCover(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

// ── Simple dropdown ────────────────────────────────────────────────────────────
function Dropdown<T extends string>({ label, options, value, onChange }: {
  label: string
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find((o) => o.key === value)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const isDefault = value === options[0].key

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] transition-colors ${!isDefault ? 'border-[#534AB7] text-[#534AB7] bg-[#f0eff8]' : 'hover:border-[#534AB7] hover:text-[#534AB7]'}`}
        style={isDefault ? { border: '1px solid var(--border)', color: 'var(--text-muted)' } : undefined}
      >
        <span className="text-[10px] text-[#bbb] font-medium">{label}:</span>
        <span>{current?.label ?? '—'}</span>
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 rounded-xl shadow-lg py-1 min-w-[140px]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false) }}
              className={`flex items-center w-full px-3 py-1.5 text-[12px] ${opt.key === value ? 'text-[#534AB7] font-medium' : ''}`}
              style={{ color: opt.key === value ? undefined : 'var(--text-primary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt.key === value && <span className="mr-1.5">✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tag picker ─────────────────────────────────────────────────────────────────
function TagPicker({ allTags, selectedIds, onToggle }: {
  allTags: Tag[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  if (allTags.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-[#aaa] font-medium">Etiquetas</p>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => {
          const active = selectedIds.has(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id)}
              className="rounded-full transition-all"
              style={{
                fontSize: 11,
                padding: '3px 10px',
                backgroundColor: active ? tag.color + '33' : tag.color + '11',
                color: tag.color,
                border: active ? `1.5px solid ${tag.color}` : `1px solid ${tag.color}44`,
                fontWeight: active ? 600 : 400,
              }}
            >
              {active && '✓ '}{tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Author modal ───────────────────────────────────────────────────────────────
function AuthorModal({
  existing,
  onClose,
  onCreate,
  onUpdate,
  onAddTag,
  onRemoveTag,
  availableTags,
}: {
  existing?: Author
  onClose: () => void
  onCreate: (name: string, cover?: File, year?: number) => Promise<Author>
  onUpdate: (id: string, name: string, cover?: File, year?: number | null) => Promise<void>
  onAddTag: (authorId: string, tagId: string) => Promise<void>
  onRemoveTag: (authorId: string, tagId: string) => Promise<void>
  availableTags: Tag[]
}) {
  const nameParts = existing?.name.split(' ') ?? []
  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') ?? '')
  const [yearStr, setYearStr] = useState(existing?.year != null ? String(existing.year) : '')
  const [cover, setCover] = useState<File | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(existing?.tags.map((t) => t.id) ?? [])
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // For new authors, track pending tag ids to apply after creation
  const pendingTags = useRef<Set<string>>(new Set())

  const toggleTag = async (id: string) => {
    const has = selectedTagIds.has(id)
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      has ? next.delete(id) : next.add(id)
      return next
    })
    if (existing) {
      if (has) await onRemoveTag(existing.id, id)
      else await onAddTag(existing.id, id)
    } else {
      // track for post-creation
      if (has) pendingTags.current.delete(id)
      else pendingTags.current.add(id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    if (!fullName) return
    const parsedYear = yearStr.trim() ? parseInt(yearStr.trim(), 10) : undefined
    const year = parsedYear != null && !isNaN(parsedYear) ? parsedYear : null
    setLoading(true)
    setError('')
    try {
      if (existing) {
        await onUpdate(existing.id, fullName, cover ?? undefined, year)
      } else {
        const author = await onCreate(fullName, cover ?? undefined, year ?? undefined)
        await Promise.all([...pendingTags.current].map((tid) => onAddTag(author.id, tid)))
      }
      onClose()
    } catch {
      setError('Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.18)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 380, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{existing ? 'Editar autor' : 'Nuevo autor'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Nombre *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              required
            />
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder="Año de nacimiento (opcional, negativo = a.C.)"
            type="number"
            max={2099}
            value={yearStr}
            onChange={(e) => setYearStr(e.target.value)}
          />
          <CoverPicker cover={cover} setCover={setCover} existingUrl={existing?.cover_image_path} />
          <TagPicker allTags={availableTags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50"
            >
              {loading ? 'Guardando…' : existing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add docs modal ─────────────────────────────────────────────────────────────
function AddDocsModal({
  author,
  allDocs,
  onClose,
  onAssign,
}: {
  author: Author
  allDocs: Doc[]
  onClose: () => void
  onAssign: (docIds: string[]) => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const filtered = allDocs.filter((d) => {
    if (d.author && d.author.split('; ').some((a) => a.trim().toLowerCase() === author.name.toLowerCase())) return false
    if (search.trim()) return d.title.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleAssign = async () => {
    if (selected.size === 0) return
    setLoading(true)
    try {
      await onAssign([...selected])
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.18)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 420, maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-[#f0f0f4]">
          <h2 className="text-base font-semibold mb-2">Añadir PDFs existentes</h2>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none" />
            <input
              className="pl-7 pr-3 py-1.5 text-sm w-full rounded-lg focus:outline-none focus:border-[#534AB7]"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Buscar documento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-1">
          {filtered.length === 0 && (
            <p className="text-sm text-[#bbb] py-6 text-center">Sin documentos disponibles</p>
          )}
          {filtered.map((doc) => (
            <label
              key={doc.id}
              className="flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer transition-colors"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <input
                type="checkbox"
                checked={selected.has(doc.id)}
                onChange={() => toggle(doc.id)}
                className="accent-[#534AB7]"
              />
              {doc.cover_image_path ? (
                <img src={`/${doc.cover_image_path}`} alt="" className="w-8 h-10 object-cover rounded shrink-0" />
              ) : (
                <div className="w-8 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)' }}><FileText size={14} style={{ color: 'var(--text-faint)' }} strokeWidth={1.5} /></div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</span>
                {doc.author && <span className="text-[11px] text-[#aaa] truncate">{doc.author}</span>}
              </div>
            </label>
          ))}
        </div>

        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || selected.size === 0}
              className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50"
            >
              {loading ? 'Asignando…' : 'Añadir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Author card ────────────────────────────────────────────────────────────────
function AuthorCard({
  author,
  docs,
  onEdit,
  onDelete,
  onAddDocs,
}: {
  author: Author
  docs: Doc[]
  onEdit: (a: Author) => void
  onDelete: (id: string) => void
  onAddDocs: (a: Author) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const authorDocs = docs.filter(
    (d) => d.author?.split('; ').some((a) => a.trim().toLowerCase() === author.name.toLowerCase())
  )
  const completedDocs = authorDocs.filter((d) => d.progress >= 100)
  const readPct = authorDocs.length > 0 ? Math.round((completedDocs.length / authorDocs.length) * 100) : 0
  const totalPages = authorDocs.reduce((sum, d) => sum + (d.page_count ?? 0), 0)
  const pagesRead = authorDocs.reduce((sum, d) => {
    if (!d.page_count) return sum
    return sum + Math.round((d.progress / 100) * d.page_count)
  }, 0)

  const tags = author.tags.slice(0, 4)

  const coverSrc = author.cover_image_path ? `/${author.cover_image_path}` : null

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden hover:shadow-md transition-shadow" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)' }}>
        {coverSrc ? (
          <img src={coverSrc} alt={author.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            <User size={48} style={{ color: 'var(--text-faint)' }} strokeWidth={1} />
          </div>
        )}
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg py-1 min-w-[160px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => { setMenuOpen(false); onAddDocs(author) }}
                  className="flex w-full px-3 py-1.5 text-xs"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  Añadir PDFs
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onEdit(author) }}
                  className="flex w-full px-3 py-1.5 text-xs"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  Editar
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(author.id) }}
                  className="flex w-full px-3 py-1.5 text-xs text-red-500 hover:bg-[#f8f8fa]"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{author.name}</p>

        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span>{authorDocs.length} doc{authorDocs.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{pagesRead.toLocaleString()}/{totalPages.toLocaleString()} págs</span>
          <span>·</span>
          <span style={{ color: readPct === 100 ? '#10B981' : '#534AB7', fontWeight: 600 }}>{readPct}%</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {tags.map((tag) => (
              <span
                key={tag.name}
                className="rounded-full text-[10px] px-2 py-0.5"
                style={{ backgroundColor: tag.color + '22', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type SortBy = 'none' | 'name'
type SortDir = 'asc' | 'desc'
type GroupBy = 'none' | 'tag'

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'none', label: 'N/A' },
  { key: 'name', label: 'Nombre' },
]

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'none', label: 'N/A' },
  { key: 'tag', label: 'Por etiqueta' },
]

// ── Authors page ───────────────────────────────────────────────────────────────
export default function AuthorsPage() {
  const navigate = useNavigate()
  const store = useLibraryStore()

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('none')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [showCreate, setShowCreate] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null)
  const [addDocsAuthor, setAddDocsAuthor] = useState<Author | null>(null)

  useEffect(() => {
    store.fetchAll()
  }, [])

  // Filter by search
  let filtered = store.authors.filter((a) =>
    search.trim() ? a.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  // Sort
  if (sortBy === 'name') {
    filtered = [...filtered].sort((a, b) => {
      const v = a.name.localeCompare(b.name)
      return sortDir === 'asc' ? v : -v
    })
  }

  // Group by tag
  type Group = { key: string; label: string; color?: string; authors: Author[] }
  let groups: Group[] = []
  if (groupBy === 'tag') {
    const tagMap = new Map<string, { tag: { id: string; name: string; color: string }; authors: Author[] }>()
    for (const author of filtered) {
      for (const tag of author.tags) {
        if (!tagMap.has(tag.id)) tagMap.set(tag.id, { tag, authors: [] })
        tagMap.get(tag.id)!.authors.push(author)
      }
    }
    for (const [, { tag, authors }] of tagMap) {
      groups.push({ key: tag.id, label: tag.name, color: tag.color, authors })
    }
    groups.sort((a, b) => a.label.localeCompare(b.label))
    const untagged = filtered.filter((a) => a.tags.length === 0)
    if (untagged.length > 0) groups.push({ key: '__none__', label: 'Sin etiqueta', authors: untagged })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este autor? Los documentos no se borrarán.')) return
    await store.deleteAuthor(id)
  }

  const handleAssignDocs = async (docIds: string[]) => {
    if (!addDocsAuthor) return
    // Update each selected doc's author field
    await Promise.all(
      docIds.map((id) => store.updateDocument(id, { author: addDocsAuthor.name }))
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg hover:text-[#534AB7] transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Autores</h1>
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none" />
          <input
            className="pl-7 pr-3 py-1.5 text-sm border border-[#e0e0e6] rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors"
            style={{ width: 200 }}
            placeholder="Buscar autor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] transition-colors font-medium"
        >
          <Plus size={14} />
          Nuevo autor
        </button>
      </div>

      {/* Sort / Group bar */}
      <div className="flex items-center gap-2 px-5 py-2 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <Dropdown label="Ordenar" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
        <button
          onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          {sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        </button>
        <Dropdown label="Agrupar" options={GROUP_OPTIONS} value={groupBy} onChange={setGroupBy} />
        <span className="ml-auto text-[11px]" style={{ color: 'var(--text-faint)' }}>
          {filtered.length} autor{filtered.length !== 1 ? 'es' : ''}
        </span>

      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        {store.loading ? (
          <div className="flex items-center justify-center h-40 text-[#bbb] text-sm">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-[#bbb]">
            <User size={32} style={{ color: 'var(--text-faint)' }} strokeWidth={1} />
            <p className="text-sm">No hay autores</p>
            <button onClick={() => setShowCreate(true)} className="text-xs text-[#534AB7] hover:underline">
              Crear el primero
            </button>
          </div>
        ) : groupBy === 'tag' ? (
          <div className="flex flex-col">
            {groups.map((group) => (
              <div key={group.key} className="last:border-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 px-5 py-2.5">
                  {group.color && (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  )}
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{group.label}</span>
                  <span className="text-[11px] ml-1" style={{ color: 'var(--text-faint)' }}>{group.authors.length}</span>
                </div>
                <div className="px-5 pb-5">
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                    {group.authors.map((author) => (
                      <AuthorCard
                        key={author.id}
                        author={author}
                        docs={store.documents}
                        onEdit={setEditingAuthor}
                        onDelete={handleDelete}
                        onAddDocs={setAddDocsAuthor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {filtered.map((author) => (
                <AuthorCard
                  key={author.id}
                  author={author}
                  docs={store.documents}
                  onEdit={setEditingAuthor}
                  onDelete={handleDelete}
                  onAddDocs={setAddDocsAuthor}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <AuthorModal
          onClose={() => setShowCreate(false)}
          onCreate={store.createAuthor}
          onUpdate={store.updateAuthor}
          onAddTag={store.addTagToAuthor}
          onRemoveTag={store.removeTagFromAuthor}
          availableTags={store.tags}
        />
      )}
      {editingAuthor && (
        <AuthorModal
          existing={editingAuthor}
          onClose={() => setEditingAuthor(null)}
          onCreate={store.createAuthor}
          onUpdate={store.updateAuthor}
          onAddTag={store.addTagToAuthor}
          onRemoveTag={store.removeTagFromAuthor}
          availableTags={store.tags}
        />
      )}
      {addDocsAuthor && (
        <AddDocsModal
          author={addDocsAuthor}
          allDocs={store.documents}
          onClose={() => setAddDocsAuthor(null)}
          onAssign={handleAssignDocs}
        />
      )}
    </div>
  )
}
