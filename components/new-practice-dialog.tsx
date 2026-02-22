"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { AddressInput } from "@/components/address-input"
import { toast } from "@/hooks/use-toast"
import { Loader2, X, ChevronsUpDown } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"

const PRACTICE_TYPES = [
  "Allgemeinmedizin",
  "Innere Medizin",
  "Chirurgie",
  "Paediatrie",
  "Gynaekologie",
  "Orthopaed", 
  "Neurologie",
  "Psychiatrie",
  "Dermatologie",
  "Urologie",
  "HNO",
  "Augenheilkunde",
  "Radiologie",
  "Anaesthesiologie",
  "Kardiologie",
  "Gastroenterologie",
  "Nephrologie",
  "Endokrinologie",
  "Rheumatologie",
  "Onkologie",
  "Geriatrie",
  "Palliativmedizin",
]

interface CreatePracticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreatePracticeDialog({ open, onOpenChange, onSuccess }: CreatePracticeDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [typesOpen, setTypesOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    types: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.address) {
      toast({ title: "Fehler", description: "Bitte füllen Sie alle Pflichtfelder aus", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialty: formData.types.join(", "),
        }),
      })

      if (!response.ok) throw new Error("Failed to create practice")

      toast({ title: "Erfolg", description: "Praxis erfolgreich erstellt" })
      onOpenChange(false)
      setFormData({ name: "", type: "", address: "", phone: "", email: "", website: "", types: [] })
      if (onSuccess) onSuccess()
    } catch (error) {
      toast({ title: "Fehler", description: "Praxis konnte nicht erstellt werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Praxis erstellen</DialogTitle>
          <DialogDescription>Erstellen Sie eine neue Praxis in Ihrer Organisation</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Praxisname *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Hausarztpraxis Dr. Müller"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Praxisart</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Praxisart waehlen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einzelpraxis">Einzelpraxis</SelectItem>
                <SelectItem value="bag">Berufsausuebungsgemeinschaft (BAG)</SelectItem>
                <SelectItem value="mvz">Medizinisches Versorgungszentrum (MVZ)</SelectItem>
                <SelectItem value="praxisgemeinschaft">Praxisgemeinschaft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fachrichtungen</Label>
            <Popover open={typesOpen} onOpenChange={setTypesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal h-auto min-h-10"
                >
                  {formData.types.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {formData.types.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                          <button
                            type="button"
                            className="ml-1 rounded-full hover:bg-destructive/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFormData({ ...formData, types: formData.types.filter((t) => t !== type) })
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Fachrichtungen waehlen...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start">
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {PRACTICE_TYPES.map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={formData.types.includes(type)}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            types: checked
                              ? [...formData.types, type]
                              : formData.types.filter((t) => t !== type),
                          })
                        }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <AddressInput
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              placeholder="Straße, Hausnummer, PLZ Stadt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="praxis@beispiel.de"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.beispiel.de"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !formData.name || !formData.address}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Praxis erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
