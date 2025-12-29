"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { EventForm } from "@/components/forms/event-form"
import { EventsService } from "@/lib/services/events.service"
import type { EventFormData } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: EventFormData) => {
    try {
      setLoading(true)
      await EventsService.create(data)
      toast({
        title: "Success",
        description: "Event created successfully",
      })
      router.push("/events")
    } catch (error) {
      console.error("Failed to create event:", error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Event"
        description="Add a new upcoming event"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "New" },
        ]}
      />
      <EventForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}

