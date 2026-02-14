"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { ChecklistItem } from "./types"

interface ChecklistExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: ChecklistItem[]
  onToggleItem: (itemId: string, isCompleted: boolean) => void
  onUpdateNotes: (itemId: string, notes: string) => void
}

export function ChecklistExecutionDialog({
  open,
  onOpenChange,
  items,
  onToggleItem,
  onUpdateNotes,
}: ChecklistExecutionDialogProps) {
  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const categoryName = item.testing_categories?.name || "Ohne Kategorie"
        if (!acc[categoryName]) acc[categoryName] = []
        acc[categoryName].push(item)
        return acc
      },
      {} as Record<string, ChecklistItem[]>,
    )
  }, [items])

  const completionPercentage = items.length
    ? Math.round((items.filter((i) => i.is_completed).length / items.length) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test-Checkliste durchführen</DialogTitle>
          <DialogDescription>Fortschritt: {completionPercentage}% abgeschlossen</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedItems).map(([categoryName, catItems]) => (
            <div key={categoryName} className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {catItems[0]?.testing_categories && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: catItems[0].testing_categories.color }}
                  />
                )}
                {categoryName}
              </h3>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => onToggleItem(item.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className={`font-medium ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <Textarea
                        placeholder="Notizen hinzufügen..."
                        value={item.notes || ""}
                        onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
