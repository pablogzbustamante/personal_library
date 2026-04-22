export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  cover_image_path: string | null
  created_at: string
  tags: Tag[]
}

export interface Document {
  id: string
  user_id: string
  title: string
  author: string | null
  subject: string | null
  publisher: string | null
  year: number | null
  reference: string | null
  filename: string
  file_size: number | null
  page_count: number | null
  last_page_read: number
  progress: number
  cover_image_path: string | null
  created_at: string
  updated_at: string | null
  tags: Tag[]
  folder_ids: string[]
}

export interface Author {
  id: string
  user_id: string
  name: string
  year: number | null
  cover_image_path: string | null
  created_at: string
  tags: Tag[]
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface Highlight {
  id: string
  document_id: string
  user_id: string
  page_number: number
  selected_text: string
  color: string
  position_data: Record<string, unknown> | null
  created_at: string
}

export interface Annotation {
  id: string
  document_id: string
  user_id: string
  page_number: number
  content: string
  highlight_id: string | null
  position_x: number | null
  position_y: number | null
  created_at: string
  updated_at: string | null
}

export interface Bookmark {
  id: string
  document_id: string
  user_id: string
  page_number: number
  label: string | null
  color: string | null
  tags: Tag[]
  created_at: string
}

export interface NoteFolder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  document_id: string | null
  page_number: number | null
  quote: string | null
  content: string
  tags: Tag[]
  folders: NoteFolder[]
  document: { id: string; title: string; author: string | null } | null
  created_at: string
  updated_at: string | null
}
