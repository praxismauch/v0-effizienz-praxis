"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Palette } from "lucide-react"

const RECOMMENDED_COLORS = [
  { name: "Blau", value: "#3b82f6" },
  { name: "Grün", value: "#22c55e" },
  { name: "Rot", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Gelb", value: "#eab308" },
  { name: "Lila", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Türkis", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Smaragd", value: "#10b981" },
  { name: "Limette", value: "#84cc16" },
  { name: "Bernstein", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Violett", value: "#8b5cf6" },
  { name: "Fuchsia", value: "#d946ef" },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  id?: string
}

export function ColorPicker({ value, onChange, label, id }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value)
  const [showCustom, setShowCustom] = useState(false)

  const handleColorSelect = (color: string) => {
    onChange(color)
    setCustomColor(color)
    setShowCustom(false)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    onChange(color)
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
            <div className="flex items-center gap-2 w-full">
              <div className="h-5 w-5 rounded border border-input" style={{ backgroundColor: value }} />
              <span className="flex-1">{value.toUpperCase()}</span>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          {!showCustom ? (
            <>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Empfohlene Farben</h4>
                <div className="grid grid-cols-4 gap-2">
                  {RECOMMENDED_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="relative h-10 w-full rounded border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: color.value,
                        borderColor: value === color.value ? "#000" : "transparent",
                      }}
                      onClick={() => handleColorSelect(color.value)}
                      title={color.name}
                    >
                      {value === color.value && (
                        <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full mt-3 bg-transparent" onClick={() => setShowCustom(true)}>
                <Palette className="mr-2 h-4 w-4" />
                Benutzerdefinierte Farbe
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Benutzerdefinierte Farbe</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowCustom(false)}>
                  Zurück
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 font-mono"
                  />
                </div>
                <div className="w-full h-12 rounded border" style={{ backgroundColor: customColor }} />
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ColorPicker
