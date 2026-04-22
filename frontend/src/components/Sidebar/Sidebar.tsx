import { useState, useRef, useEffect } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  BookOpen,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
  Users,
  BookMarked,
  Sun,
  Moon,
  StickyNote,
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Folder as FolderType, Document, Tag, Author } from '../../types'
import { useThemeStore } from '../../store/useThemeStore'

interface FolderNode extends FolderType {
  children: FolderNode[]
  docCount: number
}

function buildTree(folders: FolderType[], documents: Document[], parentId: string | null = null): FolderNode[] {
  return folders
    .filter((f) => f.parent_id === parentId)
    .map((f) => {
      const children = buildTree(folders, documents, f.id)
      const allIds = collectIds(f.id, folders)
      const docCount = documents.filter((d) => d.folder_ids.some((fid) => allIds.has(fid))).length
      return { ...f, children, docCount }
    })
}

function collectIds(folderId: string, folders: FolderType[]): Set<string> {
  const set = new Set<string>([folderId])
  folders.filter((f) => f.parent_id === folderId).forEach((child) => {
    collectIds(child.id, folders).forEach((id) => set.add(id))
  })
  return set
}

function ContextMenu({ x, y, onRename, onAddSub, onDelete, onClose }: {
  x: number; y: number
  onRename: () => void; onAddSub: () => void; onDelete: () => void; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed z-50 rounded-xl shadow-lg py-1 min-w-[150px]"
      style={{ top: y, left: x, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={() => { onRename(); onClose() }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-[#f0f0f4]" style={{ color: 'var(--text-primary)' }}>
        <Pencil size={11} style={{ color: 'var(--text-muted)' }} />Renombrar
      </button>
      <button onClick={() => { onAddSub(); onClose() }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] hover:bg-[#f0f0f4]" style={{ color: 'var(--text-primary)' }}>
        <FolderPlus size={11} style={{ color: 'var(--text-muted)' }} />Nueva subcarpeta
      </button>
      <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />
      <button onClick={() => { onDelete(); onClose() }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-red-500 hover:bg-red-50">
        <Trash2 size={11} />Eliminar
      </button>
    </div>
  )
}

function InlineInput({ defaultValue, onConfirm, onCancel }: {
  defaultValue: string; onConfirm: (val: string) => void; onCancel: () => void
}) {
  const [val, setVal] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])

  return (
    <input
      ref={inputRef}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && val.trim()) onConfirm(val.trim())
        if (e.key === 'Escape') onCancel()
        e.stopPropagation()
      }}
      onBlur={() => { if (val.trim()) onConfirm(val.trim()); else onCancel() }}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 min-w-0 text-[13px] rounded px-1 outline-none border border-[#534AB7]"
      style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
    />
  )
}

interface FolderItemProps {
  node: FolderNode; depth: number; activeFolderId: string | null
  onSelect: (id: string | null) => void; onRename: (id: string, name: string) => void
  onDelete: (id: string) => void; onCreateSub: (parentId: string, name: string) => void
}

function FolderItem({ node, depth, activeFolderId, onSelect, onRename, onDelete, onCreateSub }: FolderItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [creatingChild, setCreatingChild] = useState(false)
  const [newChildName, setNewChildName] = useState('')

  const isActive = activeFolderId === node.id
  const hasChildren = node.children.length > 0 || creatingChild

  return (
    <div>
      <div
        className="group flex items-center gap-0.5 py-[3px] rounded cursor-pointer select-none transition-colors relative"
        style={{
          paddingLeft: depth * 12 + 4, paddingRight: 4,
          background: isActive ? 'rgba(83,74,183,0.1)' : hovered ? 'var(--hover-bg)' : 'transparent',
          color: isActive ? '#534AB7' : 'var(--text-secondary)',
        }}
        onClick={() => !renaming && onSelect(isActive ? null : node.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY }) }}
      >
        <button
          className="w-4 h-4 flex items-center justify-center shrink-0"
          style={{ color: 'var(--text-faint)' }}
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded((v) => !v) }}
        >
          {hasChildren ? (expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />) : <span className="w-3" />}
        </button>
        {expanded || isActive ? <FolderOpen size={13} className="shrink-0 opacity-70" /> : <Folder size={13} className="shrink-0 opacity-50" />}
        {renaming ? (
          <InlineInput defaultValue={node.name} onConfirm={(name) => { onRename(node.id, name); setRenaming(false) }} onCancel={() => setRenaming(false)} />
        ) : (
          <span className="flex-1 truncate text-[13px] ml-1">{node.name}</span>
        )}
        {!renaming && node.docCount > 0 && !hovered && <span className="text-[10px] shrink-0" style={{ color: 'var(--text-faint)' }}>{node.docCount}</span>}
        {!renaming && hovered && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); setCreatingChild(true); setNewChildName('') }} className="p-0.5 rounded hover:bg-[#534AB7]/10 hover:text-[#534AB7]" style={{ color: 'var(--text-muted)' }} title="Nueva subcarpeta"><FolderPlus size={11} /></button>
            <button onClick={(e) => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: rect.left, y: rect.bottom + 2 }) }} className="p-0.5 rounded hover:bg-[#534AB7]/10 hover:text-[#534AB7]" style={{ color: 'var(--text-muted)' }}><MoreHorizontal size={11} /></button>
          </div>
        )}
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} onRename={() => setRenaming(true)} onAddSub={() => { setExpanded(true); setCreatingChild(true); setNewChildName('') }} onDelete={() => onDelete(node.id)} onClose={() => setMenu(null)} />}
      {(expanded || creatingChild) && (
        <div>
          {expanded && node.children.map((child) => (
            <FolderItem key={child.id} node={child} depth={depth + 1} activeFolderId={activeFolderId} onSelect={onSelect} onRename={onRename} onDelete={onDelete} onCreateSub={onCreateSub} />
          ))}
          {creatingChild && (
            <div className="flex items-center gap-1 py-[3px]" style={{ paddingLeft: (depth + 1) * 12 + 4 + 4 }}>
              <Folder size={13} className="shrink-0 opacity-50" style={{ color: 'var(--text-secondary)' } as React.CSSProperties} />
              <input
                autoFocus value={newChildName} onChange={(e) => setNewChildName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newChildName.trim()) { onCreateSub(node.id, newChildName.trim()); setCreatingChild(false) }
                  if (e.key === 'Escape') setCreatingChild(false)
                  e.stopPropagation()
                }}
                onBlur={() => setCreatingChild(false)}
                placeholder="Nombre…"
                className="flex-1 text-[13px] border border-[#534AB7] rounded px-1 outline-none min-w-0"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  folders: FolderType[]; documents: Document[]; tags: Tag[]; authors: Author[]
  activeFolderId: string | null; activeTagId: string | null
  onSelectFolder: (id: string | null) => void; onSelectTag: (id: string | null) => void
  onNewFolder: () => void; onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void; onCreateSubfolder: (parentId: string, name: string) => void
}

export default function Sidebar({ folders, documents, tags, authors, activeFolderId, activeTagId, onSelectFolder, onSelectTag, onNewFolder, onRenameFolder, onDeleteFolder, onCreateSubfolder }: SidebarProps) {
  const { dark, toggleDark } = useThemeStore()
  const navigate = useNavigate()
  const location = useLocation()
  const tree = buildTree(folders, documents)
  const [tagsExpanded, setTagsExpanded] = useState(true)
  const [foldersExpanded, setFoldersExpanded] = useState(true)
  const [creatingRoot, setCreatingRoot] = useState(false)
  const [rootName, setRootName] = useState('')

  const navItems = [
    { id: null, label: 'Libreria de la Luna', icon: BookOpen, count: documents.length },
  ]

  const authorCount = authors.length
  const subjectCount = new Set(documents.map((d) => d.subject).filter(Boolean)).size

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: 220, flexShrink: 0, background: 'var(--bg-elevated)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo + theme toggle */}
      <div className="flex items-center px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="flex-1 text-base font-bold tracking-tight text-[#534AB7]">MoonLibrary</span>
        <button
          onClick={toggleDark}
          className="p-1 rounded-md transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Static nav */}
        <div className="px-2 mb-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeFolderId === item.id && !activeTagId
            return (
              <div
                key={String(item.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-0.5"
                style={{
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? '#534AB7' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                onClick={() => { onSelectFolder(item.id); onSelectTag(null) }}
              >
                <Icon size={13} className="shrink-0 opacity-60" />
                <span className="flex-1 text-[13px]">{item.label}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{item.count}</span>
              </div>
            )
          })}
          {(() => {
            const isActive = activeFolderId === 'authors' && !activeTagId
            return (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-0.5"
                style={{
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? '#534AB7' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                onClick={() => { onSelectFolder('authors'); onSelectTag(null) }}
              >
                <Users size={13} className="shrink-0 opacity-60" />
                <span className="flex-1 text-[13px]">Autores</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{authorCount}</span>
              </div>
            )
          })()}
          {(() => {
            const isActive = activeFolderId === 'subjects' && !activeTagId
            return (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-0.5"
                style={{
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? '#534AB7' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                onClick={() => { onSelectFolder('subjects'); onSelectTag(null) }}
              >
                <BookMarked size={13} className="shrink-0 opacity-60" />
                <span className="flex-1 text-[13px]">Materias</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{subjectCount}</span>
              </div>
            )
          })()}
          {(() => {
            const isActive = location.pathname === '/notes'
            return (
              <div
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors mb-0.5"
                style={{
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? '#534AB7' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                onClick={() => navigate('/notes')}
              >
                <StickyNote size={13} className="shrink-0 opacity-60" />
                <span className="flex-1 text-[13px]">Notas</span>
              </div>
            )
          })()}
        </div>

        {/* Folders section */}
        <div className="px-2">
          <button
            className="flex items-center gap-1 w-full px-1 py-1 text-[10px] uppercase tracking-widest font-medium transition-colors group"
            style={{ color: 'var(--text-faint)' }}
            onClick={() => setFoldersExpanded((v) => !v)}
          >
            {foldersExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            <span className="flex-1 text-left">Carpetas</span>
            <button
              onClick={(e) => { e.stopPropagation(); onNewFolder() }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#534AB7]/10 hover:text-[#534AB7] transition-all"
            >
              <Plus size={11} />
            </button>
          </button>

          {foldersExpanded && (
            <div className="mt-0.5">
              {tree.map((node) => (
                <FolderItem key={node.id} node={node} depth={0} activeFolderId={activeFolderId}
                  onSelect={(id) => { onSelectFolder(id); onSelectTag(null) }}
                  onRename={onRenameFolder} onDelete={onDeleteFolder} onCreateSub={onCreateSubfolder}
                />
              ))}
              {creatingRoot ? (
                <div className="flex items-center gap-1 py-[3px] px-1">
                  <span className="w-4" />
                  <Folder size={13} className="shrink-0 opacity-50" style={{ color: 'var(--text-secondary)' } as React.CSSProperties} />
                  <input
                    autoFocus value={rootName} onChange={(e) => setRootName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && rootName.trim()) { onNewFolder(); setCreatingRoot(false) }
                      if (e.key === 'Escape') setCreatingRoot(false)
                    }}
                    onBlur={() => setCreatingRoot(false)}
                    placeholder="Nombre…"
                    className="flex-1 text-[13px] border border-[#534AB7] rounded px-1 outline-none min-w-0"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  />
                </div>
              ) : (
                tree.length === 0 && <p className="text-[11px] px-3 py-1" style={{ color: 'var(--text-faint)' }}>Sin carpetas</p>
              )}
            </div>
          )}
        </div>

        {/* Tags section */}
        {tags.length > 0 && (
          <div className="px-2 mt-2">
            <button
              className="flex items-center gap-1 w-full px-1 py-1 text-[10px] uppercase tracking-widest font-medium transition-colors"
              style={{ color: 'var(--text-faint)' }}
              onClick={() => setTagsExpanded((v) => !v)}
            >
              {tagsExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              <span>Etiquetas</span>
            </button>
            {tagsExpanded && (
              <div className="mt-0.5">
                {tags.map((tag) => {
                  const isActive = activeTagId === tag.id
                  const count = documents.filter((d) => d.tags.some((t) => t.id === tag.id)).length
                  return (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 px-2 py-[5px] rounded cursor-pointer transition-colors"
                      style={{ background: isActive ? 'var(--bg-surface)' : 'transparent' }}
                      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      onClick={() => { onSelectTag(isActive ? null : tag.id); onSelectFolder(null) }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      <span className="flex-1 text-[13px] truncate" style={{ color: isActive ? tag.color : 'var(--text-secondary)' }}>{tag.name}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </aside>
  )
}
