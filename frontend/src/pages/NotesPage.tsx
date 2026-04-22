import { useEffect, useState, useRef, useMemo } from 'react'
import { Search, Plus, Trash2, Pencil, X, Check, ChevronDown, FolderPlus, Folder, FolderOpen, ArrowUp, ArrowDown, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Note, NoteFolder, Tag } from '../types'
import { notesApi, noteFoldersApi } from '../api/notes'
import { tagsApi } from '../api/tags'
import { getTagPillStyle } from '../components/Library/DocumentCard'

// ── Helpers ───────────────────────────────────────────────────────────────────
type SortBy = 'created_at' | 'updated_at' | 'document' | 'page'
type SortDir = 'asc' | 'desc'
type GroupBy = 'none' | 'document' | 'author' | 'tag' | 'folder'

function Dropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
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

  const isActive = value !== options[0].key

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px] transition-colors ${isActive
          ? 'border-[#534AB7] text-[#534AB7] bg-[#f0eff8]'
          : 'border-[#e0e0e6] text-[#888] hover:border-[#534AB7] hover:text-[#534AB7]'}`}
      >
        <span className="text-[10px] text-[#bbb] font-medium">{label}:</span>
        <span>{current?.label ?? '—'}</span>
        <ChevronDown size={10} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl py-1 min-w-[130px]"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
        >
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors"
              style={{
                color: value === o.key ? '#534AB7' : 'var(--text-primary)',
                fontWeight: value === o.key ? 600 : 400,
                background: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Note card ─────────────────────────────────────────────────────────────────
function NoteCard({
  note,
  allTags,
  allFolders,
  onUpdate,
  onDelete,
  onFolderToggle,
}: {
  note: Note
  allTags: Tag[]
  allFolders: NoteFolder[]
  onUpdate: (id: string, quote: string, content: string, tagIds: string[]) => Promise<void>
  onDelete: (id: string) => void
  onFolderToggle: (noteId: string, folderId: string, inFolder: boolean) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [quote, setQuote] = useState(note.quote ?? '')
  const [content, setContent] = useState(note.content)
  const [tagIds, setTagIds] = useState<string[]>(note.tags.map((t) => t.id))
  const [folderOpen, setFolderOpen] = useState(false)
  const folderRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!folderOpen) return
    const handler = (e: MouseEvent) => {
      if (folderRef.current && !folderRef.current.contains(e.target as Node)) setFolderOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [folderOpen])

  const toggleTag = (id: string) =>
    setTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  if (editing) {
    return (
      <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        {/* Quote */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-[#534AB7]/60" />
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="Cita (opcional)…"
            rows={3}
            className="w-full pl-3 text-xs bg-transparent resize-none focus:outline-none"
            style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
          />
        </div>
        <div style={{ height: 1, background: 'var(--border)' }} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Apunte…"
          rows={4}
          className="w-full text-xs bg-transparent resize-none focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => {
              const active = tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full text-[10px] px-2 py-0.5"
                  style={active ? getTagPillStyle(tag.color) : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        )}
        <div className="flex gap-1.5 justify-end">
          <button onClick={() => { setEditing(false); setQuote(note.quote ?? ''); setContent(note.content); setTagIds(note.tags.map((t) => t.id)) }} className="p-1 rounded-lg" style={{ color: 'var(--text-faint)' }}>
            <X size={13} />
          </button>
          <button
            onClick={async () => { try { await onUpdate(note.id, quote, content, tagIds) } finally { setEditing(false) } }}
            className="p-1 rounded-lg text-white"
            style={{ background: '#534AB7' }}
          >
            <Check size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      {/* Meta */}
      <div className="flex items-center gap-2 flex-wrap">
        {note.document && (
          <button
            onClick={() => navigate(`/read/${note.document!.id}`)}
            className="text-[11px] font-medium hover:underline"
            style={{ color: '#534AB7' }}
          >
            {note.document.title}
          </button>
        )}
        {note.page_number && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg-elevated)', color: 'var(--text-faint)' }}>
            p. {note.page_number}
          </span>
        )}
        {note.document?.author && (
          <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{note.document.author}</span>
        )}
      </div>

      {/* Quote block */}
      {note.quote && (
        <div
          className="flex gap-2 rounded-lg transition-colors"
          style={{ cursor: note.document && note.page_number ? 'pointer' : 'default' }}
          onClick={() => {
            if (note.document && note.page_number)
              navigate(`/read/${note.document.id}`, { state: { page: note.page_number, quote: note.quote } })
          }}
          title={note.document && note.page_number ? `Ir a p. ${note.page_number}` : undefined}
        >
          <div className="w-0.5 rounded-full shrink-0 self-stretch bg-[#534AB7]/50" />
          <p className="text-sm italic leading-relaxed" style={{ color: 'var(--text-muted)' }}>{note.quote}</p>
        </div>
      )}

      {/* Content block */}
      {note.content && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{note.content}</p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span key={tag.id} className="rounded-full" style={{ ...getTagPillStyle(tag.color), fontSize: 10, padding: '2px 7px' }}>{tag.name}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        {allFolders.length > 0 && (
          <div ref={folderRef} className="relative">
            <button
              onClick={() => setFolderOpen((v) => !v)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: note.folders.length > 0 ? '#534AB7' : 'var(--text-faint)' }}
              title="Carpetas"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = note.folders.length > 0 ? '#534AB7' : 'var(--text-faint)' }}
            >
              <Folder size={13} />
            </button>
            {folderOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 z-30 rounded-xl shadow-lg py-1 min-w-[160px]"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {allFolders.map((folder) => {
                  const inFolder = note.folders.some((f) => f.id === folder.id)
                  return (
                    <button
                      key={folder.id}
                      onClick={async () => {
                        await onFolderToggle(note.id, folder.id, inFolder)
                        setFolderOpen(false)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors"
                      style={{ color: inFolder ? '#534AB7' : 'var(--text-primary)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {inFolder ? <FolderOpen size={11} /> : <Folder size={11} />}
                      <span className="flex-1 truncate text-left">{folder.name}</span>
                      {inFolder && <Check size={10} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(note.id)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-faint)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Folder tree sidebar ───────────────────────────────────────────────────────
function FolderTree({
  folders,
  activeFolderId,
  onSelect,
  onRename,
  onDelete,
}: {
  folders: NoteFolder[]
  activeFolderId: string | null
  onSelect: (id: string | null) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const roots = folders.filter((f) => !f.parent_id)

  const renderFolder = (folder: NoteFolder, depth = 0) => {
    const children = folders.filter((f) => f.parent_id === folder.id)
    const isActive = activeFolderId === folder.id
    const isEditing = editingId === folder.id

    return (
      <div key={folder.id}>
        <div
          className="group flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-colors"
          style={{
            paddingLeft: 8 + depth * 14,
            background: isActive ? 'var(--hover-bg-soft)' : 'transparent',
            color: isActive ? '#534AB7' : 'var(--text-primary)',
          }}
          onClick={() => onSelect(isActive ? null : folder.id)}
          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          {isActive ? <FolderOpen size={13} style={{ color: '#534AB7' }} /> : <Folder size={13} style={{ color: 'var(--text-faint)' }} />}
          {isEditing ? (
            <input
              autoFocus
              className="flex-1 text-xs bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => { onRename(folder.id, editName); setEditingId(null) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { onRename(folder.id, editName); setEditingId(null) }
                if (e.key === 'Escape') setEditingId(null)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-xs truncate">{folder.name}</span>
          )}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setEditingId(folder.id); setEditName(folder.name) }}
              className="p-0.5 rounded"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={() => onDelete(folder.id)}
              className="p-0.5 rounded"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
        {children.map((c) => renderFolder(c, depth + 1))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {roots.map((f) => renderFolder(f))}
    </div>
  )
}

// ── Group rendering ────────────────────────────────────────────────────────────
function GroupSection({ label, notes, allTags, allFolders, onUpdate, onDelete, onFolderToggle }: {
  label: string
  notes: Note[]
  allTags: Tag[]
  allFolders: NoteFolder[]
  onUpdate: (id: string, quote: string, content: string, tagIds: string[]) => Promise<void>
  onDelete: (id: string) => void
  onFolderToggle: (noteId: string, folderId: string, inFolder: boolean) => Promise<void>
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold py-1"
        style={{ color: 'var(--text-muted)' }}
      >
        <ChevronDown size={13} style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .15s' }} />
        {label}
        <span className="ml-1 font-normal" style={{ color: 'var(--text-faint)' }}>{notes.length}</span>
      </button>
      {open && notes.map((note) => (
        <NoteCard key={note.id} note={note} allTags={allTags} allFolders={allFolders} onUpdate={onUpdate} onDelete={onDelete} onFolderToggle={onFolderToggle} />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function NewNoteCard({
  allTags,
  onCreate,
  onCancel,
}: {
  allTags: Tag[]
  onCreate: (quote: string, content: string, tagIds: string[]) => Promise<void>
  onCancel: () => void
}) {
  const [quote, setQuote] = useState('')
  const [content, setContent] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggleTag = (id: string) =>
    setTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id])

  const save = async () => {
    if (saving || (!quote.trim() && !content.trim())) return
    setSaving(true)
    try {
      await onCreate(quote, content, tagIds)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-[#534AB7]/60" />
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Cita (opcional)..."
          rows={3}
          className="w-full pl-3 text-xs bg-transparent resize-none focus:outline-none"
          style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
        />
      </div>
      <div style={{ height: 1, background: 'var(--border)' }} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Apunte..."
        rows={4}
        autoFocus
        className="w-full text-xs bg-transparent resize-none focus:outline-none"
        style={{ color: 'var(--text-primary)' }}
      />
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {allTags.map((tag) => {
            const active = tagIds.includes(tag.id)
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className="rounded-full text-[10px] px-2 py-0.5"
                style={active ? getTagPillStyle(tag.color) : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
      <div className="flex gap-1.5 justify-end">
        <button onClick={onCancel} className="p-1 rounded-lg" style={{ color: 'var(--text-faint)' }}>
          <X size={13} />
        </button>
        <button
          onClick={save}
          className="p-1 rounded-lg text-white disabled:opacity-50"
          style={{ background: '#534AB7' }}
          disabled={saving || (!quote.trim() && !content.trim())}
        >
          <Check size={13} />
        </button>
      </div>
    </div>
  )
}

export default function NotesPage() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<Note[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [folders, setFolders] = useState<NoteFolder[]>([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
  const [filterTagId, setFilterTagId] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [creatingNote, setCreatingNote] = useState(false)

  useEffect(() => {
    notesApi.list().then(setNotes).catch(() => {})
    tagsApi.list().then(setAllTags).catch(() => {})
    noteFoldersApi.list().then(setFolders).catch(() => {})
  }, [])

  // ── CRUD ──────────────────────────────────────────────────────────────────────
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

  const handleCreate = async (quote: string, content: string, tagIds: string[]) => {
    if (!quote.trim() && !content.trim()) return
    let note = await notesApi.create({
      quote: quote.trim() ? quote : undefined,
      content: content.trim(),
    })
    for (const tagId of tagIds) {
      try {
        note = await notesApi.addTag(note.id, tagId)
      } catch {}
    }
    if (activeFolderId) {
      try {
        note = await notesApi.addToFolder(note.id, activeFolderId)
      } catch {}
    }
    setNotes((prev) => [note, ...prev])
    setCreatingNote(false)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const folder = await noteFoldersApi.create({ name: newFolderName.trim() })
    setFolders((prev) => [...prev, folder])
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const handleRenameFolder = async (id: string, name: string) => {
    if (!name.trim()) return
    const updated = await noteFoldersApi.update(id, { name: name.trim() })
    setFolders((prev) => prev.map((f) => f.id === id ? updated : f))
  }

  const handleDeleteFolder = async (id: string) => {
    await noteFoldersApi.delete(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (activeFolderId === id) setActiveFolderId(null)
  }

  const handleFolderToggle = async (noteId: string, folderId: string, inFolder: boolean) => {
    const updated = inFolder
      ? await notesApi.removeFromFolder(noteId, folderId)
      : await notesApi.addToFolder(noteId, folderId)
    setNotes((prev) => prev.map((n) => n.id === noteId ? updated : n))
  }

  // ── Filter + sort ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = notes

    if (activeFolderId) {
      result = result.filter((n) => n.folders.some((f) => f.id === activeFolderId))
    }
    if (filterTagId) {
      result = result.filter((n) => n.tags.some((t) => t.id === filterTagId))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((n) =>
        n.content.toLowerCase().includes(q) ||
        (n.quote?.toLowerCase().includes(q) ?? false) ||
        (n.document?.title.toLowerCase().includes(q) ?? false) ||
        (n.document?.author?.toLowerCase().includes(q) ?? false)
      )
    }

    const asc = sortDir === 'asc'
    return [...result].sort((a, b) => {
      let v = 0
      if (sortBy === 'created_at') v = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      else if (sortBy === 'updated_at') v = new Date(a.updated_at ?? a.created_at).getTime() - new Date(b.updated_at ?? b.created_at).getTime()
      else if (sortBy === 'document') v = (a.document?.title ?? '').localeCompare(b.document?.title ?? '')
      else if (sortBy === 'page') v = (a.page_number ?? 0) - (b.page_number ?? 0)
      return asc ? v : -v
    })
  }, [notes, activeFolderId, filterTagId, search, sortBy, sortDir])

  // ── Group ─────────────────────────────────────────────────────────────────────
  const grouped: { label: string; notes: Note[] }[] | null = useMemo(() => {
    if (groupBy === 'none') return null
    const map = new Map<string, Note[]>()

    for (const note of filtered) {
      let keys: string[] = []
      if (groupBy === 'document') keys = [note.document?.title ?? 'Sin lectura']
      else if (groupBy === 'author') keys = [note.document?.author ?? 'Sin autor']
      else if (groupBy === 'tag') keys = note.tags.length ? note.tags.map((t) => t.name) : ['Sin etiqueta']
      else if (groupBy === 'folder') keys = note.folders.length ? note.folders.map((f) => f.name) : ['Sin carpeta']
      for (const key of keys) {
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(note)
      }
    }

    return [...map.entries()].map(([label, notes]) => ({ label, notes })).sort((a, b) => a.label.localeCompare(b.label))
  }, [filtered, groupBy])

  const SORT_OPTS: { key: SortBy; label: string }[] = [
    { key: 'created_at', label: 'Fecha creación' },
    { key: 'updated_at', label: 'Última edición' },
    { key: 'document', label: 'Lectura' },
    { key: 'page', label: 'Página' },
  ]
  const GROUP_OPTS: { key: GroupBy; label: string }[] = [
    { key: 'none', label: 'N/A' },
    { key: 'document', label: 'Lectura' },
    { key: 'author', label: 'Autor' },
    { key: 'tag', label: 'Etiqueta' },
    { key: 'folder', label: 'Carpeta' },
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {/* Left panel: folders + tag filter */}
      <div
        className="shrink-0 flex flex-col overflow-y-auto py-4 px-3 gap-4"
        style={{ width: 200, borderRight: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        {/* Back to library */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-xs"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <ArrowLeft size={13} />
          Librería
        </button>
        <div style={{ height: 1, background: 'var(--border)', margin: '-8px 0' }} />

        {/* Folders */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>Carpetas</span>
            <button
              onClick={() => setShowNewFolder((v) => !v)}
              className="p-0.5 rounded transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#534AB7' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
            >
              <FolderPlus size={13} />
            </button>
          </div>
          {showNewFolder && (
            <div className="flex items-center gap-1 mb-1">
              <input
                autoFocus
                className="flex-1 text-xs px-2 py-1 rounded-lg focus:outline-none"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Nombre…"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
              />
              <button onClick={handleCreateFolder} className="p-1 rounded text-white" style={{ background: '#534AB7' }}>
                <Check size={11} />
              </button>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer text-xs transition-colors mb-0.5"
            style={{ background: !activeFolderId ? 'var(--hover-bg-soft)' : 'transparent', color: !activeFolderId ? '#534AB7' : 'var(--text-primary)' }}
            onClick={() => setActiveFolderId(null)}
            onMouseEnter={(e) => { if (activeFolderId) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
            onMouseLeave={(e) => { if (activeFolderId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            Todas las notas
          </div>
          <FolderTree
            folders={folders}
            activeFolderId={activeFolderId}
            onSelect={setActiveFolderId}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolder}
          />
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-faint)' }}>Etiquetas</span>
            <div className="flex flex-col gap-0.5">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setFilterTagId((v) => v === tag.id ? null : tag.id)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs text-left transition-colors"
                  style={{
                    background: filterTagId === tag.id ? 'var(--hover-bg-soft)' : 'transparent',
                    color: filterTagId === tag.id ? '#534AB7' : 'var(--text-primary)',
                  }}
                  onMouseEnter={(e) => { if (filterTagId !== tag.id) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg-soft)' }}
                  onMouseLeave={(e) => { if (filterTagId !== tag.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color }} />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>Notas</span>
          <div className="flex items-center gap-2 flex-1 max-w-sm px-3 py-1.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <Search size={13} style={{ color: 'var(--text-faint)' }} />
            <input
              className="flex-1 text-xs bg-transparent focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Buscar en notas…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'var(--text-faint)' }}>
                <X size={11} />
              </button>
            )}
          </div>

          <Dropdown label="Ordenar" options={SORT_OPTS} value={sortBy} onChange={setSortBy} />
          <button
            onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            {sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          </button>
          <Dropdown label="Agrupar" options={GROUP_OPTS} value={groupBy} onChange={setGroupBy} />

          <span className="ml-auto text-xs" style={{ color: 'var(--text-faint)' }}>{filtered.length} nota{filtered.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setCreatingNote((v) => !v)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: creatingNote ? '#534AB7' : 'var(--text-muted)', border: '1px solid var(--border)' }}
            title="Crear nota"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Notes */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {filtered.length === 0 && !creatingNote ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No hay notas{search ? ' que coincidan' : ''}</p>
            </div>
          ) : grouped ? (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {creatingNote && (
                <NewNoteCard allTags={allTags} onCreate={handleCreate} onCancel={() => setCreatingNote(false)} />
              )}
              {grouped.map(({ label, notes: groupNotes }) => (
                <GroupSection
                  key={label}
                  label={label}
                  notes={groupNotes}
                  allTags={allTags}
                  allFolders={folders}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onFolderToggle={handleFolderToggle}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-3xl mx-auto">
              {creatingNote && (
                <NewNoteCard allTags={allTags} onCreate={handleCreate} onCancel={() => setCreatingNote(false)} />
              )}
              {filtered.map((note) => (
                <NoteCard key={note.id} note={note} allTags={allTags} allFolders={folders} onUpdate={handleUpdate} onDelete={handleDelete} onFolderToggle={handleFolderToggle} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
