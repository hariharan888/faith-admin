"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
  children?: NavItem[]
}

export interface NavSection {
  subheader?: string
  items: NavItem[]
}

interface NavSectionProps {
  data: NavSection[]
  isCollapsed?: boolean
}

export function NavSection({ data, isCollapsed }: NavSectionProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-2">
      {data.map((section, sectionIndex) => (
        <div key={sectionIndex} className="py-2">
          {section.subheader && !isCollapsed && (
            <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.subheader}
            </h4>
          )}
          <div className="flex flex-col gap-0.5">
            {section.items.map((item, itemIndex) => (
              <NavItemComponent
                key={itemIndex}
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

interface NavItemComponentProps {
  item: NavItem
  pathname: string
  isCollapsed?: boolean
  depth?: number
}

function NavItemComponent({ item, pathname, isCollapsed, depth = 0 }: NavItemComponentProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
  const isChildActive = hasChildren && item.children?.some(child => 
    pathname === child.href || pathname?.startsWith(child.href + "/")
  )

  React.useEffect(() => {
    if (isChildActive) {
      setIsOpen(true)
    }
  }, [isChildActive])

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              (isActive || isChildActive) 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground",
              isCollapsed && "justify-center px-2"
            )}
          >
            {item.icon && (
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center",
                (isActive || isChildActive) && "text-sidebar-primary"
              )}>
                {item.icon}
              </span>
            )}
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </button>
        </CollapsibleTrigger>
        {!isCollapsed && (
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
              {item.children?.map((child, childIndex) => (
                <NavItemComponent
                  key={childIndex}
                  item={child}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  depth={depth + 1}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    )
  }

  return (
    <Link
      href={item.disabled ? "#" : item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive
          ? "bg-sidebar-primary/10 text-sidebar-primary"
          : "text-sidebar-foreground",
        item.disabled && "pointer-events-none opacity-50",
        isCollapsed && "justify-center px-2",
        depth > 0 && "py-2 text-[13px]"
      )}
    >
      {item.icon && (
        <span className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          isActive && "text-sidebar-primary"
        )}>
          {item.icon}
        </span>
      )}
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge}
        </>
      )}
    </Link>
  )
}

