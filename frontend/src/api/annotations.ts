import client from './client'
import type { Annotation } from '../types'

interface AnnotationCreate {
  document_id: string
  page_number: number
  content: string
  highlight_id?: string
  position_x?: number
  position_y?: number
}

export const annotationsApi = {
  list: (document_id: string) =>
    client
      .get<Annotation[]>('/api/annotations/', { params: { document_id } })
      .then((r) => r.data),

  create: (data: AnnotationCreate) =>
    client.post<Annotation>('/api/annotations/', data).then((r) => r.data),

  update: (id: string, data: { content?: string; position_x?: number; position_y?: number }) =>
    client.put<Annotation>(`/api/annotations/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/annotations/${id}`),
}
