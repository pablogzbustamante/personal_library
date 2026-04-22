import { useEffect, useState, useRef } from 'react'
import { Search, LayoutGrid, List, LogOut, Plus, ArrowUp, ArrowDown, ChevronDown, ArrowLeft, FileText, User, Image, Check, BookMarked } from 'lucide-react'
import { useLibraryStore, selectFilteredDocuments, selectTotalPages, type SortBy, type GroupBy } from '../store/useLibraryStore'
import Sidebar from '../components/Sidebar/Sidebar'
import LibraryGrid from '../components/Library/LibraryGrid'
import LibraryList from '../components/Library/LibraryList'
import { useNavigate } from 'react-router-dom'
import type { Document as Doc } from '../types'

// ── Multi-author helpers ───────────────────────────────────────────────────────
function parseAuthors(author: string | null | undefined): string[] {
  if (!author?.trim()) return []
  return author.split('; ').map((s) => s.trim()).filter(Boolean)
}
function joinAuthors(names: string[]): string {
  return names.join('; ')
}
function hasAuthor(docAuthor: string | null | undefined, name: string): boolean {
  return parseAuthors(docAuthor).some((a) => a.toLowerCase() === name.toLowerCase())
}

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'none', label: 'N/A' },
  { key: 'title', label: 'Título' },
  { key: 'author', label: 'Autor' },
  { key: 'subject', label: 'Materia' },
  { key: 'publisher', label: 'Editorial' },
  { key: 'year', label: 'Año' },
  { key: 'progress', label: 'Progreso' },
  { key: 'pages', label: 'Páginas' },
]

const GROUP_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'none', label: 'N/A' },
  { key: 'author', label: 'Por autor' },
  { key: 'subject', label: 'Por materia' },
  { key: 'tag', label: 'Por etiqueta' },
  { key: 'year', label: 'Por año' },
]

