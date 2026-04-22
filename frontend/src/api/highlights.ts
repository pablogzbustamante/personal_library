import client from './client'
import type { Highlight } from '../types'

interface HighlightCreate {
  document_id: string
  page_number: number
  selected_text: string
  color?: string
  position_data?: Record<string, unknown>
}

export const highlightsApi = {
  list: (document_id: string) =>
    client
      .get<Highlight[]>('/api/highlights/', { params: { document_id } })
      .then((r) => r.data),

  create: (data: HighlightCreate) =>
    client.post<Highlight>('/api/highlights/', data).then((r) => r.data),

  update: (id: string, data: { color?: string; position_data?: Record<string, unknown> }) =>
    client.put<Highlight>(`/api/highlights/${id}`, data).then((r) => r.data),

  delete: (id: string) => client.delete(`/api/highlights/${id}`),
}
