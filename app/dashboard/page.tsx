"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, FileText, Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { http } from "@/lib/http"

export default function DashboardPage() {
  const [stats, setStats] = useState({
    members: { total: 0, newThisMonth: 0 },
    events: { upcoming: 0, recurring: 0 },
    posts: { published: 0, draft: 0 },
    matrimony: { pending: 0, approved: 0, rejected: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch stats from various endpoints
        const [membersRes, eventsRes, recurringRes, postsRes, matrimonyRes] = await Promise.allSettled([
          http.get("/admin/church_members"),
          http.get("/admin/events?upcoming=true"),
          http.get("/admin/recurring_events"),
          http.get("/admin/posts"),
          http.get("/matrimony/admins/profiles"),
        ])

        const newStats = { ...stats }

        if (membersRes.status === "fulfilled") {
          const members = membersRes.value.data.members || []
          newStats.members.total = members.length
          const thisMonth = new Date()
          thisMonth.setDate(1)
          newStats.members.newThisMonth = members.filter(
            (m: any) => new Date(m.created_at) >= thisMonth
          ).length
        }

        if (eventsRes.status === "fulfilled") {
          newStats.events.upcoming = eventsRes.value.data.events?.length || 0
        }

        if (recurringRes.status === "fulfilled") {
          newStats.events.recurring = recurringRes.value.data.recurring_events?.length || 0
        }

        if (postsRes.status === "fulfilled") {
          const posts = postsRes.value.data.posts || []
          newStats.posts.published = posts.filter((p: any) => p.status === "published").length
          newStats.posts.draft = posts.filter((p: any) => p.status === "draft").length
        }

        if (matrimonyRes.status === "fulfilled") {
          const profiles = matrimonyRes.value.data.profiles || []
          newStats.matrimony.pending = profiles.filter((p: any) => p.profile_status === "pending_approval").length
          newStats.matrimony.approved = profiles.filter((p: any) => p.profile_status === "approved").length
          newStats.matrimony.rejected = profiles.filter((p: any) => p.profile_status === "rejected").length
        }

        setStats(newStats)
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your church management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Church Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.members.newThisMonth} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              {stats.events.recurring} recurring events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.posts.published}</div>
            <p className="text-xs text-muted-foreground">
              {stats.posts.draft} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrimony</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.matrimony.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.matrimony.pending} pending, {stats.matrimony.rejected} rejected
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

