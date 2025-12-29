"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Upload, Edit, Trash2, Eye, Phone, Mail } from "lucide-react"
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

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const data = await MembersService.getAll()
      setMembers(data)
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
      setMembers(members.filter((m) => m.id !== deleteId))
      toast({
        title: "Success",
        description: "Member deleted successfully",
      })
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

  const filteredMembers = useMemo(() => {
    switch (activeTab) {
      case "male":
        return members.filter((m) => m.gender === "male")
      case "female":
        return members.filter((m) => m.gender === "female")
      case "married":
        return members.filter((m) => m.marital_status === "married")
      case "single":
        return members.filter((m) => m.marital_status === "single")
      default:
        return members
    }
  }, [members, activeTab])

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

  const tabCounts = useMemo(() => ({
    all: members.length,
    male: members.filter((m) => m.gender === "male").length,
    female: members.filter((m) => m.gender === "female").length,
    married: members.filter((m) => m.marital_status === "married").length,
    single: members.filter((m) => m.marital_status === "single").length,
  }), [members])

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All <Badge variant="secondary" className="ml-1">{tabCounts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="male" className="gap-2">
            Male <Badge variant="secondary" className="ml-1">{tabCounts.male}</Badge>
          </TabsTrigger>
          <TabsTrigger value="female" className="gap-2">
            Female <Badge variant="secondary" className="ml-1">{tabCounts.female}</Badge>
          </TabsTrigger>
          <TabsTrigger value="married" className="gap-2">
            Married <Badge variant="secondary" className="ml-1">{tabCounts.married}</Badge>
          </TabsTrigger>
          <TabsTrigger value="single" className="gap-2">
            Single <Badge variant="secondary" className="ml-1">{tabCounts.single}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredMembers}
              searchKey="name"
              searchPlaceholder="Search members..."
              onRowClick={(row) => router.push(`/members/detail?id=${row.id}`)}
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
