"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit, Trash2, Eye, RefreshCw, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { DataTable, SortableHeader, RowActions } from "@/components/shared/data-table"
import { StatusLabel } from "@/components/shared/status-label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { RecurringEventsService } from "@/lib/services/events.service"
import type { RecurringEvent } from "@/lib/types/event"
import { toast } from "@/hooks/use-toast"

export default function RecurringEventsPage() {
  const router = useRouter()
  const [recurringEvents, setRecurringEvents] = useState<RecurringEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchRecurringEvents()
  }, [])

  const fetchRecurringEvents = async () => {
    try {
      setLoading(true)
      const data = await RecurringEventsService.getAll()
      setRecurringEvents(data)
    } catch (error) {
      console.error("Failed to fetch recurring events:", error)
      toast({
        title: "Error",
        description: "Failed to load recurring events",
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
      await RecurringEventsService.delete(deleteId)
      setRecurringEvents(recurringEvents.filter((e) => e.id !== deleteId))
      toast({
        title: "Success",
        description: "Recurring event deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recurring event",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

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
        title="Recurring Events"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Events", href: "/events" },
          { label: "Recurring" },
        ]}
        actions={
          <Button onClick={() => router.push("/events/recurring/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring Event
          </Button>
        }
      />

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={recurringColumns}
          data={recurringEvents}
          searchKey="title"
          searchPlaceholder="Search recurring events..."
          onRowClick={(row) => router.push(`/events/recurring/detail?id=${row.id}`)}
        />
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Recurring Event"
        description="Are you sure you want to delete this recurring event? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
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

