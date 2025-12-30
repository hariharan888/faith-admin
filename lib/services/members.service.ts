import { http } from "@/lib/http"
import type { ChurchMember, ChurchMemberFormData } from "@/lib/types/member"

export const MembersService = {
  async getAll(page = 1, perPage = 20, filters?: { gender?: string; marital_status?: string; spiritual_status?: string; search?: string }): Promise<{ church_members: ChurchMember[]; total_count: number; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })
    if (filters?.gender) params.append("gender", filters.gender)
    if (filters?.marital_status) params.append("marital_status", filters.marital_status)
    if (filters?.spiritual_status) params.append("spiritual_status", filters.spiritual_status)
    if (filters?.search) params.append("search", filters.search)
    
    const response = await http.get(`/admin/church_members?${params.toString()}`)
    return {
      church_members: response.data.church_members || [],
      total_count: response.data.total_count || 0,
      pagination: response.data.pagination || {}
    }
  },

  async getById(id: number): Promise<ChurchMember> {
    const response = await http.get(`/admin/church_members/${id}`)
    return response.data.church_member || response.data.member
  },

  async create(data: ChurchMemberFormData): Promise<ChurchMember> {
    const response = await http.post("/admin/church_members", { church_member: data })
    return response.data.church_member
  },

  async update(id: number, data: Partial<ChurchMemberFormData>): Promise<ChurchMember> {
    const response = await http.patch(`/admin/church_members/${id}`, { church_member: data })
    return response.data.church_member
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/admin/church_members/${id}`)
  },

  async importCSV(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await http.post("/admin/church_members/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },

  async export(): Promise<Response> {
    const response = await http.request({
      method: 'GET',
      url: "/admin/church_members/export",
      responseType: "blob",
    })
    return response as Response
  },
}

