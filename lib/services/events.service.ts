import { http } from "@/lib/http"
import type { Event, EventFormData, RecurringEvent, RecurringEventFormData } from "@/lib/types/event"

export const EventsService = {
  async getAll(upcoming?: boolean): Promise<Event[]> {
    const params = upcoming ? "?upcoming=true" : ""
    const response = await http.get(`/admin/events${params}`)
    return response.data.events || []
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
}

export const RecurringEventsService = {
  async getAll(): Promise<RecurringEvent[]> {
    const response = await http.get("/admin/recurring_events")
    return response.data.recurring_events || []
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

  async generateEvents(id: number): Promise<{ count: number }> {
    const response = await http.post(`/admin/recurring_events/${id}/generate_events`)
    return response.data
  },
}

