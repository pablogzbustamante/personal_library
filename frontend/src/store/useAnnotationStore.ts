import { create } from 'zustand'
import type { Annotation, Highlight, Bookmark } from '../types'
import { annotationsApi } from '../api/annotations'
import { highlightsApi } from '../api/highlights'
import { bookmarksApi } from '../api/bookmarks'

interface AnnotationState {
  annotations: Annotation[]
  highlights: Highlight[]
  bookmarks: Bookmark[]
  loading: boolean

  loadForDocument: (documentId: string) => Promise<void>
  addHighlight: (data: {
    document_id: string
    page_number: number
    selected_text: string
    color?: string
    position_data?: Record<string, unknown>
  }) => Promise<Highlight>
  deleteHighlight: (id: string) => Promise<void>
  addAnnotation: (data: {
    document_id: string
    page_number: number
    content: string
    highlight_id?: string
    position_x?: number
    position_y?: number
  }) => Promise<Annotation>
  deleteAnnotation: (id: string) => Promise<void>
  addBookmark: (data: { document_id: string; page_number: number; label?: string }) => Promise<void>
  deleteBookmark: (id: string) => Promise<void>
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  annotations: [],
  highlights: [],
  bookmarks: [],
  loading: false,

  loadForDocument: async (documentId) => {
    set({ loading: true })
    try {
      const [annotations, highlights, bookmarks] = await Promise.all([
        annotationsApi.list(documentId),
        highlightsApi.list(documentId),
        bookmarksApi.list(documentId),
      ])
      set({ annotations, highlights, bookmarks })
    } finally {
      set({ loading: false })
    }
  },

  addHighlight: async (data) => {
    const h = await highlightsApi.create(data)
    set((s) => ({ highlights: [...s.highlights, h] }))
    return h
  },

  deleteHighlight: async (id) => {
    await highlightsApi.delete(id)
    set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) }))
  },

  addAnnotation: async (data) => {
    const a = await annotationsApi.create(data)
    set((s) => ({ annotations: [...s.annotations, a] }))
    return a
  },

  deleteAnnotation: async (id) => {
    await annotationsApi.delete(id)
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) }))
  },

  addBookmark: async (data) => {
    const b = await bookmarksApi.create(data)
    set((s) => ({ bookmarks: [...s.bookmarks, b] }))
  },

  deleteBookmark: async (id) => {
    await bookmarksApi.delete(id)
    set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }))
  },
}))
