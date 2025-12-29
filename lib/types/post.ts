export interface Post {
  id: number
  title: string
  description?: string
  content?: string
  featured_image_url?: string
  status: "draft" | "published" | "archived"
  published_at?: string
  created_at: string
  updated_at: string
}

export interface PostFormData {
  title: string
  description?: string
  content?: string
  featured_image_url?: string
  status: string
}

