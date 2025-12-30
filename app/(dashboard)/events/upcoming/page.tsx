"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit, Trash2, Eye, Calendar, MapPin, Clock, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { DataTable, SortableHeader, RowActions } from "@/components/shared/data-table"
import { StatusLabel } from "@/components/shared/status-label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EventsService } from "@/lib/services/events.service"
import type { Event } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function UpcomingEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, per_page: 20 })
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [pagination.current_page])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.current_page === 1) {
        fetchData()
      } else {
        setPagination({ ...pagination, current_page: 1 })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchData = async () => {
    try {
      setLoading(true)
      const filters: any = { upcoming: true }
      if (searchQuery) filters.search = searchQuery

      const result = await EventsService.getAll(pagination.current_page, pagination.per_page, filters)
      setEvents(result.events)
      setTotalCount(result.total_count)
      setPagination(result.pagination)
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
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
      fetchData()
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

  const handleBulkDelete = async () => {
    if (selectedEvents.length === 0) return
    
    try {
      setBulkDeleting(true)
      const ids = selectedEvents.map(e => e.id)
      await EventsService.bulkDelete(ids)
      toast({
        title: "Success",
        description: `${selectedEvents.length} event(s) deleted successfully`,
      })
      setSelectedEvents([])
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete events",
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
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
        title="Upcoming Events"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events", href: "/events/upcoming" },
          { label: "Upcoming" },
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {selectedEvents.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <span className="text-sm font-medium">
                {selectedEvents.length} event(s) selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          )}
          <DataTable
            columns={eventColumns}
            data={events}
            searchKey="title"
            searchPlaceholder="Search events..."
            onRowClick={(row) => router.push(`/events/detail?id=${row.id}`)}
            enableRowSelection={true}
            onSelectionChange={setSelectedEvents}
            serverPagination={{
              currentPage: pagination.current_page,
              totalPages: pagination.total_pages,
              totalCount: totalCount,
              onPageChange: (page) => setPagination({ ...pagination, current_page: page })
            }}
            onSearchChange={(search) => setSearchQuery(search)}
          />
        </>
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

