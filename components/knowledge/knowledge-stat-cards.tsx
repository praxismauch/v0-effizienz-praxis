"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { FileText, Cpu, Package, Wrench, BookOpen } from "lucide-react"

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
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{articleCount}</p>
            <p className="text-sm text-muted-foreground">Artikel</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Cpu className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{deviceCount}</p>
            <p className="text-sm text-muted-foreground">Geräte</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{materialCount}</p>
            <p className="text-sm text-muted-foreground">Material</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Wrench className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{equipmentCount}</p>
            <p className="text-sm text-muted-foreground">Arbeitsmittel</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-sm text-muted-foreground">Gesamt</p>
          </div>
        </div>
      </Card>
    </div>
  )
})
