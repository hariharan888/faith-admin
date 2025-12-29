"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Plus, Edit, Trash2, Eye, FileText, Grid, List } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { DataTable, SortableHeader, RowActions } from "@/components/shared/data-table"
import { StatusLabel } from "@/components/shared/status-label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PostsService } from "@/lib/services/posts.service"
import type { Post } from "@/lib/types/post"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const data = await PostsService.getAll()
      setPosts(data)
    } catch (error) {
      console.error("Failed to fetch posts:", error)
      toast({
        title: "Error",
        description: "Failed to load posts",
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
      await PostsService.delete(deleteId)
      setPosts(posts.filter((p) => p.id !== deleteId))
      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredPosts = useMemo(() => {
    switch (activeTab) {
      case "published":
        return posts.filter((p) => p.status === "published")
      case "draft":
        return posts.filter((p) => p.status === "draft")
      default:
        return posts
    }
  }, [posts, activeTab])

  const tabCounts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
  }), [posts])

  const columns: ColumnDef<Post>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description || "No description"}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusLabel status={row.original.status} />,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <SortableHeader column={column}>Created</SortableHeader>,
      cell: ({ row }) => format(new Date(row.original.created_at), "PP"),
    },
    {
      accessorKey: "published_at",
      header: "Published",
      cell: ({ row }) => 
        row.original.published_at 
          ? format(new Date(row.original.published_at), "PP")
          : "—",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => router.push(`/posts/detail?id=${row.original.id}`),
            },
            {
              label: "Edit",
              icon: <Edit className="h-4 w-4" />,
              onClick: () => router.push(`/posts/detail?id=${row.original.id}&edit=true`),
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
        title="Posts"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Posts" },
        ]}
        actions={
          <Button onClick={() => router.push("/posts/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        }
      />

      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              All <Badge variant="secondary" className="ml-1">{tabCounts.all}</Badge>
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2">
              Published <Badge variant="secondary" className="ml-1">{tabCounts.published}</Badge>
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-2">
              Drafts <Badge variant="secondary" className="ml-1">{tabCounts.draft}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
        >
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      ) : viewMode === "list" ? (
        <DataTable
          columns={columns}
          data={filteredPosts}
          searchKey="title"
          searchPlaceholder="Search posts..."
          onRowClick={(row) => router.push(`/posts/detail?id=${row.id}`)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/posts/detail?id=${post.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <StatusLabel status={post.status} />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold line-clamp-2 mb-2">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {post.description || "No description"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(post.created_at), "PPP")}
                </p>
              </CardContent>
            </Card>
          ))}
          {filteredPosts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No posts found
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
