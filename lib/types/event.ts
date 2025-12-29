export interface Event {
  id: number
  title: string
  description?: string
  location?: string
  event_date: string
  event_time?: string
  featured_image_url?: string
  status: "upcoming" | "completed" | "cancelled"
  source_recurring_event_id?: number
  created_at: string
  updated_at: string
}

export interface RecurringEvent {
  id: number
  title: string
  description?: string
  location?: string
  event_time?: string
  featured_image_url?: string
  rrule: string
  dtstart: string
  status: "active" | "paused" | "cancelled"
  created_at: string
  updated_at: string
}

export interface EventFormData {
  title: string
  description?: string
  location?: string
  event_date: string
  event_time?: string
  featured_image_url?: string
}

export interface RecurringEventFormData {
  title: string
  description?: string
  location?: string
  event_time?: string
  featured_image_url?: string
  rrule: string
  dtstart: string
}

export type Frequency = "daily" | "weekly" | "monthly" | "yearly"

export interface RRuleOptions {
  frequency: Frequency
  interval: number
  byweekday?: number[]  // 0 = Monday, 6 = Sunday
  bymonthday?: number
  count?: number
  until?: string
}

