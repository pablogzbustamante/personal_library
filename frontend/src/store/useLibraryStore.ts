import { create } from 'zustand'
import type { Document, Folder, Tag, Author, Subject } from '../types'
import { documentsApi } from '../api/documents'
import { foldersApi } from '../api/folders'
import { tagsApi } from '../api/tags'
import { authorsApi } from '../api/authors'
import { subjectsApi } from '../api/subjects'

export type ViewMode = 'grid' | 'list'
export type SortBy = 'none' | 'title' | 'author' | 'subject' | 'publisher' | 'year' | 'progress' | 'pages'
export type SortDir = 'asc' | 'desc'
export type GroupBy = 'none' | 'author' | 'subject' | 'tag' | 'year'

interface LibraryState {
  documents: Document[]
  folders: Folder[]
  tags: Tag[]
  authors: Author[]
  subjects: Subject[]
  viewMode: ViewMode
  sortBy: SortBy
  sortDir: SortDir
  groupBy: GroupBy
  groupBy2: GroupBy
  authorSearch: string
  tagSearch: string
  activeFolderId: string | null
  activeTagId: string | null
  searchQuery: string
  loading: boolean
  error: string | null

  fetchAll: () => Promise<void>
  setViewMode: (mode: ViewMode) => void
  setSortBy: (sort: SortBy) => void
  setSortDir: (dir: SortDir) => void
  setGroupBy: (g: GroupBy) => void
  setGroupBy2: (g: GroupBy) => void
  setAuthorSearch: (q: string) => void
  setTagSearch: (q: string) => void
  createAuthor: (name: string, cover?: File, year?: number) => Promise<Author>
  updateAuthor: (id: string, name: string, cover?: File, year?: number | null) => Promise<void>
  deleteAuthor: (id: string) => Promise<void>
  addTagToAuthor: (authorId: string, tagId: string) => Promise<void>
  removeTagFromAuthor: (authorId: string, tagId: string) => Promise<void>
  createSubject: (name: string, cover?: File) => Promise<Subject>
  updateSubject: (id: string, name: string, cover?: File) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
  addTagToSubject: (subjectId: string, tagId: string) => Promise<void>
  removeTagFromSubject: (subjectId: string, tagId: string) => Promise<void>
  setActiveFolderId: (id: string | null) => void
  setActiveTagId: (id: string | null) => void
  setSearchQuery: (q: string) => void
  uploadDocument: (title: string, file: File, author?: string, cover?: File, publisher?: string, year?: number, reference?: string, subject?: string) => Promise<{ id: string }>
  updateDocument: (id: string, data: { title?: string; author?: string; subject?: string | null; publisher?: string; year?: number | null; reference?: string | null }) => Promise<void>
  updateCover: (id: string, cover: File) => Promise<void>
  deleteDocument: (id: string) => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  renameFolder: (id: string, name: string) => Promise<void>
  addDocumentToFolder: (folderId: string, docId: string) => Promise<void>
  removeDocumentFromFolder: (folderId: string, docId: string) => Promise<void>
  createTag: (name: string, color: string) => Promise<void>
  deleteTag: (id: string) => Promise<void>
  addTagToDocument: (docId: string, tagId: string) => Promise<void>
  removeTagFromDocument: (docId: string, tagId: string) => Promise<void>
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  documents: [],
  folders: [],
  tags: [],
  authors: [],
  subjects: [],
  viewMode: 'grid',
  sortBy: 'none',
  sortDir: 'desc',
  groupBy: 'none',
  groupBy2: 'none',
  authorSearch: '',
  tagSearch: '',
  activeFolderId: null,
  activeTagId: null,
  searchQuery: '',
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [documents, folders, tags, authors, subjects] = await Promise.all([
        documentsApi.list(),
        foldersApi.list(),
        tagsApi.list(),
        authorsApi.list(),
        subjectsApi.list(),
      ])
      set({ documents, folders, tags, authors, subjects })
    } catch {
      set({ error: 'Error al cargar la biblioteca' })
    } finally {
      set({ loading: false })
    }
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortDir: (sortDir) => set({ sortDir }),
  setGroupBy: (groupBy) => set({ groupBy, groupBy2: 'none' }),
  setGroupBy2: (groupBy2) => set({ groupBy2 }),
  setAuthorSearch: (authorSearch) => set({ authorSearch }),
  setTagSearch: (tagSearch) => set({ tagSearch }),
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),
  setActiveTagId: (id) =>
    set((s) => ({ activeTagId: s.activeTagId === id ? null : id })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  createAuthor: async (name, cover, year) => {
    let author = await authorsApi.create(name, year)
    if (cover) author = await authorsApi.updateCover(author.id, cover)
    set((s) => ({ authors: [...s.authors, author] }))
    return author
  },

  updateAuthor: async (id, name, cover, year) => {
    let updated = await authorsApi.update(id, { name, year })
    if (cover) updated = await authorsApi.updateCover(id, cover)
    set((s) => ({ authors: s.authors.map((a) => (a.id === id ? updated : a)) }))
  },

  deleteAuthor: async (id) => {
    await authorsApi.delete(id)
    set((s) => ({ authors: s.authors.filter((a) => a.id !== id) }))
  },

  addTagToAuthor: async (authorId, tagId) => {
    const updated = await authorsApi.addTag(authorId, tagId)
    set((s) => ({ authors: s.authors.map((a) => (a.id === authorId ? updated : a)) }))
  },

  removeTagFromAuthor: async (authorId, tagId) => {
    const updated = await authorsApi.removeTag(authorId, tagId)
    set((s) => ({ authors: s.authors.map((a) => (a.id === authorId ? updated : a)) }))
  },

  createSubject: async (name, cover) => {
    let subject = await subjectsApi.create(name)
    if (cover) subject = await subjectsApi.updateCover(subject.id, cover)
    set((s) => ({ subjects: [...s.subjects, subject] }))
    return subject
  },

  updateSubject: async (id, name, cover) => {
    let updated = await subjectsApi.update(id, { name })
    if (cover) updated = await subjectsApi.updateCover(id, cover)
    set((s) => ({ subjects: s.subjects.map((s2) => (s2.id === id ? updated : s2)) }))
  },

  deleteSubject: async (id) => {
    await subjectsApi.delete(id)
    set((s) => ({ subjects: s.subjects.filter((s2) => s2.id !== id) }))
  },

  addTagToSubject: async (subjectId, tagId) => {
    const updated = await subjectsApi.addTag(subjectId, tagId)
    set((s) => ({ subjects: s.subjects.map((s2) => (s2.id === subjectId ? updated : s2)) }))
  },

  removeTagFromSubject: async (subjectId, tagId) => {
    const updated = await subjectsApi.removeTag(subjectId, tagId)
    set((s) => ({ subjects: s.subjects.map((s2) => (s2.id === subjectId ? updated : s2)) }))
  },

  uploadDocument: async (title, file, author, cover, publisher, year, reference, subject) => {
    const doc = await documentsApi.upload(title, file, author, cover, publisher, year, reference, subject)
    set((s) => ({ documents: [doc, ...s.documents] }))
    return { id: doc.id }
  },

  updateDocument: async (id, data) => {
    const updated = await documentsApi.update(id, data)
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, ...updated } : d)),
    }))
  },

  updateCover: async (id, cover) => {
    const updated = await documentsApi.updateCover(id, cover)
    set((s) => ({
      documents: s.documents.map((d) => (d.id === id ? { ...d, ...updated } : d)),
    }))
  },

  deleteDocument: async (id) => {
    await documentsApi.delete(id)
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }))
  },

  createFolder: async (name, parentId) => {
    const folder = await foldersApi.create({ name, parent_id: parentId })
    set((s) => ({ folders: [...s.folders, folder] }))
  },

  deleteFolder: async (id) => {
    await foldersApi.delete(id)
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }))
  },

  renameFolder: async (id, name) => {
    const updated = await foldersApi.update(id, { name })
    set((s) => ({ folders: s.folders.map((f) => (f.id === id ? updated : f)) }))
  },

  addDocumentToFolder: async (folderId, docId) => {
    await foldersApi.addDocument(folderId, docId)
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId && !d.folder_ids.includes(folderId)
          ? { ...d, folder_ids: [...d.folder_ids, folderId] }
          : d
      ),
    }))
  },

  removeDocumentFromFolder: async (folderId, docId) => {
    await foldersApi.removeDocument(folderId, docId)
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId
          ? { ...d, folder_ids: d.folder_ids.filter((id) => id !== folderId) }
          : d
      ),
    }))
  },

  createTag: async (name, color) => {
    const tag = await tagsApi.create({ name, color })
    set((s) => ({ tags: [...s.tags, tag] }))
  },

  deleteTag: async (id) => {
    await tagsApi.delete(id)
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      documents: s.documents.map((d) => ({
        ...d,
        tags: d.tags.filter((t) => t.id !== id),
      })),
    }))
  },

  addTagToDocument: async (docId, tagId) => {
    await tagsApi.addToDocument(docId, tagId)
    const { tags } = get()
    const tag = tags.find((t) => t.id === tagId)
    if (!tag) return
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId && !d.tags.find((t) => t.id === tagId)
          ? { ...d, tags: [...d.tags, tag] }
          : d,
      ),
    }))
  },

  removeTagFromDocument: async (docId, tagId) => {
    await tagsApi.removeFromDocument(docId, tagId)
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId ? { ...d, tags: d.tags.filter((t) => t.id !== tagId) } : d,
      ),
    }))
  },

  // Derived: call this as a selector in components
  // getFilteredDocuments is a method so it always reads fresh state
}))

