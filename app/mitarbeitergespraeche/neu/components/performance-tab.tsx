"use client"

import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import type { PerformanceArea } from "../types"

interface PerformanceTabProps {
  performanceAreas: PerformanceArea[]
  onUpdate: (areas: PerformanceArea[]) => void
}

export function PerformanceTab({ performanceAreas, onUpdate }: PerformanceTabProps) {
  const handleRatingChange = (index: number, value: number) => {
    const newAreas = [...performanceAreas]
    newAreas[index] = { ...newAreas[index], rating: value }
    onUpdate(newAreas)
  }

  return (
    <div className="grid gap-4">
      {performanceAreas.map((area, index) => (
        <div key={area.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium">{area.name}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gewichtung: {area.weight}%</span>
              <Badge variant="outline">{area.rating}/5</Badge>
            </div>
          </div>
          <Slider
            value={[area.rating]}
            min={1}
            max={5}
            step={0.5}
            onValueChange={([value]) => handleRatingChange(index, value)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Entwicklungsbedarf</span>
            <span>Herausragend</span>
          </div>
        </div>
      ))}
    </div>
  )
}
