"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Bell, 
  Search, 
  Settings, 
  LogOut, 
  ChevronDown,
  Moon,
  Sun,
  Command,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuthStore } from "@/lib/stores/auth.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [searchOpen, setSearchOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
    router.push("/login")
  }

  const userInitials = React.useMemo(() => {
    const name = user?.user?.email || user?.user?.username || "Admin"
    return name.substring(0, 2).toUpperCase()
  }, [user])

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6",
      className
    )}>
      {/* Spacer for sidebar */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 gap-2 rounded-lg px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt={userInitials} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user?.email || user?.user?.username || "Admin User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.user?.email || "admin@faithchurch.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

interface NotificationItemProps {
  title: string
  description: string
  time: string
  unread?: boolean
}

function NotificationItem({ title, description, time, unread }: NotificationItemProps) {
  return (
    <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
      <div className="flex w-full items-start justify-between gap-2">
        <span className={cn("text-sm font-medium", unread && "text-foreground")}>
          {title}
        </span>
        {unread && (
          <span className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
      <span className="text-xs text-muted-foreground line-clamp-2">{description}</span>
      <span className="text-xs text-muted-foreground/70">{time}</span>
    </DropdownMenuItem>
  )
}