// Selector — filtered + sorted documents
export function selectFilteredDocuments(state: LibraryState): Document[] {
  let docs = state.documents

  // Filter by folder
  if (state.activeFolderId && state.activeFolderId !== 'authors' && state.activeFolderId !== 'subjects') {
    docs = docs.filter((d) => d.folder_ids.includes(state.activeFolderId!))
  }

  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase()
    docs = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.author?.toLowerCase().includes(q) ?? false),
    )
  }

  if (state.activeTagId) {
    docs = docs.filter((d) => d.tags.some((t) => t.id === state.activeTagId))
  }

  const asc = state.sortDir === 'asc'
  const sorted = [...docs]

  switch (state.sortBy) {
    case 'title':
      sorted.sort((a, b) => {
        const v = a.title.localeCompare(b.title)
        return asc ? v : -v
      })
      break
    case 'author': {
      const primaryAuthor = (full: string | null): string | null =>
        full?.split('; ')[0]?.trim() || null
      const authorSortKey = (name: string | null): string => {
        if (!name) return ''
        const parts = name.trim().split(/\s+/)
        // Sort by last name when multiple words; otherwise by the only word
        return parts.length > 1 ? parts[parts.length - 1] : parts[0]
      }
      sorted.sort((a, b) => {
        const v = authorSortKey(primaryAuthor(a.author)).localeCompare(authorSortKey(primaryAuthor(b.author)))
        return asc ? v : -v
      })
      break
    }
    case 'subject':
      sorted.sort((a, b) => {
        const v = (a.subject ?? '').localeCompare(b.subject ?? '')
        return asc ? v : -v
      })
      break
    case 'publisher':
      sorted.sort((a, b) => {
        const v = (a.publisher ?? '').localeCompare(b.publisher ?? '')
        return asc ? v : -v
      })
      break
    case 'year':
      sorted.sort((a, b) => {
        const v = (a.year ?? 0) - (b.year ?? 0)
        return asc ? v : -v
      })
      break
    case 'progress':
      sorted.sort((a, b) => asc ? a.progress - b.progress : b.progress - a.progress)
      break
    case 'pages':
      sorted.sort((a, b) => {
        const v = (a.page_count ?? 0) - (b.page_count ?? 0)
        return asc ? v : -v
      })
      break
    case 'none':
    default:
      sorted.sort((a, b) => {
        const v = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return asc ? v : -v
      })
  }

  return sorted
}

// Selector — total pages across filtered docs
export function selectTotalPages(state: LibraryState): number {
  return selectFilteredDocuments(state).reduce((sum, d) => sum + (d.page_count ?? 0), 0)
}
