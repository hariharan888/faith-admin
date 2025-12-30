import { http } from "@/lib/http"
import type { MatrimonyProfile } from "@/lib/types/matrimony"

export const MatrimonyService = {
  async getAll(page = 1, perPage = 20, filters?: { status?: string; visibility?: string; search?: string }): Promise<{ profiles: MatrimonyProfile[]; total_count: number; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })
    if (filters?.status) params.append("status", filters.status)
    if (filters?.visibility) params.append("visibility", filters.visibility)
    if (filters?.search) params.append("search", filters.search)
    
    const response = await http.get(`/admin/matrimony/profiles?${params.toString()}`)
    return {
      profiles: response.data.profiles || [],
      total_count: response.data.total_count || 0,
      pagination: response.data.pagination || {}
    }
  },

  async getById(id: number): Promise<MatrimonyProfile> {
    const response = await http.get(`/admin/matrimony/profiles/${id}`)
    return response.data.profile
  },

  async approve(id: number): Promise<MatrimonyProfile> {
    const response = await http.patch(`/admin/matrimony/profiles/${id}/approve`)
    return response.data.profile
  },

  async reject(id: number, reason: string): Promise<MatrimonyProfile> {
    const response = await http.patch(`/admin/matrimony/profiles/${id}/reject`, {
      reason: reason,
    })
    return response.data.profile
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/admin/matrimony/profiles/${id}`)
  },

  async export(): Promise<Response> {
    const response = await http.request({
      method: 'GET',
      url: "/admin/matrimony/profiles/export",
      responseType: "blob",
    })
    return response as Response
  },
}

