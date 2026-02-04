"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCcw, Save } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AnnualDiscountSettingsProps {
  annualDiscountPercentage: number
  onDiscountChange: (value: number) => void
  onSave: () => Promise<void>
  onRefresh: () => void
}

export function AnnualDiscountSettings({
  annualDiscountPercentage,
  onDiscountChange,
  onSave,
  onRefresh,
}: AnnualDiscountSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jahresrabatt-Einstellungen</CardTitle>
        <CardDescription>
          Konfigurieren Sie den globalen Rabatt für jährliche Abonnements. Jahrespreise werden automatisch
          berechnet: Monatspreis x 12 x (1 - Rabatt%)
        </CardDescription>
        <div className="absolute top-4 right-4">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="annual-discount">Jahresrabatt (%)</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="annual-discount"
                type="number"
                min="0"
                max="100"
                step="1"
                value={annualDiscountPercentage}
                onChange={(e) => onDiscountChange(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button onClick={onSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aktueller Rabatt: {annualDiscountPercentage}% - Beispiel: 99€/Monat wird zu{" "}
              {(99 * 12 * (1 - annualDiscountPercentage / 100)).toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              €/Jahr
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
