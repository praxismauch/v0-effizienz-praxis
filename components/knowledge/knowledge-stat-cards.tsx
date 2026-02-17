"use client"

import { memo } from "react"
import { FileText, Cpu, Package, Wrench, BookOpen, ShieldCheck, ShieldAlert } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

interface KnowledgeStatCardsProps {
  articleCount: number
  deviceCount: number
  materialCount: number
  equipmentCount: number
  totalCount: number
  hygienePlanCount?: number
  cirsCount?: number
}

export const KnowledgeStatCards = memo(function KnowledgeStatCards({
  articleCount,
  deviceCount,
  materialCount,
  equipmentCount,
  totalCount,
  hygienePlanCount = 0,
  cirsCount = 0,
}: KnowledgeStatCardsProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
      <StatCard
        label="Artikel"
        value={articleCount}
        icon={FileText}
        className="min-w-[140px] flex-1"
        {...statCardColors.primary}
      />
      <StatCard
        label="Geräte"
        value={deviceCount}
        icon={Cpu}
        className="min-w-[140px] flex-1"
        {...statCardColors.blue}
      />
      <StatCard
        label="Material"
        value={materialCount}
        icon={Package}
        className="min-w-[140px] flex-1"
        {...statCardColors.orange}
      />
      <StatCard
        label="Arbeitsmittel"
        value={equipmentCount}
        icon={Wrench}
        className="min-w-[140px] flex-1"
        {...statCardColors.green}
      />
      <StatCard
        label="Hygieneplane"
        value={hygienePlanCount}
        icon={ShieldCheck}
        className="min-w-[140px] flex-1"
        {...statCardColors.amber}
      />
      <StatCard
        label="CIRS"
        value={cirsCount}
        icon={ShieldAlert}
        className="min-w-[140px] flex-1"
        {...statCardColors.red}
      />
      <StatCard
        label="Gesamt"
        value={totalCount}
        icon={BookOpen}
        className="min-w-[140px] flex-1"
        {...statCardColors.purple}
      />
    </div>
  )
})
