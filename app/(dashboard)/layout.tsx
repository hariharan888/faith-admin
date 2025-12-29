"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth.store"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { useSidebarStore } from "@/lib/stores/sidebar.store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isInitializing } = useAuthStore()

  useEffect(() => {
    // Only redirect if initialization is complete and user is not authenticated
    // This prevents redirecting during the initialization phase
    if (!isInitializing && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isInitializing, router])

  // Show loading while initializing - this prevents flash of login page
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated after initialization, return null (will redirect via useEffect)
  // This prevents rendering dashboard content before redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  const { isCollapsed } = useSidebarStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div 
        className="transition-all duration-300"
        style={{
          paddingLeft: isCollapsed 
            ? 'var(--layout-nav-mini-width)' 
            : 'var(--layout-nav-width)'
        }}
      >
        <Header />
        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

