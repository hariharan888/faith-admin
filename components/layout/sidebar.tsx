"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Heart,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  CalendarClock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NavSection, type NavSection as NavSectionType } from "./nav-section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSidebarStore } from "@/lib/stores/sidebar.store"

const navData: NavSectionType[] = [
  {
    subheader: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ],
  },
  {
    subheader: "Management",
    items: [
      {
        title: "Members",
        href: "/members",
        icon: <Users className="h-5 w-5" />,
        children: [
          { title: "List", href: "/members" },
          { title: "Create", href: "/members/new" },
          { title: "Import CSV", href: "/members/import" },
        ],
      },
      {
        title: "Events",
        href: "/events",
        icon: <Calendar className="h-5 w-5" />,
        children: [
          { title: "Upcoming", href: "/events" },
          { title: "Create Event", href: "/events/new" },
          { title: "Recurring", href: "/events/recurring" },
          { title: "Create Recurring", href: "/events/recurring/new" },
        ],
      },
      {
        title: "Posts",
        href: "/posts",
        icon: <FileText className="h-5 w-5" />,
        children: [
          { title: "List", href: "/posts" },
          { title: "Create", href: "/posts/new" },
        ],
      },
      {
        title: "Matrimony",
        href: "/matrimony",
        icon: <Heart className="h-5 w-5" />,
        children: [
          { title: "Profiles", href: "/matrimony" },
          { title: "Import CSV", href: "/matrimony/import" },
        ],
      },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed, setIsCollapsed } = useSidebarStore()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "relative fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isCollapsed ? "w-[var(--layout-nav-mini-width)]" : "w-[var(--layout-nav-width)]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Floating Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent transition-all",
            isCollapsed && "-right-3"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          isCollapsed && "justify-center px-2"
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
              <span className="text-lg font-bold text-sidebar-primary-foreground">F</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-accent-foreground">Faith Church</span>
                <span className="text-xs text-sidebar-foreground">Admin</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <NavSection data={navData} isCollapsed={isCollapsed} />
        </ScrollArea>
      </aside>
    </>
  )
}

