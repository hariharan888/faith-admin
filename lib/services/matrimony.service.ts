import { http } from "@/lib/http"
import type { MatrimonyProfile } from "@/lib/types/matrimony"

export const MatrimonyService = {
  async getAll(): Promise<MatrimonyProfile[]> {
    const response = await http.get("/matrimony/admins/profiles")
    return response.data.profiles || []
  },

  async getById(id: number): Promise<MatrimonyProfile> {
    const response = await http.get(`/matrimony/admins/profiles/${id}`)
    return response.data.profile
  },

  async approve(id: number): Promise<MatrimonyProfile> {
    const response = await http.post(`/matrimony/admins/profiles/${id}/approve`)
    return response.data.profile
  },

  async reject(id: number, reason: string): Promise<MatrimonyProfile> {
    const response = await http.post(`/matrimony/admins/profiles/${id}/reject`, {
      rejection_reason: reason,
    })
    return response.data.profile
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/matrimony/admins/profiles/${id}`)
  },
}

