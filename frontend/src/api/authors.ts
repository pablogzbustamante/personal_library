import client from './client'
import type { Author } from '../types'

export const authorsApi = {
  list: () => client.get<Author[]>('/api/authors/').then((r) => r.data),

  create: (name: string, year?: number) =>
    client.post<Author>('/api/authors/', { name, year }).then((r) => r.data),

  updateCover: (id: string, cover: File) => {
    const form = new FormData()
    form.append('cover', cover)
    return client.post<Author>(`/api/authors/${id}/cover`, form).then((r) => r.data)
  },

  update: (id: string, data: { name?: string; year?: number | null }) =>
    client.put<Author>(`/api/authors/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/authors/${id}`),

  addTag: (authorId: string, tagId: string) =>
    client.post<Author>(`/api/authors/${authorId}/tags/${tagId}`).then((r) => r.data),

  removeTag: (authorId: string, tagId: string) =>
    client.delete<Author>(`/api/authors/${authorId}/tags/${tagId}`).then((r) => r.data),
}
