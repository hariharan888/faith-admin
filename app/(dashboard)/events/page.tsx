"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Clock, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { DataTable, SortableHeader, RowActions } from "@/components/shared/data-table"
import { StatusLabel } from "@/components/shared/status-label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventsService, RecurringEventsService } from "@/lib/services/events.service"
import type { Event, RecurringEvent } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<{ id: number; type: "event" | "recurring" } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("upcoming")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventsData, recurringData] = await Promise.all([
        EventsService.getAll(true),
        RecurringEventsService.getAll(),
      ])
      setEvents(eventsData)
      setRecurringEvents(recurringData)
    } catch (error) {
      console.error("Failed to fetch events:", error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setDeleting(true)
      if (deleteId.type === "event") {
        await EventsService.delete(deleteId.id)
        setEvents(events.filter((e) => e.id !== deleteId.id))
      } else {
        await RecurringEventsService.delete(deleteId.id)
        setRecurringEvents(recurringEvents.filter((e) => e.id !== deleteId.id))
      }
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const eventColumns: ColumnDef<Event>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {row.original.location}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "event_date",
      header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{format(new Date(row.original.event_date), "PPP")}</span>
        </div>
      ),
    },
    {
      accessorKey: "event_time",
      header: "Time",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.event_time || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusLabel status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/events/detail?id=${row.original.id}`),
            },
            {
              label: "Edit",
              icon: <Edit className="h-4 w-4" />,
              onClick: () => router.push(`/events/detail?id=${row.original.id}&edit=true`),
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId({ id: row.original.id, type: "event" }),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ]

  const recurringColumns: ColumnDef<RecurringEvent>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.title}</p>
          {row.original.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {row.original.location}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "rrule",
      header: "Recurrence",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{formatRRule(row.original.rrule)}</span>
        </div>
      ),
    },
    {
      accessorKey: "event_time",
      header: "Time",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.event_time || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusLabel status={row.original.status} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/events/recurring/detail?id=${row.original.id}`),
            },
            {
              label: "Edit",
              icon: <Edit className="h-4 w-4" />,
              onClick: () => router.push(`/events/recurring/detail?id=${row.original.id}&edit=true`),
            },
            {
              label: "Delete",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId({ id: row.original.id, type: "recurring" }),
              variant: "destructive",
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events" },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/events/recurring/new")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Add Recurring
            </Button>
            <Button onClick={() => router.push("/events/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            Upcoming Events <Badge variant="secondary" className="ml-1">{events.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="gap-2">
            Recurring <Badge variant="secondary" className="ml-1">{recurringEvents.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {loading ? (
            <LoadingState />
          ) : (
            <DataTable
              columns={eventColumns}
              data={events}
              searchKey="title"
              searchPlaceholder="Search events..."
              onRowClick={(row) => router.push(`/events/detail?id=${row.id}`)}
            />
          )}
        </TabsContent>

        <TabsContent value="recurring" className="mt-6">
          {loading ? (
            <LoadingState />
          ) : (
            <DataTable
              columns={recurringColumns}
              data={recurringEvents}
              searchKey="title"
              searchPlaceholder="Search recurring events..."
              onRowClick={(row) => router.push(`/events/recurring/detail?id=${row.id}`)}
            />
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
    </div>
  )
}

function formatRRule(rrule: string): string {
  // Simple RRULE parser for display
  const parts = rrule.split(";")
  const freq = parts.find((p) => p.startsWith("FREQ="))?.split("=")[1]
  const interval = parts.find((p) => p.startsWith("INTERVAL="))?.split("=")[1]
  const byday = parts.find((p) => p.startsWith("BYDAY="))?.split("=")[1]
  
  let text = ""
  
  switch (freq) {
    case "DAILY":
      text = interval === "1" ? "Daily" : `Every ${interval} days`
      break
    case "WEEKLY":
      text = interval === "1" ? "Weekly" : `Every ${interval} weeks`
      if (byday) {
        const days = byday.split(",").map(formatDay).join(", ")
        text += ` on ${days}`
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

function formatDay(day: string): string {
  const days: Record<string, string> = {
    MO: "Mon",
    TU: "Tue",
    WE: "Wed",
    TH: "Thu",
    FR: "Fri",
    SA: "Sat",
    SU: "Sun",
  }
  return days[day] || day
}
