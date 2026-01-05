import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { isValidElement, type ReactNode, type ComponentType } from "react"

interface StatCardProps {
  label?: string
  title?: string
  value: string | number
  icon: ComponentType<{ className?: string }> | ReactNode
  iconColor?: string
  iconBgColor?: string
  color?: { iconColor: string; iconBgColor: string }
  className?: string
  trend?: {
    value: number
    label?: string
    positive?: boolean
  }
  description?: string
  descriptionColor?: string
  progress?: number
  progressLabel?: string
}

export function StatCard({
  label,
  title,
  value,
  icon,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  color,
  className,
  trend,
  description,
  descriptionColor,
  progress,
  progressLabel,
}: StatCardProps) {
  // Use color object if provided, otherwise use individual props
  const finalIconColor = color?.iconColor || iconColor
  const finalIconBgColor = color?.iconBgColor || iconBgColor
  const displayLabel = label || title || ""

  // Check if icon is a React element or a component
  const isIconElement = isValidElement(icon)
  const IconComponent = icon as ComponentType<{ className?: string }>

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center gap-4">
        <div className={cn("rounded-lg p-2.5 shrink-0", finalIconBgColor)}>
          {isIconElement ? (
            <div className={cn(finalIconColor)}>{icon as ReactNode}</div>
          ) : (
            <IconComponent className={cn("h-5 w-5", finalIconColor)} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">{displayLabel}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {trend && (
              <span className={cn("text-xs font-medium", trend.positive ? "text-green-600" : "text-red-600")}>
                {trend.positive ? "+" : ""}
                {trend.value}%{trend.label && <span className="text-muted-foreground ml-1">{trend.label}</span>}
              </span>
            )}
          </div>
          {description && (
            <p className={cn("text-xs mt-1", descriptionColor || "text-muted-foreground")}>{description}</p>
          )}
          {typeof progress === "number" && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", finalIconBgColor.replace("/10", ""))}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              {progressLabel && <p className="text-xs text-muted-foreground mt-1">{progressLabel}</p>}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Preset color variants for common use cases
export const statCardColors = {
  primary: { iconColor: "text-primary", iconBgColor: "bg-primary/10" },
  secondary: { iconColor: "text-secondary-foreground", iconBgColor: "bg-secondary" },
  success: { iconColor: "text-green-600", iconBgColor: "bg-green-500/10" },
  warning: { iconColor: "text-amber-600", iconBgColor: "bg-amber-500/10" },
  danger: { iconColor: "text-red-600", iconBgColor: "bg-red-500/10" },
  info: { iconColor: "text-blue-600", iconBgColor: "bg-blue-500/10" },
  purple: { iconColor: "text-purple-600", iconBgColor: "bg-purple-500/10" },
  orange: { iconColor: "text-orange-600", iconBgColor: "bg-orange-500/10" },
  muted: { iconColor: "text-muted-foreground", iconBgColor: "bg-muted" },
  blue: { iconColor: "text-blue-600", iconBgColor: "bg-blue-500/10" },
  green: { iconColor: "text-green-600", iconBgColor: "bg-green-500/10" },
  amber: { iconColor: "text-amber-600", iconBgColor: "bg-amber-500/10" },
  yellow: { iconColor: "text-yellow-600", iconBgColor: "bg-yellow-500/10" },
  red: { iconColor: "text-red-600", iconBgColor: "bg-red-500/10" },
} as const

export type StatCardColorVariant = keyof typeof statCardColors

export default StatCard
