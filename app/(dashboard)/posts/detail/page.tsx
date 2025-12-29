"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Edit, FileText, Calendar } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { PostForm } from "@/components/forms/post-form"
import { StatusLabel } from "@/components/shared/status-label"
import { Separator } from "@/components/ui/separator"
import { PostsService } from "@/lib/services/posts.service"
import type { Post, PostFormData } from "@/lib/types/post"
import { toast } from "@/hooks/use-toast"

export default function PostDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = Number(searchParams.get("id"))
  const isEditing = searchParams.get("edit") === "true"
  
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (postId) {
      fetchPost()
    } else {
      router.push("/posts")
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const data = await PostsService.getById(postId)
      setPost(data)
    } catch (error) {
      console.error("Failed to fetch post:", error)
      toast({
        title: "Error",
        description: "Failed to load post details",
        variant: "destructive",
      })
      router.push("/posts")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (data: PostFormData) => {
    try {
      setSaving(true)
      await PostsService.update(postId, data)
      toast({
        title: "Success",
        description: "Post updated successfully",
      })
      router.push(`/posts/detail?id=${postId}`)
    } catch (error) {
      console.error("Failed to update post:", error)
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!post) {
    return null
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Edit Post"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Posts", href: "/posts" },
            { label: post.title, href: `/posts/detail?id=${post.id}` },
            { label: "Edit" },
          ]}
        />
        <PostForm post={post} onSubmit={handleUpdate} loading={saving} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={post.title}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Posts", href: "/posts" },
          { label: post.title },
        ]}
        actions={
          <Button onClick={() => router.push(`/posts/detail?id=${post.id}&edit=true`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Post
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Post Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusLabel status={post.status} />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(post.created_at), "PPP")}</p>
                </div>
              </div>
              
              {post.published_at && (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Published</p>
                    <p className="font-medium">{format(new Date(post.published_at), "PPP")}</p>
                  </div>
                </div>
              )}
              
              <Separator />
              
              {post.cover_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Cover Image</p>
                  <img 
                    src={post.cover_url} 
                    alt={post.title}
                    className="rounded-lg w-full object-cover"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Post Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {post.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {post.description}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Content</h4>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content || "<p>No content</p>" }}
              />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-4">Record Info</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{new Date(post.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{new Date(post.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

