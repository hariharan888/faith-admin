"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Edit, Calendar, Clock, MapPin } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { EventForm } from "@/components/forms/event-form"
import { StatusLabel } from "@/components/shared/status-label"
import { Separator } from "@/components/ui/separator"
import { EventsService } from "@/lib/services/events.service"
import type { Event, EventFormData } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function EventDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = Number(searchParams.get("id"))
  const isEditing = searchParams.get("edit") === "true"
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
      const data = await EventsService.getById(eventId)
      setEvent(data)
    } catch (error) {
      console.error("Failed to fetch event:", error)
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      })
      router.push("/events")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: EventFormData) => {
    try {
      setSaving(true)
      await EventsService.update(eventId, data)
      toast({
        title: "Success",
        description: "Event updated successfully",
      })
      router.push(`/events/detail?id=${eventId}`)
    } catch (error) {
      console.error("Failed to update event:", error)
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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
          title="Edit Event"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Events", href: "/events" },
            { label: event.title, href: `/events/detail?id=${event.id}` },
            { label: "Edit" },
          ]}
        />
        <EventForm event={event} onSubmit={handleUpdate} loading={saving} />
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
          <Button onClick={() => router.push(`/events/detail?id=${event.id}&edit=true`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Event
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(event.event_date), "PPP")}</p>
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
            <CardTitle className="text-base">Event Details</CardTitle>
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

            {event.featured_image_url && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Featured Image</h4>
                  <img 
                    src={event.featured_image_url} 
                    alt={event.title}
                    className="rounded-lg max-h-64 object-cover"
                  />
                </div>
              </>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">Record Info</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{new Date(event.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{new Date(event.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