// ── Dropdown toggle ────────────────────────────────────────────────────────────
function SortDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { key: string; label: string }[]
  value: string
  onChange: (v: string) => void
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px] transition-colors ${
          value !== options[0].key
            ? 'border-[#534AB7] text-[#534AB7] bg-[#f0eff8]'
            : 'border-[#e0e0e6] text-[#888] hover:border-[#534AB7] hover:text-[#534AB7]'
        }`}
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
              className={`flex items-center w-full px-3 py-1.5 text-[12px] transition-colors ${opt.key === value ? 'text-[#534AB7] font-medium' : ''}`}
              style={{ color: opt.key === value ? undefined : 'var(--text-primary)' }}
              onMouseEnter={(e) => { if (opt.key !== value) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
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

// ── Upload modal ───────────────────────────────────────────────────────────────
// Shared helpers
function CoverPicker({ cover, setCover, existingUrl }: {
  cover: File | null
  setCover: (f: File | null) => void
  existingUrl?: string | null
}) {
  const inputId = useRef(`cp-${Math.random().toString(36).slice(2)}`)
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
        htmlFor={inputId.current}
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
        id={inputId.current}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setCover(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}

function TagPicker({ allTags, selectedIds, onToggle }: {
  allTags: { id: string; name: string; color: string }[]
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

// ── Multi-author selector ──────────────────────────────────────────────────────
function MultiAuthorSelector({ selectedAuthors, onChange, availableAuthors, onCreateAuthor }: {
  selectedAuthors: string[]
  onChange: (authors: string[]) => void
  availableAuthors: import('../types').Author[]
  onCreateAuthor: (name: string) => Promise<import('../types').Author>
}) {
  const [tab, setTab] = useState<'existing' | 'create'>('existing')
  const [search, setSearch] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [creating, setCreating] = useState(false)

  const filtered = availableAuthors.filter((a) =>
    !search.trim() || a.name.toLowerCase().includes(search.toLowerCase())
  )

  const add = (name: string) => {
    if (!selectedAuthors.includes(name)) onChange([...selectedAuthors, name])
  }
  const remove = (name: string) => onChange(selectedAuthors.filter((n) => n !== name))

  const handleCreate = async () => {
    const full = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    if (!full) return
    setCreating(true)
    try {
      const author = await onCreateAuthor(full)
      add(author.name)
      setFirstName('')
      setLastName('')
    } finally {
      setCreating(false)
    }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-[#aaa] font-medium">Autores</p>

      {selectedAuthors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedAuthors.map((name, i) => (
            <span
              key={name}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]"
              style={{
                background: i === 0 ? '#534AB722' : 'var(--bg-elevated)',
                color: i === 0 ? '#534AB7' : 'var(--text-secondary)',
                border: `1px solid ${i === 0 ? '#534AB744' : 'var(--border)'}`,
              }}
            >
              {i === 0 && <span className="text-[9px] font-bold opacity-50 uppercase mr-0.5">ppal</span>}
              {name}
              <button type="button" onClick={() => remove(name)} className="ml-0.5 leading-none opacity-40 hover:opacity-100">✕</button>
            </span>
          ))}
        </div>
      )}

      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <button type="button" onClick={() => setTab('existing')}
          className="flex-1 py-1.5 text-xs font-medium transition-colors"
          style={{ background: tab === 'existing' ? '#534AB7' : 'transparent', color: tab === 'existing' ? '#fff' : 'var(--text-muted)' }}>
          Existente
        </button>
        <button type="button" onClick={() => setTab('create')}
          className="flex-1 py-1.5 text-xs font-medium transition-colors"
          style={{ background: tab === 'create' ? '#534AB7' : 'transparent', color: tab === 'create' ? '#fff' : 'var(--text-muted)' }}>
          Crear nuevo
        </button>
      </div>

      {tab === 'existing' ? (
        <div className="flex flex-col gap-1">
          <input
            className="w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={inputStyle}
            placeholder="Buscar autor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-col max-h-36 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
            {filtered.map((author) => {
              const already = selectedAuthors.includes(author.name)
              return (
                <button
                  type="button"
                  key={author.id}
                  onClick={() => already ? remove(author.name) : add(author.name)}
                  className="flex items-center px-3 py-1.5 text-xs text-left transition-colors"
                  style={{ background: already ? 'var(--hover-bg-soft)' : 'transparent', color: already ? '#534AB7' : 'var(--text-primary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = already ? 'var(--hover-bg-soft)' : 'transparent' }}
                >
                  <span className="flex-1">{author.name}</span>
                  {already && <Check size={10} />}
                </button>
              )
            })}
            {filtered.length === 0 && search.trim() && (
              <p className="text-[11px] px-3 py-2 text-center" style={{ color: 'var(--text-faint)' }}>Sin resultados</p>
            )}
            {availableAuthors.length === 0 && !search.trim() && (
              <p className="text-[11px] px-3 py-2 text-center" style={{ color: 'var(--text-faint)' }}>Sin autores creados</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={inputStyle}
              placeholder="Nombre *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={inputStyle}
              placeholder="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !firstName.trim()}
            className="px-3 py-1.5 text-xs rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50 self-end"
          >
            {creating ? 'Creando…' : '+ Agregar'}
          </button>
        </div>
      )}
    </div>
  )
}

function UploadModal({ onClose, onUpload, onAddTag, availableTags, availableAuthors, onCreateAuthor, availableSubjects, onCreateSubject }: {
  onClose: () => void
  onUpload: (title: string, file: File, author?: string, cover?: File, publisher?: string, year?: number, reference?: string, subject?: string) => Promise<{ id: string }>
  onAddTag: (docId: string, tagId: string) => Promise<void>
  availableTags: { id: string; name: string; color: string }[]
  availableAuthors: import('../types').Author[]
  onCreateAuthor: (name: string, cover?: File) => Promise<import('../types').Author>
  availableSubjects: import('../types').Subject[]
  onCreateSubject: (name: string) => Promise<import('../types').Subject>
}) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [publisher, setPublisher] = useState('')
  const [year, setYear] = useState('')
  const [reference, setReference] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Author selector state
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])

  // Subject selector state
  const [selectedSubjectName, setSelectedSubjectName] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors'
  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filteredSubjects = availableSubjects.filter((s) =>
    !subjectSearch.trim() || s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError('')
    let subjectName = selectedSubjectName
    try {
      if (subjectSearch.trim() && !filteredSubjects.find((s) => s.name.toLowerCase() === subjectSearch.toLowerCase())) {
        const newSubject = await onCreateSubject(subjectSearch.trim())
        subjectName = newSubject.name
      }
      const parsedYear = year.trim() ? parseInt(year.trim(), 10) : undefined
      const authorStr = joinAuthors(selectedAuthors) || undefined
      const doc = await onUpload(title, file, authorStr, cover || undefined, publisher.trim() || undefined, isNaN(parsedYear!) ? undefined : parsedYear, reference.trim() || undefined, subjectName || undefined)
      await Promise.all([...selectedTagIds].map((tid) => onAddTag(doc.id, tid)))
      onClose()
    } catch {
      setError('Error al subir el archivo. Intenta de nuevo.')
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
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 420, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Subir PDF</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={inputCls} style={inputStyle}
            placeholder="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <MultiAuthorSelector
            selectedAuthors={selectedAuthors}
            onChange={setSelectedAuthors}
            availableAuthors={availableAuthors}
            onCreateAuthor={onCreateAuthor}
          />

          {/* Subject selector */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] text-[#aaa] font-medium">Materia</p>
            <div className="flex flex-col gap-1">
              <input
                className="w-full px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
                style={inputStyle}
                placeholder="Buscar o crear materia…"
                value={subjectSearch || selectedSubjectName}
                onChange={(e) => { setSubjectSearch(e.target.value); setSelectedSubjectName('') }}
              />
              {(subjectSearch.trim() || selectedSubjectName) && (
                <div className="flex flex-col max-h-28 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => { setSelectedSubjectName(''); setSubjectSearch('') }}
                    className="flex items-center px-3 py-1.5 text-xs text-left transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >Sin materia</button>
                  {filteredSubjects.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => { setSelectedSubjectName(s.name); setSubjectSearch('') }}
                      className="flex items-center px-3 py-1.5 text-xs text-left transition-colors"
                      style={{ background: selectedSubjectName === s.name ? 'var(--hover-bg-soft)' : 'transparent', color: selectedSubjectName === s.name ? '#534AB7' : 'var(--text-primary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = selectedSubjectName === s.name ? 'var(--hover-bg-soft)' : 'transparent' }}
                    >
                      <span className="flex-1">{s.name}</span>
                      {selectedSubjectName === s.name && <Check size={10} />}
                    </button>
                  ))}
                  {subjectSearch.trim() && !filteredSubjects.find((s) => s.name.toLowerCase() === subjectSearch.toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => { setSelectedSubjectName(subjectSearch.trim()); setSubjectSearch('') }}
                      className="flex items-center px-3 py-1.5 text-xs text-left text-[#534AB7] transition-colors"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >+ Crear "{subjectSearch.trim()}"</button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              className={inputCls} style={{ ...inputStyle, flex: 1 }}
              placeholder="Editorial (opcional)"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
            <input
              className={inputCls} style={{ ...inputStyle, width: 90 }}
              placeholder="Año"
              type="number"
              max={9999}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <textarea
            className={inputCls} style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }}
            placeholder="Cita APA (opcional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            rows={2}
          />
          <label
            className="flex flex-col items-center justify-center gap-1 py-4 rounded-lg border border-dashed border-[#d0d0d8] cursor-pointer hover:border-[#534AB7] transition-colors text-[#aaa] text-sm"
            htmlFor="pdf-upload"
          >
            {file ? (
              <span className="text-[#534AB7] font-medium text-xs">{file.name}</span>
            ) : (
              <>
                <FileText size={22} style={{ color: 'var(--text-faint)' }} strokeWidth={1.5} />
                <span>Selecciona un PDF</span>
              </>
            )}
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
          <CoverPicker cover={cover} setCover={setCover} />
          <TagPicker allTags={availableTags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end mt-1">
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
              disabled={loading || !file}
              className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50"
            >
              {loading ? 'Subiendo…' : 'Subir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── New tag modal ──────────────────────────────────────────────────────────────
const TAG_COLORS = [
  '#534AB7', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4',
]

function NewTagModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, color: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(TAG_COLORS[0])
  const [hexInput, setHexInput] = useState(TAG_COLORS[0])
  const [loading, setLoading] = useState(false)

  const applyColor = (c: string) => {
    setColor(c)
    setHexInput(c)
  }

  const handleHexChange = (v: string) => {
    setHexInput(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim(), color)
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
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Nueva etiqueta</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            {/* Preset swatches */}
            <div className="flex gap-2 flex-wrap">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => applyColor(c)}
                  className="w-6 h-6 rounded-full transition-transform shrink-0"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            {/* Custom color row */}
            <div className="flex items-center gap-2">
              {/* Native color picker swatch */}
              <label
                className="relative shrink-0 rounded-lg overflow-hidden cursor-pointer"
                style={{ width: 32, height: 32, border: '2px solid var(--border)' }}
                title="Elegir color"
              >
                <div className="absolute inset-0" style={{ background: color }} />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => applyColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
              {/* Hex text input */}
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                onBlur={() => setHexInput(color)}
                className="flex-1 px-2 py-1.5 text-xs font-mono rounded-lg focus:outline-none focus:border-[#534AB7]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                maxLength={7}
                placeholder="#000000"
              />
              {/* Live preview pill */}
              <span
                className="rounded-full text-[11px] px-2.5 py-0.5 font-medium shrink-0"
                style={{ background: color + '22', color, border: `1px solid ${color}55` }}
              >
                {name || 'Etiqueta'}
              </span>
            </div>
          </div>

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
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit document modal ────────────────────────────────────────────────────────
function EditDocumentModal({ doc, onClose, onUpdate, onUpdateCover, onAddTag, onRemoveTag, onDelete, availableTags }: {
  doc: Doc
  onClose: () => void
  onUpdate: (id: string, data: { title?: string; author?: string; subject?: string | null; publisher?: string; year?: number | null; reference?: string | null }) => Promise<void>
  onUpdateCover: (id: string, cover: File) => Promise<void>
  onAddTag: (docId: string, tagId: string) => Promise<void>
  onRemoveTag: (docId: string, tagId: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  availableTags: { id: string; name: string; color: string }[]
}) {
  const [title, setTitle] = useState(doc.title)
  const [authors, setAuthors] = useState<string[]>(parseAuthors(doc.author))
  const [subject, setSubject] = useState(doc.subject ?? '')
  const [publisher, setPublisher] = useState(doc.publisher ?? '')
  const [year, setYear] = useState(doc.year != null ? String(doc.year) : '')
  const [reference, setReference] = useState(doc.reference ?? '')
  const [cover, setCover] = useState<File | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(doc.tags.map((t) => t.id))
  )
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors'
  const { authors: availableAuthors, createAuthor } = useLibraryStore()
  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  const toggleTag = async (id: string) => {
    const has = selectedTagIds.has(id)
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      has ? next.delete(id) : next.add(id)
      return next
    })
    if (has) await onRemoveTag(doc.id, id)
    else await onAddTag(doc.id, id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const parsedYear = year.trim() ? parseInt(year.trim(), 10) : null
      const authorStr = joinAuthors(authors) || undefined
      await onUpdate(doc.id, { title, author: authorStr, subject: subject.trim() || null, publisher: publisher.trim() || undefined, year: year.trim() ? (isNaN(parsedYear!) ? null : parsedYear) : null, reference: reference.trim() || null })
      if (cover) await onUpdateCover(doc.id, cover)
      onClose()
    } catch {
      setError('Error al guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete(doc.id)
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
        className="rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 400, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Editar documento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className={inputCls} style={inputStyle}
            placeholder="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <MultiAuthorSelector
            selectedAuthors={authors}
            onChange={setAuthors}
            availableAuthors={availableAuthors}
            onCreateAuthor={(name) => createAuthor(name)}
          />
          <input
            className={inputCls} style={inputStyle}
            placeholder="Materia (opcional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              className={inputCls} style={{ ...inputStyle, flex: 1 }}
              placeholder="Editorial (opcional)"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
            <input
              className={inputCls} style={{ ...inputStyle, width: 90 }}
              placeholder="Año"
              type="number"
              max={9999}
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <textarea
            className={inputCls} style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }}
            placeholder="Cita APA (opcional)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            rows={2}
          />
          <CoverPicker cover={cover} setCover={setCover} existingUrl={doc.cover_image_path} />
          <TagPicker allTags={availableTags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}

          {confirmDelete ? (
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-600 font-medium">¿Eliminar este documento?</p>
              <p className="text-[11px] text-red-400">Esta acción no se puede deshacer.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-1.5 text-xs rounded-lg border border-[#e0e0e6] text-[#555] hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDelete}
                  className="flex-1 py-1.5 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors mr-auto"
              >
                Eliminar
              </button>
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
                {loading ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// ── New folder modal ───────────────────────────────────────────────────────────
function NewFolderModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim())
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
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Nueva carpeta</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder="Nombre de la carpeta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
          />
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
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit author modal ──────────────────────────────────────────────────────────
function EditAuthorModal({ author, onClose }: { author: import('../types').Author; onClose: () => void }) {
  const store = useLibraryStore()
  const nameParts = author.name.split(' ')
  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') ?? '')
  const [yearStr, setYearStr] = useState(author.year != null ? String(author.year) : '')
  const [cover, setCover] = useState<File | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(author.tags.map((t) => t.id)))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleTag = async (id: string) => {
    const has = selectedTagIds.has(id)
    setSelectedTagIds((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next })
    if (has) await store.removeTagFromAuthor(author.id, id)
    else await store.addTagToAuthor(author.id, id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    if (!fullName) return
    const parsedYear = yearStr.trim() ? parseInt(yearStr.trim(), 10) : null
    setLoading(true); setError('')
    try {
      await store.updateAuthor(author.id, fullName, cover ?? undefined, isNaN(parsedYear!) ? null : parsedYear)
      onClose()
    } catch { setError('Error al guardar.') }
    finally { setLoading(false) }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 380, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Editar autor</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={inputStyle}
              placeholder="Nombre *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus required
            />
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={inputStyle}
              placeholder="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={inputStyle}
            placeholder="Año de nacimiento (opcional, negativo = a.C.)"
            type="number"
            max={2099}
            value={yearStr}
            onChange={(e) => setYearStr(e.target.value)}
          />
          <CoverPicker cover={cover} setCover={setCover} existingUrl={author.cover_image_path} />
          <TagPicker allTags={store.tags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50">{loading ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add docs to author modal ───────────────────────────────────────────────────
function AddDocsToAuthorModal({ author, onClose }: { author: import('../types').Author; onClose: () => void }) {
  const store = useLibraryStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const filtered = store.documents.filter((d) => {
    if (hasAuthor(d.author, author.name)) return false
    if (search.trim()) return d.title.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  const handleAssign = async () => {
    if (selected.size === 0) return
    setLoading(true)
    try {
      await Promise.all([...selected].map((id) => store.updateDocument(id, { author: author.name })))
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose}>
      <div className="rounded-2xl flex flex-col overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 420, maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Añadir PDFs existentes</h2>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none" />
            <input className="pl-7 pr-3 py-1.5 text-sm w-full rounded-lg focus:outline-none focus:border-[#534AB7]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Buscar documento…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-1">
          {filtered.length === 0 && <p className="text-sm py-6 text-center" style={{ color: 'var(--text-faint)' }}>Sin documentos disponibles</p>}
          {filtered.map((doc) => (
            <label key={doc.id} className="flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggle(doc.id)} className="accent-[#534AB7]" />
              {doc.cover_image_path ? <img src={`/${doc.cover_image_path}`} alt="" className="w-8 h-10 object-cover rounded shrink-0" /> : <div className="w-8 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)' }}><FileText size={14} style={{ color: 'var(--text-faint)' }} strokeWidth={1.5} /></div>}
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</span>
                {doc.author && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{doc.author}</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Cancelar</button>
            <button onClick={handleAssign} disabled={loading || selected.size === 0} className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50">{loading ? 'Asignando…' : 'Añadir'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Inline authors grid ────────────────────────────────────────────────────────
function AuthorGridCard({ author, onSelect }: { author: import('../types').Author; onSelect: (name: string) => void }) {
  const store = useLibraryStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [addingDocs, setAddingDocs] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const authorDocs = store.documents.filter((d) => hasAuthor(d.author, author.name))
  const totalPages = authorDocs.reduce((s, d) => s + (d.page_count ?? 0), 0)
  const pagesRead = authorDocs.reduce((s, d) => { if (!d.page_count) return s; return s + Math.round((d.progress / 100) * d.page_count) }, 0)
  const readPct = authorDocs.length > 0 ? Math.round(authorDocs.reduce((s, d) => s + d.progress, 0) / authorDocs.length) : 0
  const coverSrc = author.cover_image_path ? `/${author.cover_image_path}` : null

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este autor? Los documentos no se borrarán.')) return
    await store.deleteAuthor(author.id)
  }

  return (
    <>
      <div
        className="group flex flex-col rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        {/* Cover */}
        <div
          className="relative overflow-hidden cursor-pointer"
          style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)' }}
          onClick={() => onSelect(author.name)}
        >
          {coverSrc ? (
            <img src={coverSrc} alt={author.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><User size={40} style={{ color: 'var(--text-faint)' }} strokeWidth={1} /></div>
          )}
          {/* Actions overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >⋯</button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg py-1 min-w-[150px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setAddingDocs(true) }} className="flex w-full px-3 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Añadir PDFs</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditing(true) }} className="flex w-full px-3 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); handleDelete() }} className="flex w-full px-3 py-1.5 text-xs text-red-500" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Eliminar</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Info */}
        <div className="flex flex-col gap-1 p-3 cursor-pointer" onClick={() => onSelect(author.name)}>
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{author.name}</p>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>{authorDocs.length} doc{authorDocs.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{pagesRead.toLocaleString()}/{totalPages.toLocaleString()} pgs</span>
            <span>·</span>
            <span style={{ color: readPct >= 100 ? '#10B981' : '#534AB7', fontWeight: 600 }}>{readPct}%</span>
          </div>
        </div>
      </div>
      {editing && <EditAuthorModal author={author} onClose={() => setEditing(false)} />}
      {addingDocs && <AddDocsToAuthorModal author={author} onClose={() => setAddingDocs(false)} />}
    </>
  )
}

// ── Create author modal (inline in library) ────────────────────────────────────
function CreateAuthorModal({ onClose }: { onClose: () => void }) {
  const store = useLibraryStore()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [yearStr, setYearStr] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pendingTags = useRef<Set<string>>(new Set())

  const toggleTag = (id: string) => {
    const has = selectedTagIds.has(id)
    setSelectedTagIds((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next })
    if (has) pendingTags.current.delete(id)
    else pendingTags.current.add(id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    if (!fullName) return
    const parsedYear = yearStr.trim() ? parseInt(yearStr.trim(), 10) : undefined
    setLoading(true); setError('')
    try {
      const author = await store.createAuthor(fullName, cover ?? undefined, isNaN(parsedYear!) ? undefined : parsedYear)
      await Promise.all([...pendingTags.current].map((tid) => store.addTagToAuthor(author.id, tid)))
      onClose()
    } catch { setError('Error al crear.') }
    finally { setLoading(false) }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 380, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Nuevo autor</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={inputStyle}
              placeholder="Nombre *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus required
            />
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
              style={inputStyle}
              placeholder="Apellido"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={inputStyle}
            placeholder="Año de nacimiento (opcional, negativo = a.C.)"
            type="number"
            max={2099}
            value={yearStr}
            onChange={(e) => setYearStr(e.target.value)}
          />
          <CoverPicker cover={cover} setCover={setCover} />
          <TagPicker allTags={store.tags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50">{loading ? 'Creando…' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AuthorsView({ onSelect, search, onShowCreate }: {
  onSelect: (name: string) => void
  search: string
  onShowCreate: () => void
}) {
  const { authors, sortBy, sortDir } = useLibraryStore()

  let filtered = search.trim()
    ? authors.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : [...authors]

  if (sortBy === 'author') {
    const lastName = (name: string) => {
      const parts = name.trim().split(/\s+/)
      return parts.length > 1 ? parts[parts.length - 1] : parts[0]
    }
    filtered = [...filtered].sort((a, b) => {
      const v = lastName(a.name).localeCompare(lastName(b.name))
      return sortDir === 'asc' ? v : -v
    })
  }

  const addCard = (
    <div
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
      style={{ border: '1.5px dashed var(--border)' }}
      onClick={onShowCreate}
    >
      <div
        className="flex items-center justify-center"
        style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)' }}
      >
        <Plus size={36} strokeWidth={1} style={{ color: 'var(--text-faint)' }} />
      </div>
      <div className="p-3 flex items-center justify-center">
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-faint)' }}>Agregar autor</p>
      </div>
    </div>
  )

  if (filtered.length === 0 && search.trim()) {
    return (
      <div className="p-5">
        <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-faint)' }}>
          <p className="text-sm mb-4">Sin resultados para "{search}"</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {addCard}
        </div>
      </div>
    )
  }

  return (
    <div className="p-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
      {filtered.map((author) => (
        <AuthorGridCard key={author.id} author={author} onSelect={onSelect} />
      ))}
      {addCard}
    </div>
  )
}

// ── Subjects view ─────────────────────────────────────────────────────────────
function EditSubjectModal({ subject, onClose }: { subject: import('../types').Subject; onClose: () => void }) {
  const store = useLibraryStore()
  const [name, setName] = useState(subject.name)
  const [cover, setCover] = useState<File | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set(subject.tags.map((t) => t.id)))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleTag = async (id: string) => {
    const has = selectedTagIds.has(id)
    setSelectedTagIds((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next })
    if (has) await store.removeTagFromSubject(subject.id, id)
    else await store.addTagToSubject(subject.id, id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      await store.updateSubject(subject.id, name.trim(), cover ?? undefined)
      onClose()
    } catch { setError('Error al guardar.') }
    finally { setLoading(false) }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 380, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Editar materia</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={inputStyle}
            placeholder="Nombre *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus required
          />
          <CoverPicker cover={cover} setCover={setCover} existingUrl={subject.cover_image_path} />
          <TagPicker allTags={store.tags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50">{loading ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddDocsToSubjectModal({ subject, onClose }: { subject: import('../types').Subject; onClose: () => void }) {
  const store = useLibraryStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const filtered = store.documents.filter((d) => {
    if (d.subject?.toLowerCase() === subject.name.toLowerCase()) return false
    if (search.trim()) return d.title.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const toggle = (id: string) => setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  const handleAssign = async () => {
    if (selected.size === 0) return
    setLoading(true)
    try {
      await Promise.all([...selected].map((id) => store.updateDocument(id, { subject: subject.name })))
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose}>
      <div className="rounded-2xl flex flex-col overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 420, maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Añadir PDFs a materia</h2>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none" />
            <input className="pl-7 pr-3 py-1.5 text-sm w-full rounded-lg focus:outline-none focus:border-[#534AB7]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Buscar documento…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-1">
          {filtered.length === 0 && <p className="text-sm py-6 text-center" style={{ color: 'var(--text-faint)' }}>Sin documentos disponibles</p>}
          {filtered.map((doc) => (
            <label key={doc.id} className="flex items-center gap-3 py-2 px-2 rounded-lg cursor-pointer" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggle(doc.id)} className="accent-[#534AB7]" />
              {doc.cover_image_path ? <img src={`/${doc.cover_image_path}`} alt="" className="w-8 h-10 object-cover rounded shrink-0" /> : <div className="w-8 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'var(--bg-elevated)' }}><FileText size={14} style={{ color: 'var(--text-faint)' }} strokeWidth={1.5} /></div>}
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{doc.title}</span>
                {doc.subject && <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{doc.subject}</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Cancelar</button>
            <button onClick={handleAssign} disabled={loading || selected.size === 0} className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50">{loading ? 'Asignando…' : 'Añadir'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubjectGridCard({ subject, onSelect }: { subject: import('../types').Subject; onSelect: (name: string) => void }) {
  const store = useLibraryStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [addingDocs, setAddingDocs] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const subjectDocs = store.documents.filter((d) => d.subject?.toLowerCase() === subject.name.toLowerCase())
  const totalPages = subjectDocs.reduce((s, d) => s + (d.page_count ?? 0), 0)
  const pagesRead = subjectDocs.reduce((s, d) => { if (!d.page_count) return s; return s + Math.round((d.progress / 100) * d.page_count) }, 0)
  const readPct = subjectDocs.length > 0 ? Math.round(subjectDocs.reduce((s, d) => s + d.progress, 0) / subjectDocs.length) : 0
  const coverSrc = subject.cover_image_path ? `/${subject.cover_image_path}` : null

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta materia? Los documentos no se borrarán.')) return
    await store.deleteSubject(subject.id)
  }

  return (
    <>
      <div className="group flex flex-col rounded-2xl overflow-hidden hover:shadow-md transition-shadow" style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="relative overflow-hidden cursor-pointer" style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)' }} onClick={() => onSelect(subject.name)}>
          {coverSrc ? <img src={coverSrc} alt={subject.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookMarked size={40} style={{ color: 'var(--text-faint)' }} strokeWidth={1} /></div>}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div ref={menuRef} className="relative">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>⋯</button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg py-1 min-w-[150px]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setAddingDocs(true) }} className="flex w-full px-3 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Añadir PDFs</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditing(true) }} className="flex w-full px-3 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); handleDelete() }} className="flex w-full px-3 py-1.5 text-xs text-red-500" onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Eliminar</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 p-3 cursor-pointer" onClick={() => onSelect(subject.name)}>
          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{subject.name}</p>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <span>{subjectDocs.length} doc{subjectDocs.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{pagesRead.toLocaleString()}/{totalPages.toLocaleString()} pgs</span>
            <span>·</span>
            <span style={{ color: readPct >= 100 ? '#10B981' : '#534AB7', fontWeight: 600 }}>{readPct}%</span>
          </div>
        </div>
      </div>
      {editing && <EditSubjectModal subject={subject} onClose={() => setEditing(false)} />}
      {addingDocs && <AddDocsToSubjectModal subject={subject} onClose={() => setAddingDocs(false)} />}
    </>
  )
}

function CreateSubjectModal({ onClose }: { onClose: () => void }) {
  const store = useLibraryStore()
  const [name, setName] = useState('')
  const [cover, setCover] = useState<File | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pendingTags = useRef<Set<string>>(new Set())

  const toggleTag = (id: string) => {
    const has = selectedTagIds.has(id)
    setSelectedTagIds((prev) => { const next = new Set(prev); has ? next.delete(id) : next.add(id); return next })
    if (has) pendingTags.current.delete(id)
    else pendingTags.current.add(id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      const subject = await store.createSubject(name.trim(), cover ?? undefined)
      await Promise.all([...pendingTags.current].map((tid) => store.addTagToSubject(subject.id, tid)))
      onClose()
    } catch { setError('Error al crear.') }
    finally { setLoading(false) }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as React.CSSProperties

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.18)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 flex flex-col gap-4 overflow-y-auto" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', width: '100%', maxWidth: 380, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Nueva materia</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:border-[#534AB7]"
            style={inputStyle}
            placeholder="Nombre *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus required
          />
          <CoverPicker cover={cover} setCover={setCover} />
          <TagPicker allTags={store.tags} selectedIds={selectedTagIds} onToggle={toggleTag} />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'transparent' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-1.5 text-sm rounded-lg bg-[#534AB7] text-white hover:bg-[#4540a0] disabled:opacity-50">{loading ? 'Creando…' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SubjectsView({ onSelect, search, onShowCreate }: {
  onSelect: (name: string) => void
  search: string
  onShowCreate: () => void
}) {
  const { subjects } = useLibraryStore()

  const filtered = search.trim()
    ? subjects.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : subjects

  const addCard = (
    <div
      className="flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
      style={{ border: '1.5px dashed var(--border)' }}
      onClick={onShowCreate}
    >
      <div className="flex items-center justify-center" style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)' }}>
        <Plus size={36} strokeWidth={1} style={{ color: 'var(--text-faint)' }} />
      </div>
      <div className="p-3 flex items-center justify-center">
        <p className="text-[12px] font-medium" style={{ color: 'var(--text-faint)' }}>Agregar materia</p>
      </div>
    </div>
  )

  if (filtered.length === 0 && search.trim()) {
    return (
      <div className="p-5">
        <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-faint)' }}>
          <p className="text-sm mb-4">Sin resultados para "{search}"</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {addCard}
        </div>
      </div>
    )
  }

  return (
    <div className="p-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
      {filtered.map((subject) => (
        <SubjectGridCard key={subject.id} subject={subject} onSelect={onSelect} />
      ))}
      {addCard}
    </div>
  )
}

// ── Grouped view helpers ───────────────────────────────────────────────────────
type GroupItem = { key: string; label: string; color?: string; docs: Doc[] }

function buildGroups(docs: Doc[], groupBy: 'author' | 'subject' | 'tag' | 'year'): GroupItem[] {
  const groups: GroupItem[] = []
  if (groupBy === 'author' || groupBy === 'subject') {
    const map = new Map<string, Doc[]>()
    for (const doc of docs) {
      const key = groupBy === 'author' ? (parseAuthors(doc.author)[0] ?? '(Sin autor)') : (doc.subject ?? '(Sin materia)')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(doc)
    }
    for (const [key, gdocs] of map) groups.push({ key, label: key, docs: gdocs })
    groups.sort((a, b) => a.label.localeCompare(b.label))
  } else if (groupBy === 'tag') {
    const tagMap = new Map<string, { tag: { id: string; name: string; color: string }; docs: Doc[] }>()
    for (const doc of docs) {
      for (const tag of doc.tags) {
        if (!tagMap.has(tag.id)) tagMap.set(tag.id, { tag, docs: [] })
        tagMap.get(tag.id)!.docs.push(doc)
      }
    }
    const untagged = docs.filter((d) => d.tags.length === 0)
    for (const [, { tag, docs: tdocs }] of tagMap) groups.push({ key: tag.id, label: tag.name, color: tag.color, docs: tdocs })
    groups.sort((a, b) => a.label.localeCompare(b.label))
    if (untagged.length > 0) groups.push({ key: '__none__', label: 'Sin etiqueta', docs: untagged })
  } else {
    const map = new Map<string, Doc[]>()
    for (const doc of docs) {
      const key = doc.year != null ? String(doc.year) : '(Sin año)'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(doc)
    }
    const noYear = map.get('(Sin año)')
    map.delete('(Sin año)')
    const sorted = [...map.entries()].sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    for (const [key, gdocs] of sorted) {
      const num = parseInt(key)
      const label = num < 0 ? `${Math.abs(num)} a.C.` : key
      groups.push({ key, label, docs: gdocs })
    }
    if (noYear && noYear.length > 0) groups.push({ key: '__noyear__', label: 'Sin año', docs: noYear })
  }
  return groups
}

// ── Grouped view ──────────────────────────────────────────────────────────────
function GroupedView({
  docs,
  groupBy,
  groupBy2,
  viewMode,
  authorSearch,
  tagSearch,
  onSearchChange,
  onEdit,
}: {
  docs: Doc[]
  groupBy: 'author' | 'subject' | 'tag' | 'year'
  groupBy2: GroupBy
  viewMode: 'grid' | 'list'
  authorSearch?: string
  tagSearch?: string
  onSearchChange: (q: string) => void
  onEdit: (doc: Doc) => void
}) {
  const search = (groupBy === 'author' ? authorSearch : groupBy === 'tag' ? tagSearch : '') ?? ''

  const groups = buildGroups(docs, groupBy)
  const filtered = search.trim()
    ? groups.filter((g) => g.label.toLowerCase().includes(search.toLowerCase()))
    : groups

  const hasNested = groupBy2 !== 'none' && groupBy2 !== groupBy

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      <div className="sticky top-0 z-10 px-5 py-2" style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
        <div className="relative max-w-xs">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none" />
          <input
            className="pl-7 pr-3 py-1.5 text-sm w-full rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            placeholder={groupBy === 'author' ? 'Buscar autor…' : groupBy === 'subject' ? 'Buscar materia…' : groupBy === 'tag' ? 'Buscar etiqueta…' : 'Buscar año…'}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {filtered.map((group) => (
        <div key={group.key} className="last:border-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 px-5 py-2.5">
            {group.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />}
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{group.label}</span>
            <span className="text-[11px] ml-1" style={{ color: 'var(--text-faint)' }}>{group.docs.length}</span>
          </div>
          {hasNested ? (
            /* Nested sub-groups */
            buildGroups(group.docs, groupBy2 as 'author' | 'tag').map((sub) => (
              <div key={sub.key} className="last:border-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 px-8 py-1.5">
                  {sub.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />}
                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>{sub.label}</span>
                  <span className="text-[10px] ml-1" style={{ color: 'var(--text-faint)' }}>{sub.docs.length}</span>
                </div>
                {viewMode === 'grid' ? <LibraryGrid documents={sub.docs} onEdit={onEdit} /> : <LibraryList documents={sub.docs} onEdit={onEdit} />}
              </div>
            ))
          ) : viewMode === 'grid' ? (
            <LibraryGrid documents={group.docs} onEdit={onEdit} />
          ) : (
            <LibraryList documents={group.docs} onEdit={onEdit} />
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="flex items-center justify-center py-16 text-[#bbb] text-sm">Sin resultados</div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LibraryPage() {
  const navigate = useNavigate()
  const store = useLibraryStore()
  const filteredDocs = useLibraryStore(selectFilteredDocuments)
  const totalPages = useLibraryStore(selectTotalPages)

  const [showUpload, setShowUpload] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [showNewTag, setShowNewTag] = useState(false)
  const [showCreateAuthor, setShowCreateAuthor] = useState(false)
  const [showCreateSubject, setShowCreateSubject] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null)
  const [activeAuthorName, setActiveAuthorName] = useState<string | null>(null)
  const [activeSubjectName, setActiveSubjectName] = useState<string | null>(null)

  useEffect(() => {
    store.fetchAll()
  }, [])

  const handleSelectFolder = (id: string | null) => {
    if (id !== 'authors') setActiveAuthorName(null)
    if (id !== 'subjects') setActiveSubjectName(null)
    store.setActiveFolderId(id)
  }

  const isAuthorsView = store.activeFolderId === 'authors'
  const isSubjectsView = store.activeFolderId === 'subjects'

  const activeFolderName =
    isAuthorsView && activeAuthorName
      ? activeAuthorName
      : isAuthorsView
        ? 'Autores'
        : isSubjectsView && activeSubjectName
          ? activeSubjectName
          : isSubjectsView
            ? 'Materias'
            : store.activeFolderId
                ? store.folders.find((f) => f.id === store.activeFolderId)?.name ?? 'Carpeta'
                : 'Libreria de la Luna'

  const handleLogout = () => {
    localStorage.removeItem('folio_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        folders={store.folders}
        documents={store.documents}
        tags={store.tags}
        authors={store.authors}
        activeFolderId={store.activeFolderId}
        activeTagId={store.activeTagId}
        onSelectFolder={handleSelectFolder}
        onSelectTag={store.setActiveTagId}
        onNewFolder={() => setShowNewFolder(true)}
        onRenameFolder={store.renameFolder}
        onDeleteFolder={store.deleteFolder}
        onCreateSubfolder={(parentId, name) => store.createFolder(name, parentId)}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-page)' }}>
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          {((isAuthorsView && activeAuthorName) || (isSubjectsView && activeSubjectName)) && (
            <button
              onClick={() => { setActiveAuthorName(null); setActiveSubjectName(null) }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{activeFolderName}</h1>
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bbb] pointer-events-none"
            />
            <input
              className="pl-7 pr-3 py-1.5 text-sm rounded-lg focus:outline-none focus:border-[#534AB7] transition-colors"
              style={{ width: 200, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Buscar…"
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => store.setViewMode('grid')}
              className="p-1.5 transition-colors"
              style={{ background: store.viewMode === 'grid' ? '#f0eff8' : 'transparent', color: store.viewMode === 'grid' ? '#534AB7' : 'var(--text-faint)' }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => store.setViewMode('list')}
              className="p-1.5 transition-colors"
              style={{ background: store.viewMode === 'list' ? '#f0eff8' : 'transparent', color: store.viewMode === 'list' ? '#534AB7' : 'var(--text-faint)' }}
            >
              <List size={14} />
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 transition-colors rounded-lg"
            style={{ color: 'var(--text-faint)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            title="Cerrar sesión"
          >
            <LogOut size={14} />
          </button>
        </div>

        {/* Tag bar */}
        <div className="flex items-center gap-2 px-5 py-2 overflow-x-auto shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          {store.tags.map((tag) => {
            const isActive = store.activeTagId === tag.id
            return (
              <button
                key={tag.id}
                onClick={() => store.setActiveTagId(tag.id)}
                className="rounded-full whitespace-nowrap transition-all"
                style={{
                  fontSize: 11,
                  padding: '3px 10px',
                  backgroundColor: tag.color + '22',
                  color: tag.color,
                  border: isActive ? `1.5px solid ${tag.color}` : `1px solid ${tag.color}44`,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {tag.name}
              </button>
            )
          })}
          {store.activeTagId && (
            <button
              onClick={() => store.setActiveTagId(store.activeTagId!)}
              className="text-[11px] text-[#aaa] hover:text-[#555]"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => setShowNewTag(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-[#d0d0d8] text-[#bbb] hover:border-[#534AB7] hover:text-[#534AB7] transition-colors whitespace-nowrap"
            style={{ fontSize: 11, padding: '3px 10px' }}
          >
            <Plus size={10} />
            Etiqueta
          </button>
        </div>

        {/* Sort / Group bar */}
        <div className="flex items-center gap-2 px-5 py-2 shrink-0" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
          {/* Sort by dropdown */}
          <SortDropdown
            label="Ordenar"
            options={SORT_OPTIONS}
            value={store.sortBy}
            onChange={(v: string) => store.setSortBy(v as SortBy)}
          />

          {/* Asc / Desc toggle */}
          <button
            onClick={() => store.setSortDir(store.sortDir === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            title={store.sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {store.sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          </button>

          {/* Group by dropdown */}
          <SortDropdown
            label="Agrupar"
            options={GROUP_OPTIONS}
            value={store.groupBy}
            onChange={(v: string) => store.setGroupBy(v as GroupBy)}
          />
          {/* Secondary grouping — only when primary is set */}
          {store.groupBy !== 'none' && (
            <SortDropdown
              label="luego por"
              options={GROUP_OPTIONS.filter((o) => o.key === 'none' || o.key !== store.groupBy)}
              value={store.groupBy2}
              onChange={(v: string) => store.setGroupBy2(v as GroupBy)}
            />
          )}

          {/* Add reading — only in library view */}
          {!isAuthorsView && !isSubjectsView && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title="Subir lectura"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#534AB7'; (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
            >
              <Plus size={12} />
              <span className="text-[12px]">Lectura</span>
            </button>
          )}
          {/* Add author — only in authors view */}
          {isAuthorsView && !activeAuthorName && (
            <button
              onClick={() => setShowCreateAuthor(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title="Agregar autor"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#534AB7'; (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
            >
              <Plus size={12} />
              <span className="text-[12px]">Autor</span>
            </button>
          )}
          {/* Add subject — only in subjects view */}
          {isSubjectsView && !activeSubjectName && (
            <button
              onClick={() => setShowCreateSubject(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              title="Agregar materia"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#534AB7'; (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
            >
              <Plus size={12} />
              <span className="text-[12px]">Materia</span>
            </button>
          )}

          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-faint)' }}>
            <span>{filteredDocs.length} doc{filteredDocs.length !== 1 ? 's' : ''}</span>
            {totalPages > 0 && (
              <span>{totalPages.toLocaleString()} pág{totalPages !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="flex-1 overflow-y-auto">
          {store.loading ? (
            <div className="flex items-center justify-center h-full text-[#bbb] text-sm">
              Cargando…
            </div>
          ) : isAuthorsView && !activeAuthorName ? (
            <AuthorsView onSelect={setActiveAuthorName} search={store.searchQuery} onShowCreate={() => setShowCreateAuthor(true)} />
          ) : isSubjectsView && !activeSubjectName ? (
            <SubjectsView onSelect={setActiveSubjectName} search={store.searchQuery} onShowCreate={() => setShowCreateSubject(true)} />
          ) : (() => {
            const docs = isAuthorsView && activeAuthorName
              ? filteredDocs.filter((d) => hasAuthor(d.author, activeAuthorName))
              : isSubjectsView && activeSubjectName
                ? filteredDocs.filter((d) => d.subject?.toLowerCase() === activeSubjectName.toLowerCase())
                : filteredDocs
            return store.groupBy === 'author' ? (
              <GroupedView
                docs={docs}
                groupBy="author"
                groupBy2={store.groupBy2}
                viewMode={store.viewMode}
                authorSearch={store.authorSearch}
                onSearchChange={store.setAuthorSearch}
                onEdit={setEditingDoc}
              />
            ) : store.groupBy === 'tag' ? (
              <GroupedView
                docs={docs}
                groupBy="tag"
                groupBy2={store.groupBy2}
                viewMode={store.viewMode}
                tagSearch={store.tagSearch}
                onSearchChange={store.setTagSearch}
                onEdit={setEditingDoc}
              />
            ) : store.groupBy === 'subject' ? (
              <GroupedView
                docs={docs}
                groupBy="subject"
                groupBy2={store.groupBy2}
                viewMode={store.viewMode}
                onSearchChange={() => {}}
                onEdit={setEditingDoc}
              />
            ) : store.groupBy === 'year' ? (
              <GroupedView
                docs={docs}
                groupBy="year"
                groupBy2={store.groupBy2}
                viewMode={store.viewMode}
                onSearchChange={() => {}}
                onEdit={setEditingDoc}
              />
            ) : store.viewMode === 'grid' ? (
              <LibraryGrid documents={docs} onEdit={setEditingDoc} onShowCreate={!isAuthorsView && !isSubjectsView ? () => setShowUpload(true) : undefined} />
            ) : (
              <LibraryList documents={docs} onEdit={setEditingDoc} />
            )
          })()}
        </div>
      </div>

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={store.uploadDocument}
          onAddTag={store.addTagToDocument}
          availableTags={store.tags}
          availableAuthors={store.authors}
          onCreateAuthor={store.createAuthor}
          availableSubjects={store.subjects}
          onCreateSubject={store.createSubject}
        />
      )}
      {showNewFolder && (
        <NewFolderModal
          onClose={() => setShowNewFolder(false)}
          onCreate={(name) => store.createFolder(name)}
        />
      )}
      {showNewTag && (
        <NewTagModal
          onClose={() => setShowNewTag(false)}
          onCreate={(name, color) => store.createTag(name, color)}
        />
      )}
      {editingDoc && (
        <EditDocumentModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onUpdate={store.updateDocument}
          onUpdateCover={store.updateCover}
          onAddTag={store.addTagToDocument}
          onRemoveTag={store.removeTagFromDocument}
          onDelete={store.deleteDocument}
          availableTags={store.tags}
        />
      )}
      {showCreateAuthor && (
        <CreateAuthorModal onClose={() => setShowCreateAuthor(false)} />
      )}
      {showCreateSubject && (
        <CreateSubjectModal onClose={() => setShowCreateSubject(false)} />
      )}
    </div>
  )
}
