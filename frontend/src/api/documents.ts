import client from './client'
import type { Document } from '../types'

export const documentsApi = {
  list: () =>
    client.get<Document[]>('/api/documents/').then((r) => r.data),

  get: (id: string) =>
    client.get<Document>(`/api/documents/${id}`).then((r) => r.data),

  upload: (title: string, file: File, author?: string, cover?: File, publisher?: string, year?: number, reference?: string, subject?: string) => {
    const form = new FormData()
    form.append('title', title)
    form.append('file', file)
    if (author) form.append('author', author)
    if (cover) form.append('cover', cover)
    if (publisher) form.append('publisher', publisher)
    if (year != null) form.append('year', String(year))
    if (reference) form.append('reference', reference)
    if (subject) form.append('subject', subject)
    return client.post<Document>('/api/documents/', form).then((r) => r.data)
  },

  update: (
    id: string,
    data: { title?: string; author?: string; subject?: string | null; publisher?: string; year?: number | null; reference?: string | null; last_page_read?: number; progress?: number },
  ) => client.put<Document>(`/api/documents/${id}`, data).then((r) => r.data),

  updateCover: (id: string, cover: File) => {
    const form = new FormData()
    form.append('cover', cover)
    return client.post<Document>(`/api/documents/${id}/cover`, form).then((r) => r.data)
  },

  delete: (id: string) => client.delete(`/api/documents/${id}`),

  fileUrl: (id: string) => `/api/documents/${id}/file`,
}
