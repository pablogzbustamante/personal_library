import client from './client'
import type { Folder } from '../types'

export const foldersApi = {
  list: () => client.get<Folder[]>('/api/folders/').then((r) => r.data),

  create: (data: { name: string; parent_id?: string }) =>
    client.post<Folder>('/api/folders/', data).then((r) => r.data),

  update: (id: string, data: { name?: string; parent_id?: string }) =>
    client.put<Folder>(`/api/folders/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/folders/${id}`),

  addDocument: (folder_id: string, document_id: string) =>
    client.post(`/api/folders/${folder_id}/documents/${document_id}`),

  removeDocument: (folder_id: string, document_id: string) =>
    client.delete(`/api/folders/${folder_id}/documents/${document_id}`),
}
