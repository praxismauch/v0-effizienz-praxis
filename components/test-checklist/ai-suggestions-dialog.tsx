"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { TestingCategory } from "./types"

interface AiSuggestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: any[]
  categories: TestingCategory[]
  onAddSuggestions: (suggestions: any[]) => Promise<boolean>
}

export function AiSuggestionsDialog({
  open,
  onOpenChange,
  suggestions,
  categories,
  onAddSuggestions,
}: AiSuggestionsDialogProps) {
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set(suggestions.map((_, i) => i)),
  )

  const handleAdd = async () => {
    const toAdd = suggestions.filter((_, index) => selectedSuggestions.has(index))
    const success = await onAddSuggestions(toAdd)
    if (success) {
      onOpenChange(false)
      setSelectedSuggestions(new Set())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>KI-Vorschläge für Test-Items</DialogTitle>
          <DialogDescription>
            Wählen Sie die Test-Items aus, die Sie zu Ihren Vorlagen hinzufügen möchten
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => {
            const category = categories.find((c) => c.id === suggestion.category_id)
            return (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedSuggestions.has(index)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedSuggestions)
                      if (checked) {
                        newSelected.add(index)
                      } else {
                        newSelected.delete(index)
                      }
                      setSelectedSuggestions(newSelected)
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      {category && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                            borderColor: category.color,
                          }}
                        >
                          {category.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleAdd} disabled={selectedSuggestions.size === 0}>
            {selectedSuggestions.size} Vorlage(n) hinzufügen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
