"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/contexts/translation-context"
import type { AnalyticsItem, AnalyticsTab } from "./types"
import { categoryLabels, categoryColors } from "./types"

interface ManageTabItemsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTabId: string | null
  tabs: AnalyticsTab[]
  items: AnalyticsItem[]
  onToggleItem: (itemId: string, assign: boolean) => void
  onClose: () => void
}

export function ManageTabItemsDialog({
  open,
  onOpenChange,
  selectedTabId,
  tabs,
  items,
  onToggleItem,
  onClose,
}: ManageTabItemsDialogProps) {
  const { t } = useTranslation()
  const selectedTab = tabs.find((tab) => tab.id === selectedTabId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("analytics.customizer.manageTabItems", "Elemente für Tab verwalten")}: {selectedTab?.name}
          </DialogTitle>
          <DialogDescription>
            {t("analytics.customizer.manageTabItemsDescription", "Wählen Sie die Elemente aus, die in diesem Tab angezeigt werden sollen")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {items.map((item) => {
            const isAssigned = item.tabIds?.includes(selectedTabId || "") || false
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAssigned}
                    onCheckedChange={(checked) => onToggleItem(item.id, !!checked)}
                  />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Badge className={categoryColors[item.category]}>
                  {categoryLabels[item.category]}
                </Badge>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>
            {t("common.done", "Fertig")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
