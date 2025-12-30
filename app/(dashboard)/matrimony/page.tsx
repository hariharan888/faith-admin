"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, Trash2, Edit, Heart, User } from "lucide-react"
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
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, per_page: 20 })
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProfiles, setSelectedProfiles] = useState<MatrimonyProfile[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

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
    setSelectedProfiles([])
  }

  const handleBulkDelete = async () => {
    if (selectedProfiles.length === 0) return
    
    try {
      setBulkDeleting(true)
      const ids = selectedProfiles.map(p => p.id)
      await MatrimonyService.bulkDelete(ids)
      toast({
        title: "Success",
        description: `${selectedProfiles.length} profile(s) deleted successfully`,
      })
      setSelectedProfiles([])
      fetchProfiles()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete profiles",
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedProfiles.length === 0) return
    
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
        // Use age from API, fallback to calculating from date_of_birth
        const age = profile.age ?? (profile.date_of_birth
          ? differenceInYears(new Date(), new Date(profile.date_of_birth))
          : null)

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.name}</p>
              <p className="text-xs text-muted-foreground">
                {age ? `${age} years` : ""} {age && profile.gender ? "•" : ""} {profile.gender}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "job_title",
      header: "Occupation",
      cell: ({ row }) => row.original.job_title || row.original.job_type || "—",
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => {
        const profile = row.original
        const address = profile.current_address
        if (address) {
          const location = [address.city, address.state].filter(Boolean).join(", ")
          return location || "—"
        }
        return "—"
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
        return (
          <RowActions
            actions={[
              {
                label: "View",
                icon: <Eye className="h-4 w-4" />,
                onClick: () => router.push(`/matrimony/detail?id=${profile.id}`),
              },
              {
                label: "Edit",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => router.push(`/matrimony/detail?id=${profile.id}&edit=true`),
              },
              {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => setDeleteId(profile.id),
                variant: "destructive",
              },
            ]}
          />
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
          {selectedProfiles.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <span className="text-sm font-medium">
                {selectedProfiles.length} profile(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={bulkDeleting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
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
            </div>
          )}
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
              enableRowSelection={true}
              onSelectionChange={setSelectedProfiles}
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

    </div>
  )
}
