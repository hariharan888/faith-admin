"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/shared/breadcrumbs"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import { PostsService } from "@/lib/services/posts.service"
import { toast } from "@/hooks/use-toast"

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "published"]),
})

type PostFormData = z.infer<typeof postSchema>

export default function NewPostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editorContent, setEditorContent] = useState("")

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      status: "draft",
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const isPublished = watch("status") === "published"

  const onSubmit = async (data: PostFormData) => {
    try {
      setLoading(true)
      await PostsService.create({
        ...data,
        content: editorContent,
      })
      toast({
        title: "Success",
        description: `Post ${data.status === "published" ? "published" : "saved as draft"} successfully`,
      })
      router.push("/posts")
    } catch (error) {
      console.error("Failed to create post:", error)
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Post"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Posts", href: "/posts" },
          { label: "Create" },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
                <CardDescription>Title, description, and content</CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Post Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter post title"
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Brief description of the post..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <TiptapEditor
                    content={editorContent}
                    onChange={setEditorContent}
                    placeholder="Write your post content here..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Publish immediately</Label>
                    <p className="text-xs text-muted-foreground">
                      {isPublished 
                        ? "Post will be visible to everyone"
                        : "Save as draft for later"}
                    </p>
                  </div>
                  <Switch
                    checked={isPublished}
                    onCheckedChange={(checked) =>
                      setValue("status", checked ? "published" : "draft")
                    }
                  />
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && (
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {isPublished ? "Publish Post" : "Save Draft"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/posts")}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Use headings to structure your content</li>
                  <li>• Add images to make posts engaging</li>
                  <li>• Keep paragraphs short for readability</li>
                  <li>• Preview before publishing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

