import { Badge } from "@/components/ui/badge"
import { FileText, Play, ClipboardCheck, MousePointerClick } from "lucide-react"

export function getDifficultyBadge(difficulty: string) {
  const config = {
    beginner: { label: "Einsteiger", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    intermediate: { label: "Fortgeschritten", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    advanced: { label: "Experte", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  }
  const { label, className } = config[difficulty as keyof typeof config] || config.beginner
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

export function getModuleIcon(type: string) {
  const icons = {
    article: FileText,
    video: Play,
    quiz: ClipboardCheck,
    practice: MousePointerClick,
  }
  return icons[type as keyof typeof icons] || FileText
}
