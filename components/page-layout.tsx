"use client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatCard, statCardColors, type StatCardColorVariant } from "@/components/ui/stat-card"
import { Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ComponentType, ReactNode } from "react"

// ============================================================================
// PAGE HEADER
// ============================================================================

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-start justify-between gap-4", className)}>
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}

// ============================================================================
// STATS CARDS ROW
// ============================================================================

export interface StatCardItem {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }> | ReactNode
  color?: StatCardColorVariant
  trend?: {
    value: number
    label?: string
    positive?: boolean
  }
  description?: string
  progress?: number
  progressLabel?: string
}

interface StatsCardsProps {
  cards: StatCardItem[]
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function StatsCards({ cards, columns = 5, className }: StatsCardsProps) {
  const gridColsClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }[columns]

  return (
    <div className={cn("grid gap-4", gridColsClass, className)}>
      {cards.map((card, index) => (
        <StatCard
          key={index}
          label={card.label}
          value={card.value}
          icon={card.icon}
          color={card.color ? statCardColors[card.color] : undefined}
          trend={card.trend}
          description={card.description}
          progress={card.progress}
          progressLabel={card.progressLabel}
        />
      ))}
    </div>
  )
}

// ============================================================================
// SEARCH & FILTER TOOLBAR
// ============================================================================

export interface FilterOption {
  value: string
  label: string
}

interface SearchFilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: Array<{
    id: string
    label: string
    value: string
    options: FilterOption[]
    onChange: (value: string) => void
  }>
  extraControls?: ReactNode
  className?: string
}

export function SearchFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Suchen...",
  filters = [],
  extraControls,
  className,
}: SearchFilterBarProps) {
  const hasActiveFilters = filters.some((f) => f.value && f.value !== "all")

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 items-start sm:items-center", className)}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Filter Dropdowns */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          {filters.map((filter) => (
            <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 text-muted-foreground"
              onClick={() => filters.forEach((f) => f.onChange("all"))}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Filter zurücksetzen
            </Button>
          )}
        </div>
      )}

      {/* Extra Controls (view mode toggles, etc.) */}
      {extraControls && <div className="flex items-center gap-2 ml-auto">{extraControls}</div>}
    </div>
  )
}

// ============================================================================
// COMPLETE PAGE LAYOUT
// ============================================================================

interface PageLayoutProps {
  // Header
  title: string
  subtitle?: string
  actions?: ReactNode

  // Stats Cards
  stats?: StatCardItem[]
  statsColumns?: 2 | 3 | 4 | 5

  // Search & Filter
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: SearchFilterBarProps["filters"]
  toolbarExtras?: ReactNode

  // Content
  children: ReactNode

  // Styling
  className?: string
  contentClassName?: string
}

export function PageLayout({
  // Header
  title,
  subtitle,
  actions,
  // Stats
  stats,
  statsColumns = 5,
  // Search & Filter
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  toolbarExtras,
  // Content
  children,
  // Styling
  className,
  contentClassName,
}: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Section 1: Header with Title, Subtitle, and Action Buttons */}
      <PageHeader title={title} subtitle={subtitle} actions={actions} />

      {/* Section 2: Stats Cards (5 columns) */}
      {stats && stats.length > 0 && <StatsCards cards={stats} columns={statsColumns} />}

      {/* Section 3: Search & Filter Toolbar */}
      {(onSearchChange || (filters && filters.length > 0) || toolbarExtras) && (
        <SearchFilterBar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          extraControls={toolbarExtras}
        />
      )}

      {/* Section 4: Main Content */}
      <div className={contentClassName}>{children}</div>
    </div>
  )
}

// Export individual components for flexible usage
export default PageLayout
