import { http } from "@/lib/http"
import type { Post, PostFormData } from "@/lib/types/post"

export const PostsService = {
  async getAll(page = 1, perPage = 20, filters?: { status?: string; search?: string }): Promise<{ posts: Post[]; total_count: number; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    
    const response = await http.get(`/admin/posts?${params.toString()}`)
    return {
      posts: response.data.posts || [],
      total_count: response.data.total_count || 0,
      pagination: response.data.pagination || {}
    }
  },

  async getById(id: number): Promise<Post> {
    const response = await http.get(`/admin/posts/${id}`)
    return response.data.post
  },

  async create(data: PostFormData): Promise<Post> {
    const response = await http.post("/admin/posts", { post: data })
    return response.data.post
  },

  async update(id: number, data: Partial<PostFormData>): Promise<Post> {
    const response = await http.patch(`/admin/posts/${id}`, { post: data })
    return response.data.post
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/admin/posts/${id}`)
  },

  async bulkDelete(ids: number[]): Promise<{ message: string; count: number }> {
    const response = await http.delete("/admin/posts/bulk_destroy", {
      data: { ids }
    })
    return response.data
  },
}

