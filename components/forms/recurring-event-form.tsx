"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RecurrenceBuilder } from "./recurrence-builder"
import type { RecurringEvent, RecurringEventFormData } from "@/lib/types/event"

const recurringEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  event_time: z.string().optional(),
  featured_image_url: z.string().optional(),
  rrule: z.string().min(1, "Recurrence rule is required"),
  dtstart: z.string().min(1, "Start date is required"),
  status: z.enum(["active", "paused"]).default("active"),
})

interface RecurringEventFormProps {
  event?: RecurringEvent
  onSubmit: (data: RecurringEventFormData) => Promise<void>
  loading?: boolean
}

export function RecurringEventForm({ event, onSubmit, loading }: RecurringEventFormProps) {
  const [rruleValue, setRruleValue] = useState(event?.rrule || "")

  const form = useForm<RecurringEventFormData>({
    resolver: zodResolver(recurringEventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      event_time: event?.event_time || "",
      featured_image_url: event?.featured_image_url || "",
      rrule: event?.rrule || "",
      dtstart: event?.dtstart || "",
      status: event?.status || "active",
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const handleRecurrenceChange = (rrule: string, dtstart: string) => {
    setRruleValue(rrule)
    setValue("rrule", rrule)
    setValue("dtstart", dtstart)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Enter event location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_time">Event Time</Label>
              <Input
                id="event_time"
                type="time"
                {...register("event_time")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="featured_image_url">Featured Image URL</Label>
              <Input
                id="featured_image_url"
                {...register("featured_image_url")}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <RecurrenceBuilder
        value={event?.rrule}
        dtstart={event?.dtstart}
        onChange={handleRecurrenceChange}
      />
      {errors.rrule && (
        <p className="text-xs text-destructive">{errors.rrule.message}</p>
      )}
      {errors.dtstart && (
        <p className="text-xs text-destructive">{errors.dtstart.message}</p>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {event ? "Save Changes" : "Create Recurring Event"}
        </Button>
      </div>
    </form>
  )
}

