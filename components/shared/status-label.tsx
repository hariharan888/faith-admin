"use client"

import { cn } from "@/lib/utils"

type StatusVariant = 
  | "default" 
  | "success" 
  | "warning" 
  | "error" 
  | "info" 
  | "pending"
  | "active"
  | "inactive"
  | "draft"
  | "published"
  | "approved"
  | "rejected"
  | "banned"

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-green-500/15 text-green-600 dark:text-green-400",
  warning: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  error: "bg-red-500/15 text-red-600 dark:text-red-400",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  pending: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  active: "bg-green-500/15 text-green-600 dark:text-green-400",
  inactive: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/15 text-green-600 dark:text-green-400",
  approved: "bg-green-500/15 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/15 text-red-600 dark:text-red-400",
  banned: "bg-red-500/15 text-red-600 dark:text-red-400",
}

interface StatusLabelProps {
  status: string
  variant?: StatusVariant
  className?: string
}

export function StatusLabel({ status, variant, className }: StatusLabelProps) {
  // Auto-detect variant from status string if not provided
  const autoVariant = variant || getVariantFromStatus(status)
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        variantStyles[autoVariant],
        className
      )}
    >
      {formatStatus(status)}
    </span>
  )
}

function getVariantFromStatus(status: string): StatusVariant {
  const normalizedStatus = status.toLowerCase().replace(/_/g, "")
  
  const statusMap: Record<string, StatusVariant> = {
    active: "active",
    inactive: "inactive",
    pending: "pending",
    pendingapproval: "pending",
    approved: "approved",
    rejected: "rejected",
    banned: "banned",
    draft: "draft",
    published: "published",
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
  }
  
  return statusMap[normalizedStatus] || "default"
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

