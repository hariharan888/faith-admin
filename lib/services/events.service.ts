import { http } from "@/lib/http"
import type { Event, EventFormData, RecurringEvent, RecurringEventFormData } from "@/lib/types/event"

export const EventsService = {
  async getAll(page = 1, perPage = 20, filters?: { upcoming?: boolean; status?: string; search?: string }): Promise<{ events: Event[]; total_count: number; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })
    if (filters?.upcoming) params.append("upcoming", "true")
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    
    const response = await http.get(`/admin/events?${params.toString()}`)
    return {
      events: response.data.events || [],
      total_count: response.data.total_count || 0,
      pagination: response.data.pagination || {}
    }
  },

  async getById(id: number): Promise<Event> {
    const response = await http.get(`/admin/events/${id}`)
    return response.data.event
  },

  async create(data: EventFormData): Promise<Event> {
    const response = await http.post("/admin/events", { event: data })
    return response.data.event
  },

  async update(id: number, data: Partial<EventFormData>): Promise<Event> {
    const response = await http.patch(`/admin/events/${id}`, { event: data })
    return response.data.event
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/admin/events/${id}`)
  },

  async bulkDelete(ids: number[]): Promise<{ message: string; count: number }> {
    const response = await http.delete("/admin/events/bulk_destroy", {
      data: { ids }
    })
    return response.data
  },
}

export const RecurringEventsService = {
  async getAll(page = 1, perPage = 20, filters?: { status?: string; search?: string }): Promise<{ recurring_events: RecurringEvent[]; total_count: number; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    })
    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    
    const response = await http.get(`/admin/recurring_events?${params.toString()}`)
    return {
      recurring_events: response.data.recurring_events || [],
      total_count: response.data.total_count || 0,
      pagination: response.data.pagination || {}
    }
  },

  async getById(id: number): Promise<RecurringEvent> {
    const response = await http.get(`/admin/recurring_events/${id}`)
    return response.data.recurring_event
  },

  async create(data: RecurringEventFormData): Promise<RecurringEvent> {
    const response = await http.post("/admin/recurring_events", { recurring_event: data })
    return response.data.recurring_event
  },

  async update(id: number, data: Partial<RecurringEventFormData>): Promise<RecurringEvent> {
    const response = await http.patch(`/admin/recurring_events/${id}`, { recurring_event: data })
    return response.data.recurring_event
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/admin/recurring_events/${id}`)
  },

  async bulkDelete(ids: number[]): Promise<{ message: string; count: number }> {
    const response = await http.delete("/admin/recurring_events/bulk_destroy", {
      data: { ids }
    })
    return response.data
  },

  async generateEvents(id: number): Promise<{ count: number }> {
    const response = await http.post(`/admin/recurring_events/${id}/generate_events`)
    return response.data
  },
}

