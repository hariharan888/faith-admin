"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Edit, RefreshCw, Clock, MapPin, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { RecurringEventForm } from "@/components/forms/recurring-event-form"
import { StatusLabel } from "@/components/shared/status-label"
import { Separator } from "@/components/ui/separator"
import { RecurringEventsService } from "@/lib/services/events.service"
import type { RecurringEvent, RecurringEventFormData } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function RecurringEventDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = Number(searchParams.get("id"))
  const isEditing = searchParams.get("edit") === "true"
  
  const [event, setEvent] = useState<RecurringEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    } else {
      router.push("/events")
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const data = await RecurringEventsService.getById(eventId)
      setEvent(data)
    } catch (error) {
      console.error("Failed to fetch recurring event:", error)
      toast({
        title: "Error",
        description: "Failed to load recurring event details",
        variant: "destructive",
      })
      router.push("/events")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: RecurringEventFormData) => {
    try {
      setSaving(true)
      await RecurringEventsService.update(eventId, data)
      toast({
        title: "Success",
        description: "Recurring event updated successfully",
      })
      router.push(`/events/recurring/detail?id=${eventId}`)
    } catch (error) {
      console.error("Failed to update recurring event:", error)
      toast({
        title: "Error",
        description: "Failed to update recurring event",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateEvents = async () => {
    try {
      setGenerating(true)
      await RecurringEventsService.generateEvents(eventId)
      toast({
        title: "Success",
        description: "Events generated successfully",
      })
    } catch (error) {
      console.error("Failed to generate events:", error)
      toast({
        title: "Error",
        description: "Failed to generate events",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!event) {
    return null
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Recurring Event"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: event.title, href: `/events/recurring/detail?id=${event.id}` },
            { label: "Edit" },
          ]}
        />
        <RecurringEventForm event={event} onSubmit={handleUpdate} loading={saving} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: event.title },
        ]}
        actions={
          <>
            <Button 
              variant="outline" 
              onClick={handleGenerateEvents}
              disabled={generating}
            >
              {generating ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Generate Events
            </Button>
            <Button onClick={() => router.push(`/events/recurring/detail?id=${event.id}&edit=true`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recurrence</p>
                  <p className="font-medium text-sm">{formatRRule(event.rrule)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{event.event_time || "Not specified"}</p>
                </div>
              </div>
              
              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <StatusLabel status={event.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recurring Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {event.description ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided</p>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">RRULE</h4>
              <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                {event.rrule}
              </code>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">Record Info</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm">{new Date(event.dtstart).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function formatRRule(rrule: string): string {
  const parts = rrule.split(";")
  const freq = parts.find((p) => p.startsWith("FREQ="))?.split("=")[1]
  const interval = parts.find((p) => p.startsWith("INTERVAL="))?.split("=")[1] || "1"
  const byday = parts.find((p) => p.startsWith("BYDAY="))?.split("=")[1]
  
  let text = ""
  
  switch (freq) {
    case "DAILY":
      text = interval === "1" ? "Daily" : `Every ${interval} days`
      break
    case "WEEKLY":
      text = interval === "1" ? "Weekly" : `Every ${interval} weeks`
      if (byday) {
        const days: Record<string, string> = {
          MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun"
        }
        const dayNames = byday.split(",").map(d => days[d] || d).join(", ")
        text += ` on ${dayNames}`
      }
      break
    case "MONTHLY":
      text = interval === "1" ? "Monthly" : `Every ${interval} months`
      break
    case "YEARLY":
      text = interval === "1" ? "Yearly" : `Every ${interval} years`
      break
    default:
      text = rrule
  }
  
  return text
}

