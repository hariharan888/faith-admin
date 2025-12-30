"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Upload, Download, Edit, Trash2, Eye, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { DataTable, SortableHeader, RowActions } from "@/components/shared/data-table"
import { StatusLabel } from "@/components/shared/status-label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MembersService } from "@/lib/services/members.service"
import type { ChurchMember } from "@/lib/types/member"
import { toast } from "@/hooks/use-toast"

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<ChurchMember[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, per_page: 20 })
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<ChurchMember[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [activeTab, pagination.current_page])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.current_page === 1) {
        fetchMembers()
      } else {
        setPagination({ ...pagination, current_page: 1 })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      if (activeTab === "male") filters.gender = "Male"
      if (activeTab === "female") filters.gender = "Female"
      if (activeTab === "married") filters.marital_status = "Married"
      if (activeTab === "single") filters.marital_status = "Single"
      if (searchQuery) filters.search = searchQuery

      const result = await MembersService.getAll(pagination.current_page, pagination.per_page, filters)
      setMembers(result.church_members)
      setTotalCount(result.total_count)
      setPagination(result.pagination)
    } catch (error) {
      console.error("Failed to fetch members:", error)
      toast({
        title: "Error",
        description: "Failed to load members",
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
      await MembersService.delete(deleteId)
      toast({
        title: "Success",
        description: "Member deleted successfully",
      })
      // Refresh the list
      fetchMembers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleExport = async () => {
    try {
      const response = await MembersService.export()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `church_members_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Success",
        description: "Members exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export members",
        variant: "destructive",
      })
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPagination({ ...pagination, current_page: 1 })
    setSelectedMembers([])
  }

  const handleBulkDelete = async () => {
    if (selectedMembers.length === 0) return
    
    try {
      setBulkDeleting(true)
      const ids = selectedMembers.map(m => m.id)
      await MembersService.bulkDelete(ids)
      toast({
        title: "Success",
        description: `${selectedMembers.length} member(s) deleted successfully`,
      })
      setSelectedMembers([])
      fetchMembers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete members",
        variant: "destructive",
      })
    } finally {
      setBulkDeleting(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedMembers.length === 0) return
    
    try {
      // For now, export all - we can add filtered export later
      const response = await MembersService.export()
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `church_members_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: "Success",
        description: "Members exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export members",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<ChurchMember>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => {
        const member = row.original
        const initials = member.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.membership_number}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "mobile_number",
      header: "Phone",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.mobile_number || "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => {
        const member = row.original
        const location = [member.city, member.state].filter(Boolean).join(", ")
        return location || "—"
      },
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.gender || "—"}</span>
      ),
    },
    {
      accessorKey: "marital_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.marital_status
        if (!status) return "—"
        return <StatusLabel status={status} />
      },
    },
    {
      accessorKey: "member_since_year",
      header: ({ column }) => (
        <SortableHeader column={column}>Member Since</SortableHeader>
      ),
      cell: ({ row }) => row.original.member_since_year || "—",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/members/detail?id=${row.original.id}`),
            },
            {
              label: "Edit",
              icon: <Edit className="h-4 w-4" />,
              onClick: () => router.push(`/members/detail?id=${row.original.id}&edit=true`),
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
        title="Church Members"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Members" },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => router.push("/members/import")}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button onClick={() => router.push("/members/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="male">Male</TabsTrigger>
          <TabsTrigger value="female">Female</TabsTrigger>
          <TabsTrigger value="married">Married</TabsTrigger>
          <TabsTrigger value="single">Single</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {selectedMembers.length > 0 && (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <span className="text-sm font-medium">
                {selectedMembers.length} member(s) selected
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
              data={members}
              searchKey="name"
              searchPlaceholder="Search members..."
              onRowClick={(row) => router.push(`/members/detail?id=${row.id}`)}
              enableRowSelection={true}
              onSelectionChange={setSelectedMembers}
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

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Member"
        description="Are you sure you want to delete this member? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
