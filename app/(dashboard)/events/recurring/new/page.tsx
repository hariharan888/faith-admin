"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { RecurrenceBuilder } from "@/components/forms/recurrence-builder"
import { RecurringEventsService } from "@/lib/services/events.service"
import { toast } from "@/hooks/use-toast"

const recurringEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  event_time: z.string().optional(),
  rrule: z.string().min(1, "Recurrence rule is required"),
  dtstart: z.string().min(1, "Start date is required"),
})

type RecurringEventFormData = z.infer<typeof recurringEventSchema>

export default function NewRecurringEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<RecurringEventFormData>({
    resolver: zodResolver(recurringEventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      event_time: "",
      rrule: "",
      dtstart: new Date().toISOString(),
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const handleRRuleChange = useCallback((rrule: string, dtstart: string) => {
    setValue("rrule", rrule)
    setValue("dtstart", dtstart)
  }, [setValue])

  const onSubmit = async (data: RecurringEventFormData) => {
    try {
      setLoading(true)
      await RecurringEventsService.create(data)
      toast({
        title: "Success",
        description: "Recurring event created successfully",
      })
      router.push("/events?tab=recurring")
    } catch (error) {
      console.error("Failed to create recurring event:", error)
      toast({
        title: "Error",
        description: "Failed to create recurring event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Recurring Event"
        description="Set up an event that repeats on a schedule"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "New Recurring" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="e.g., Sunday Service"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="e.g., Main Church Hall"
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
            </CardContent>
          </Card>

          {/* Recurrence Builder */}
          <RecurrenceBuilder
            value={form.watch("rrule")}
            dtstart={form.watch("dtstart")}
            onChange={handleRRuleChange}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/events")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && (
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            Create Recurring Event
          </Button>
        </div>
      </form>
    </div>
  )
}

