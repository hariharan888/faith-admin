"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Check, X, Eye, Trash2, Edit, Heart, User } from "lucide-react"
import { format, differenceInYears } from "date-fns"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { DataTable, SortableHeader, RowActions } from "@/components/shared/data-table"
import { StatusLabel } from "@/components/shared/status-label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MatrimonyService } from "@/lib/services/matrimony.service"
import type { MatrimonyProfile } from "@/lib/types/matrimony"
import { toast } from "@/hooks/use-toast"

export default function MatrimonyPage() {
  const router = useRouter()
  
  const [profiles, setProfiles] = useState<MatrimonyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    profileId: number | null
    reason: string
  }>({
    open: false,
    profileId: null,
    reason: "",
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, per_page: 20 })
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchProfiles()
  }, [statusFilter, pagination.current_page])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.current_page === 1) {
        fetchProfiles()
      } else {
        setPagination({ ...pagination, current_page: 1 })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (searchQuery) filters.search = searchQuery

      const result = await MatrimonyService.getAll(pagination.current_page, pagination.per_page, filters)
      setProfiles(result.profiles)
      setTotalCount(result.total_count)
      setPagination(result.pagination)
    } catch (error) {
      console.error("Failed to fetch profiles:", error)
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(true)
      await MatrimonyService.approve(id)
      toast({
        title: "Success",
        description: "Profile approved successfully",
      })
      fetchProfiles()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.profileId || !rejectDialog.reason.trim()) return

    try {
      setActionLoading(true)
      await MatrimonyService.reject(rejectDialog.profileId, rejectDialog.reason)
      toast({
        title: "Success",
        description: "Profile rejected",
      })
      setRejectDialog({ open: false, profileId: null, reason: "" })
      fetchProfiles()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject profile",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setDeleting(true)
      await MatrimonyService.delete(deleteId)
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      })
      fetchProfiles()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleExport = async () => {
    try {
      const response = await MatrimonyService.export()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `matrimony_profiles_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Success",
        description: "Profiles exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export profiles",
        variant: "destructive",
      })
    }
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPagination({ ...pagination, current_page: 1 })
  }

  const columns: ColumnDef<MatrimonyProfile>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => {
        const profile = row.original
        const initials = profile.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        const age = profile.date_of_birth
          ? differenceInYears(new Date(), new Date(profile.date_of_birth))
          : null

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {profile.profile_photo_url ? (
                <AvatarImage src={profile.profile_photo_url} alt={profile.name} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">
                {age && `${age} years`} • {profile.gender}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "occupation",
      header: "Occupation",
      cell: ({ row }) => row.original.occupation || "—",
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => {
        const profile = row.original
        const location = [profile.city, profile.state].filter(Boolean).join(", ")
        return location || "—"
      },
    },
    {
      accessorKey: "profile_status",
      header: "Status",
      cell: ({ row }) => (
        <StatusLabel 
          status={row.original.profile_status.replace(/_/g, " ")} 
        />
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <SortableHeader column={column}>Submitted</SortableHeader>,
      cell: ({ row }) => format(new Date(row.original.created_at), "PP"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const profile = row.original
        const isPending = profile.profile_status === "pending_approval"
        const canEdit = profile.profile_status !== "approved" // Only allow editing non-approved profiles

        return (
          <div className="flex items-center gap-1">
            {isPending && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApprove(profile.id)
                  }}
                  disabled={actionLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRejectDialog({
                      open: true,
                      profileId: profile.id,
                      reason: "",
                    })
                  }}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
            <RowActions
              actions={[
                {
                  label: "View",
                  icon: <Eye className="h-4 w-4" />,
                  onClick: () => router.push(`/matrimony/detail?id=${profile.id}`),
                },
                ...(canEdit ? [{
                  label: "Edit",
                  icon: <Edit className="h-4 w-4" />,
                  onClick: () => router.push(`/matrimony/detail?id=${profile.id}&edit=true`),
                }] : []),
                {
                  label: "Delete",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => setDeleteId(profile.id),
                  variant: "destructive",
                },
              ]}
            />
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matrimony Profiles"
        description="Review and manage matrimony profile submissions"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Matrimony" },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => router.push("/matrimony/import")}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </>
        }
      />

      <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending_approval">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={profiles}
              searchKey="name"
              searchPlaceholder="Search profiles..."
              onRowClick={(row) => router.push(`/matrimony/detail?id=${row.id}`)}
              serverPagination={{
                currentPage: pagination.current_page,
                totalPages: pagination.total_pages,
                totalCount: totalCount,
                onPageChange: (page) => setPagination({ ...pagination, current_page: page })
              }}
              onSearchChange={(search) => setSearchQuery(search)}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Profile"
        description="Are you sure you want to delete this profile? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          !open && setRejectDialog({ open: false, profileId: null, reason: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Profile</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this profile. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectDialog.reason}
                onChange={(e) =>
                  setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRejectDialog({ open: false, profileId: null, reason: "" })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectDialog.reason.trim() || actionLoading}
            >
              {actionLoading && (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Reject Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
