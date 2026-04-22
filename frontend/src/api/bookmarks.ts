import client from './client'
import type { Bookmark } from '../types'

export const bookmarksApi = {
  list: (document_id: string) =>
    client
      .get<Bookmark[]>('/api/bookmarks/', { params: { document_id } })
      .then((r) => r.data),

  create: (data: { document_id: string; page_number: number; label?: string; color?: string }) =>
    client.post<Bookmark>('/api/bookmarks/', data).then((r) => r.data),

  update: (id: string, data: { label?: string; color?: string }) =>
    client.put<Bookmark>(`/api/bookmarks/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/bookmarks/${id}`),

  addTag: (bookmarkId: string, tagId: string) =>
    client.post<Bookmark>(`/api/bookmarks/${bookmarkId}/tags/${tagId}`).then((r) => r.data),

  removeTag: (bookmarkId: string, tagId: string) =>
    client.delete<Bookmark>(`/api/bookmarks/${bookmarkId}/tags/${tagId}`).then((r) => r.data),
}
