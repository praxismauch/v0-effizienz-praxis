"use client"

import { useState } from "react"
import { Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NettoBruttoCalculatorProps {
  onApply: (bruttoValue: number) => void
  vatRate?: number
}

export function NettoBruttoCalculator({ onApply, vatRate = 19 }: NettoBruttoCalculatorProps) {
  const [nettoValue, setNettoValue] = useState("")
  const [open, setOpen] = useState(false)

  const netto = Number.parseFloat(nettoValue) || 0
  const vat = netto * (vatRate / 100)
  const brutto = netto + vat

  const handleApply = () => {
    if (netto > 0) {
      onApply(Math.round(brutto * 100) / 100)
      setNettoValue("")
      setOpen(false)
    }
  }

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Netto → Brutto Rechner ({vatRate}% MwSt.)</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="netto-input">Netto-Betrag (€)</Label>
              <Input
                id="netto-input"
                type="number"
                step="0.01"
                min="0"
                value={nettoValue}
                onChange={(e) => setNettoValue(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Netto:</span>
                <span>{netto.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ {vatRate}% MwSt.:</span>
                <span>{vat.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Brutto:</span>
                <span>{brutto.toFixed(2)} €</span>
              </div>
            </div>

            <Button type="button" onClick={handleApply} className="w-full" disabled={netto <= 0}>
              Übernehmen
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}

export default NettoBruttoCalculator
