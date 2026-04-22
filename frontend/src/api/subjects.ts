import client from './client'
import type { Subject } from '../types'

export const subjectsApi = {
  list: () => client.get<Subject[]>('/api/subjects/').then((r) => r.data),

  create: (name: string) =>
    client.post<Subject>('/api/subjects/', { name }).then((r) => r.data),

  updateCover: (id: string, cover: File) => {
    const form = new FormData()
    form.append('cover', cover)
    return client.post<Subject>(`/api/subjects/${id}/cover`, form).then((r) => r.data)
  },

  update: (id: string, data: { name?: string }) =>
    client.put<Subject>(`/api/subjects/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/subjects/${id}`),

  addTag: (subjectId: string, tagId: string) =>
    client.post<Subject>(`/api/subjects/${subjectId}/tags/${tagId}`).then((r) => r.data),

  removeTag: (subjectId: string, tagId: string) =>
    client.delete<Subject>(`/api/subjects/${subjectId}/tags/${tagId}`).then((r) => r.data),
}
