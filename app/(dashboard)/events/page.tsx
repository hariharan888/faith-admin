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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EventsService } from "@/lib/services/events.service"
import type { Event } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const eventsData = await EventsService.getAll(true)
      setEvents(eventsData)
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
      await EventsService.delete(deleteId)
      setEvents(events.filter((e) => e.id !== deleteId))
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
              onClick: () => setDeleteId(row.original.id),
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
            <Button variant="outline" onClick={() => router.push("/events/recurring")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recurring Events
            </Button>
            <Button onClick={() => router.push("/events/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </>
        }
      />

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

