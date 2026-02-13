"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { WeeklySummarySettings } from "./types"
import { CONTENT_SECTIONS } from "./types"

interface ContentTabProps {
  settings: WeeklySummarySettings
  onUpdate: (key: keyof WeeklySummarySettings, value: any) => void
}

export function ContentTab({ settings, onUpdate }: ContentTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enthaltene Bereiche</CardTitle>
          <CardDescription>
            Wählen Sie, welche Informationen in der Zusammenfassung enthalten sein sollen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {CONTENT_SECTIONS.map((section) => {
              const Icon = section.icon
              const isEnabled = settings[section.key as keyof WeeklySummarySettings] as boolean

              return (
                <div
                  key={section.key}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isEnabled ? "border-primary/50 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{section.label}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      onUpdate(section.key as keyof WeeklySummarySettings, checked)
                    }
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
