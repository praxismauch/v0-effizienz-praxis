"use client"

import { memo } from "react"
import { FileText, Cpu, Package, Wrench, BookOpen } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

interface KnowledgeStatCardsProps {
  articleCount: number
  deviceCount: number
  materialCount: number
  equipmentCount: number
  totalCount: number
}

export const KnowledgeStatCards = memo(function KnowledgeStatCards({
  articleCount,
  deviceCount,
  materialCount,
  equipmentCount,
  totalCount,
}: KnowledgeStatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        label="Artikel"
        value={articleCount}
        icon={FileText}
        {...statCardColors.primary}
      />
      <StatCard
        label="Geräte"
        value={deviceCount}
        icon={Cpu}
        {...statCardColors.blue}
      />
      <StatCard
        label="Material"
        value={materialCount}
        icon={Package}
        {...statCardColors.orange}
      />
      <StatCard
        label="Arbeitsmittel"
        value={equipmentCount}
        icon={Wrench}
        {...statCardColors.green}
      />
      <StatCard
        label="Gesamt"
        value={totalCount}
        icon={BookOpen}
        {...statCardColors.purple}
      />
    </div>
  )
})
