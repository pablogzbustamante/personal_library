import client from './client'
import type { Tag } from '../types'

export const tagsApi = {
  list: () => client.get<Tag[]>('/api/tags/').then((r) => r.data),

  create: (data: { name: string; color?: string }) =>
    client.post<Tag>('/api/tags/', data).then((r) => r.data),

  update: (id: string, data: { name?: string; color?: string }) =>
    client.put<Tag>(`/api/tags/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/tags/${id}`),

  addToDocument: (document_id: string, tag_id: string) =>
    client.post(`/api/tags/documents/${document_id}/tags/${tag_id}`),

  removeFromDocument: (document_id: string, tag_id: string) =>
    client.delete(`/api/tags/documents/${document_id}/tags/${tag_id}`),
}
