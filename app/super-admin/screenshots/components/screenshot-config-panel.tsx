"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Play, RefreshCw, Monitor, Smartphone, Tablet, Square } from "lucide-react"
import { type ScreenshotConfig } from "../screenshot-types"

interface ScreenshotConfigPanelProps {
  config: ScreenshotConfig
  onConfigChange: (config: ScreenshotConfig) => void
  selectedViewports: Set<"desktop" | "tablet" | "mobile">
  onToggleViewport: (viewport: "desktop" | "tablet" | "mobile") => void
  customPages: string
  onCustomPagesChange: (value: string) => void
  isRunning: boolean
  progress: number
  totalScreenshots: number
  onStart: () => void
  onStop: () => void
}

export function ScreenshotConfigPanel({
  config,
  onConfigChange,
  selectedViewports,
  onToggleViewport,
  customPages,
  onCustomPagesChange,
  isRunning,
  progress,
  totalScreenshots,
  onStart,
  onStop,
}: ScreenshotConfigPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Neuer Lauf</CardTitle>
        <CardDescription>Einstellungen und Start</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input
            value={config.baseUrl}
            onChange={(e) => onConfigChange({ ...config, baseUrl: e.target.value })}
            placeholder="https://example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Viewports</Label>
          <div className="flex gap-2">
            <Button
              variant={selectedViewports.has("desktop") ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleViewport("desktop")}
              className="flex-1"
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={selectedViewports.has("tablet") ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleViewport("tablet")}
              className="flex-1"
            >
              <Tablet className="h-4 w-4 mr-1" />
              Tablet
            </Button>
            <Button
              variant={selectedViewports.has("mobile") ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleViewport("mobile")}
              className="flex-1"
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{"Zusaetzliche Seiten (eine pro Zeile)"}</Label>
          <textarea
            value={customPages}
            onChange={(e) => onCustomPagesChange(e.target.value)}
            placeholder={"/custom-page\n/another-page"}
            className="w-full h-20 px-3 py-2 text-sm rounded-md border bg-background resize-none"
          />
        </div>

        {isRunning ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button disabled className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Erfasse... ({Math.round(progress)}%)
              </Button>
              <Button
                variant="destructive"
                onClick={onStop}
                className="shrink-0"
              >
                <Square className="h-4 w-4 mr-1" />
                Stopp
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : (
          <Button onClick={onStart} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Lauf starten ({totalScreenshots} Screenshots)
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
