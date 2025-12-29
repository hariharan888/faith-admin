import { http } from "@/lib/http"
import type { ChurchMember, ChurchMemberFormData } from "@/lib/types/member"

export const MembersService = {
  async getAll(): Promise<ChurchMember[]> {
    const response = await http.get("/admin/church_members")
    return response.data.church_members || []
  },

  async getById(id: number): Promise<ChurchMember> {
    const response = await http.get(`/admin/church_members/${id}`)
    return response.data.church_member
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
    const response = await http.post("/admin/church_members/import_csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  },
}

