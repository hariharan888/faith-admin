"use client"

import { useEffect, useState } from "react"
import { Users, Calendar, FileText, Heart } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth.store"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { StatWidget, SimpleStat } from "@/components/dashboard/stat-widget"
import { AreaChart } from "@/components/dashboard/area-chart"
import { DonutChart } from "@/components/dashboard/donut-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { http } from "@/lib/http"

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
    matrimony: { pending: 0, approved: 0, rejected: 0, change: 0 },
  })
  const [memberGrowth, setMemberGrowth] = useState<any[]>([])
  const [membersByAge, setMembersByAge] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await http.get("/admin/stats")
        
        if (statsRes.data) {
          const data = statsRes.data
          setStats({
            members: data.members || { total: 0, newThisMonth: 0, change: 0 },
            events: data.events || { upcoming: 0, recurring: 0, change: 0 },
            posts: data.posts || { published: 0, draft: 0, change: 0 },
            matrimony: data.matrimony || { pending: 0, approved: 0, rejected: 0, change: 0 },
          })
          setMemberGrowth(data.member_growth || [])
          setMembersByAge(data.members_by_age || [])
        }
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
          change={stats.events.change}
          chartData={sparklineData.map(d => ({ value: d.value + 5 }))}
          chartColor="hsl(199, 89%, 48%)"
        />
        <StatWidget
          title="Published Posts"
          value={stats.posts.published}
          change={stats.posts.change}
          chartData={sparklineData.map(d => ({ value: d.value - 3 }))}
          chartColor="hsl(43, 96%, 56%)"
        />
        <StatWidget
          title="Matrimony Profiles"
          value={stats.matrimony.approved}
          change={stats.matrimony.change}
          chartData={sparklineData.map(d => ({ value: d.value + 2 }))}
          chartColor="hsl(291, 64%, 42%)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AreaChart
          title="Member Growth"
          subtitle="Membership trends by year"
          data={memberGrowth}
          series={[
            { name: "Total Members", dataKey: "total_members", color: "hsl(162, 93%, 33%)" },
            { name: "New Members", dataKey: "new_members", color: "hsl(199, 89%, 48%)" },
          ]}
          xAxisKey="year"
          className="lg:col-span-2"
        />
        <DonutChart
          title="Members by Age"
          subtitle="Age distribution"
          data={membersByAge}
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
