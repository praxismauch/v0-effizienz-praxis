"use client"

import { Globe, Building2, Copy, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Practice } from "./types"

interface ScopeSelectorProps {
  selectedPractice: string
  practices: Practice[]
  selectedPracticeName?: string
  onPracticeChange: (value: string) => void
  onCopyGlobal: () => void
  onResetAll: () => void
}

export function ScopeSelector({
  selectedPractice,
  practices,
  selectedPracticeName,
  onPracticeChange,
  onCopyGlobal,
  onResetAll,
}: ScopeSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Einstellungsbereich</CardTitle>
        <CardDescription>{"Wahlen Sie, ob Sie globale oder praxis-spezifische Einstellungen bearbeiten"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedPractice} onValueChange={onPracticeChange}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Bereich auswahlen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-green-500" />
                  <span>Global (alle Praxen)</span>
                </div>
              </SelectItem>
              {practices.map((practice) => (
                <SelectItem key={practice.id} value={practice.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <span>{practice.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPractice !== "global" && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onCopyGlobal}>
                      <Copy className="h-4 w-4 mr-2" />
                      {"Globale kopieren"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{"Aktuelle globale Einstellungen fur diese Praxis ubernehmen"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onResetAll}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {"Alle zurucksetzen"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{"Alle praxis-spezifischen Einstellungen entfernen"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
