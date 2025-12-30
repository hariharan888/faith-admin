"use client"

import { useEffect, useState } from "react"
import { Users, Calendar, FileText, Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { useAuthStore } from "@/lib/stores/auth.store"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { StatWidget, SimpleStat } from "@/components/dashboard/stat-widget"
import { AreaChart } from "@/components/dashboard/area-chart"
import { DonutChart } from "@/components/dashboard/donut-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { http } from "@/lib/http"
import { MembersService } from "@/lib/services/members.service"
import { EventsService } from "@/lib/services/events.service"
import type { ChurchMember } from "@/lib/types/member"
import type { Event } from "@/lib/types/event"

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
  const [recentMembers, setRecentMembers] = useState<ChurchMember[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch stats
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

        // Fetch recent members (last 5)
        const membersRes = await MembersService.getAll(1, 5)
        setRecentMembers(membersRes.church_members || [])

        // Fetch upcoming events (next 5) - exclude recurring events
        const eventsRes = await EventsService.getAll(1, 10, { upcoming: true })
        // Filter out events that came from recurring events (source_recurring_event_id is null)
        const oneTimeEvents = (eventsRes.events || []).filter(event => !event.source_recurring_event_id).slice(0, 5)
        setUpcomingEvents(oneTimeEvents)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : recentMembers.length > 0 ? (
              <div className="space-y-4">
                {recentMembers.map((member) => {
                  const timeAgo = member.created_at 
                    ? formatDistanceToNow(new Date(member.created_at), { addSuffix: true })
                    : "Recently"
                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2 transition-colors"
                      onClick={() => router.push(`/members/detail?id=${member.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.membership_number ? `#${member.membership_number}` : "Member"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent members</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => {
                  const eventDate = event.event_date ? new Date(event.event_date) : null
                  const dateStr = eventDate 
                    ? format(eventDate, "EEE, MMM d")
                    : "TBD"
                  const timeStr = event.event_time || ""
                  const displayDate = timeStr ? `${dateStr}, ${timeStr}` : dateStr
                  
                  return (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg -mx-2 transition-colors"
                      onClick={() => router.push(`/events/detail?id=${event.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                        <Calendar className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{displayDate}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
