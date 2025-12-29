"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  ResponsiveContainer 
} from "recharts"

interface StatWidgetProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  chartData?: { value: number }[]
  chartColor?: string
  className?: string
}

export function StatWidget({
  title,
  value,
  change,
  changeLabel = "last 7 days",
  icon,
  chartData,
  chartColor = "hsl(var(--primary))",
  className,
}: StatWidgetProps) {
  const isPositive = change && change >= 0
  const formattedValue = typeof value === "number" 
    ? new Intl.NumberFormat().format(value) 
    : value

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight mb-2">
              {formattedValue}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  isPositive ? "text-green-500" : "text-red-500"
                )}>
                  {isPositive ? "+" : ""}{change}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {changeLabel}
                </span>
              </div>
            )}
          </div>
          
          {/* Icon or Chart */}
          <div className="flex-shrink-0">
            {icon && !chartData && (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                {icon}
              </div>
            )}
            {chartData && (
              <div className="h-12 w-16">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData}>
                    <Bar
                      dataKey="value"
                      fill={chartColor}
                      radius={[2, 2, 0, 0]}
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple stat card without chart
interface SimpleStatProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function SimpleStat({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: SimpleStatProps) {
  const formattedValue = typeof value === "number" 
    ? new Intl.NumberFormat().format(value) 
    : value

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight mt-1">
              {formattedValue}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              trend === "up" && "bg-green-500/10 text-green-500",
              trend === "down" && "bg-red-500/10 text-red-500",
              !trend && "bg-primary/10 text-primary"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

