"use client"

import { useEffect, useState } from "react"
import { Users, Calendar, FileText, Heart, TrendingUp, TrendingDown } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth.store"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { StatWidget, SimpleStat } from "@/components/dashboard/stat-widget"
import { AreaChart } from "@/components/dashboard/area-chart"
import { DonutChart } from "@/components/dashboard/donut-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { http } from "@/lib/http"

// Mock data for charts
const memberGrowthData = [
  { month: "Jan", members: 120, newMembers: 8 },
  { month: "Feb", members: 128, newMembers: 12 },
  { month: "Mar", members: 140, newMembers: 15 },
  { month: "Apr", members: 155, newMembers: 10 },
  { month: "May", members: 165, newMembers: 18 },
  { month: "Jun", members: 183, newMembers: 14 },
  { month: "Jul", members: 197, newMembers: 20 },
  { month: "Aug", members: 217, newMembers: 16 },
  { month: "Sep", members: 233, newMembers: 22 },
  { month: "Oct", members: 255, newMembers: 19 },
  { month: "Nov", members: 274, newMembers: 25 },
  { month: "Dec", members: 299, newMembers: 21 },
]

const eventAttendanceData = [
  { name: "Sunday Service", value: 450, color: "hsl(162, 93%, 33%)" },
  { name: "Bible Study", value: 120, color: "hsl(199, 89%, 48%)" },
  { name: "Youth Meeting", value: 85, color: "hsl(43, 96%, 56%)" },
  { name: "Prayer Meeting", value: 65, color: "hsl(291, 64%, 42%)" },
]

const sparklineData = [
  { value: 15 }, { value: 18 }, { value: 12 }, { value: 25 },
  { value: 20 }, { value: 28 }, { value: 22 }, { value: 30 },
]

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    members: { total: 0, newThisMonth: 0, change: 0 },
    events: { upcoming: 0, recurring: 0, change: 0 },
    posts: { published: 0, draft: 0, change: 0 },
    matrimony: { pending: 0, approved: 0, rejected: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState("2024")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [membersRes, eventsRes, recurringRes, postsRes, matrimonyRes] = await Promise.allSettled([
          http.get("/admin/church_members"),
          http.get("/admin/events?upcoming=true"),
          http.get("/admin/recurring_events"),
          http.get("/admin/posts"),
          http.get("/matrimony/admins/profiles"),
        ])

        const newStats = { ...stats }

        if (membersRes.status === "fulfilled") {
          const members = membersRes.value.data.church_members || []
          newStats.members.total = members.length
          const thisMonth = new Date()
          thisMonth.setDate(1)
          const newThisMonth = members.filter(
            (m: any) => new Date(m.created_at) >= thisMonth
          ).length
          newStats.members.newThisMonth = newThisMonth
          newStats.members.change = newThisMonth > 0 ? Math.round((newThisMonth / Math.max(members.length, 1)) * 100) : 0
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

  const userName = user?.user?.email?.split("@")[0] || user?.user?.username || "Admin"

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        title={`Welcome back 👋\n${userName}`}
        description="Manage your church community, events, and content all in one place. Here's what's happening today."
        actionLabel="View Members"
        onAction={() => window.location.href = "/members"}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Total Members"
          value={stats.members.total}
          change={stats.members.change}
          chartData={sparklineData}
          chartColor="hsl(162, 93%, 33%)"
        />
        <StatWidget
          title="Upcoming Events"
          value={stats.events.upcoming}
          change={12}
          chartData={sparklineData.map(d => ({ value: d.value + 5 }))}
          chartColor="hsl(199, 89%, 48%)"
        />
        <StatWidget
          title="Published Posts"
          value={stats.posts.published}
          change={-5}
          chartData={sparklineData.map(d => ({ value: d.value - 3 }))}
          chartColor="hsl(43, 96%, 56%)"
        />
        <StatWidget
          title="Matrimony Profiles"
          value={stats.matrimony.approved}
          change={8}
          chartData={sparklineData.map(d => ({ value: d.value + 2 }))}
          chartColor="hsl(291, 64%, 42%)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AreaChart
          title="Member Growth"
          subtitle="Monthly membership trends"
          data={memberGrowthData}
          series={[
            { name: "Total Members", dataKey: "members", color: "hsl(162, 93%, 33%)" },
            { name: "New Members", dataKey: "newMembers", color: "hsl(199, 89%, 48%)" },
          ]}
          xAxisKey="month"
          showYearSelector
          years={["2022", "2023", "2024"]}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          className="lg:col-span-2"
        />
        <DonutChart
          title="Event Attendance"
          subtitle="By service type"
          data={eventAttendanceData}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SimpleStat
          title="New This Month"
          value={stats.members.newThisMonth}
          subtitle="Church members"
          icon={<Users className="h-5 w-5" />}
          trend="up"
        />
        <SimpleStat
          title="Recurring Events"
          value={stats.events.recurring}
          subtitle="Active schedules"
          icon={<Calendar className="h-5 w-5" />}
        />
        <SimpleStat
          title="Draft Posts"
          value={stats.posts.draft}
          subtitle="Awaiting publish"
          icon={<FileText className="h-5 w-5" />}
        />
        <SimpleStat
          title="Pending Approval"
          value={stats.matrimony.pending}
          subtitle="Matrimony profiles"
          icon={<Heart className="h-5 w-5" />}
          trend={stats.matrimony.pending > 0 ? "up" : "neutral"}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Member {i}</p>
                    <p className="text-xs text-muted-foreground">Joined recently</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{i}d ago</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Sunday Service", date: "Sun, 10:00 AM", type: "Weekly" },
                { name: "Bible Study", date: "Wed, 7:00 PM", type: "Weekly" },
                { name: "Youth Meeting", date: "Fri, 6:00 PM", type: "Weekly" },
                { name: "Prayer Meeting", date: "Sat, 6:00 AM", type: "Weekly" },
                { name: "Special Service", date: "Dec 31, 11:00 PM", type: "One-time" },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{event.name}</p>
                    <p className="text-xs text-muted-foreground">{event.date}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted">
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
