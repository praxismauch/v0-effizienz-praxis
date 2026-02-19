"use client"

import { Button } from "@/components/ui/button"
import { X, Plus, Minus } from "lucide-react"
import { WIDGET_DEFINITIONS } from "@/components/dashboard/editor-constants"

interface WidgetLibraryProps {
  enabledWidgets: Record<string, boolean>
  onToggleWidget: (id: string) => void
  onAddLinebreak: () => void
}

export function WidgetLibrary({ enabledWidgets, onToggleWidget, onAddLinebreak }: WidgetLibraryProps) {
  const disabledWidgets = WIDGET_DEFINITIONS.filter((w) => !enabledWidgets[w.id])
  const activeWidgets = WIDGET_DEFINITIONS.filter((w) => enabledWidgets[w.id])

  return (
    <div className="space-y-6">
      {disabledWidgets.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Verfügbare Widgets
          </h4>
          <div className="space-y-2">
            {disabledWidgets.map((widget) => {
              const Icon = widget.icon
              return (
                <button
                  key={widget.id}
                  type="button"
                  onClick={() => onToggleWidget(widget.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{widget.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
                  </div>
                  <Plus className="h-4 w-4 text-primary shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
          Aktive Widgets
        </h4>
        <div className="space-y-2">
          {activeWidgets.map((widget) => {
            const Icon = widget.icon
            return (
              <div
                key={widget.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{widget.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => onToggleWidget(widget.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <Button variant="outline" className="w-full gap-2" onClick={onAddLinebreak}>
        <Minus className="h-4 w-4" />
        Trennlinie hinzufügen
      </Button>
    </div>
  )
}
