import { http } from "@/lib/http"
import type { Post, PostFormData } from "@/lib/types/post"

export const PostsService = {
  async getAll(): Promise<Post[]> {
    const response = await http.get("/admin/posts")
    return response.data.posts || []
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
}

