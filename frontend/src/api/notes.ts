import client from './client'
import type { Note, NoteFolder } from '../types'

export const notesApi = {
  list: (params?: { document_id?: string; folder_id?: string }) =>
    client.get<Note[]>('/api/notes/', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get<Note>(`/api/notes/${id}`).then((r) => r.data),

  create: (data: { document_id?: string; page_number?: number; quote?: string; content?: string }) =>
    client.post<Note>('/api/notes/', data).then((r) => r.data),

  update: (id: string, data: { document_id?: string; page_number?: number; quote?: string; content?: string }) =>
    client.put<Note>(`/api/notes/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/notes/${id}`),

  addTag: (noteId: string, tagId: string) =>
    client.post<Note>(`/api/notes/${noteId}/tags/${tagId}`).then((r) => r.data),

  removeTag: (noteId: string, tagId: string) =>
    client.delete<Note>(`/api/notes/${noteId}/tags/${tagId}`).then((r) => r.data),

  addToFolder: (noteId: string, folderId: string) =>
    client.post<Note>(`/api/notes/${noteId}/folders/${folderId}`).then((r) => r.data),

  removeFromFolder: (noteId: string, folderId: string) =>
    client.delete<Note>(`/api/notes/${noteId}/folders/${folderId}`).then((r) => r.data),
}

export const noteFoldersApi = {
  list: () => client.get<NoteFolder[]>('/api/notes/folders/').then((r) => r.data),

  create: (data: { name: string; parent_id?: string }) =>
    client.post<NoteFolder>('/api/notes/folders/', data).then((r) => r.data),

  update: (id: string, data: { name?: string; parent_id?: string }) =>
    client.put<NoteFolder>(`/api/notes/folders/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/notes/folders/${id}`),
}
