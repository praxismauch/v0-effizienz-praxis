import { Badge } from "@/components/ui/badge"

interface CategoryHeaderProps {
  name: string
  count: number
  color?: string
  className?: string
}

/**
 * Reusable category header component with colorful dot, name, and count badge
 * Used across the application for consistent category grouping display
 */
export function CategoryHeader({ name, count, color, className = "" }: CategoryHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {color && (
        <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <Badge variant="secondary" className="ml-auto">
        {count}
      </Badge>
    </div>
  )
}

export default CategoryHeader
