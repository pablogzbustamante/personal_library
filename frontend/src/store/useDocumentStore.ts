import { create } from 'zustand'
import type { Document } from '../types'

interface DocumentState {
  currentDocument: Document | null
  currentPage: number
  totalPages: number
  setCurrentDocument: (doc: Document | null) => void
  setCurrentPage: (page: number) => void
  setTotalPages: (total: number) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocument: null,
  currentPage: 1,
  totalPages: 0,
  setCurrentDocument: (currentDocument) => set({
    currentDocument,
    currentPage: currentDocument?.last_page_read ?? 1,
    totalPages: 0,
  }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setTotalPages: (totalPages) => set({ totalPages }),
}))
