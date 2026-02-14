"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { EyeOff } from "lucide-react"
import type { TemplateFormData, OrgaCategory } from "./types"

interface BasicInfoCardProps {
  formData: TemplateFormData
  onChange: (data: TemplateFormData) => void
  errors: Record<string, string>
  orgaCategories: OrgaCategory[]
  loadingCategories: boolean
}

export function BasicInfoCard({ formData, onChange, errors, orgaCategories, loadingCategories }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Grundinformationen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onChange({ ...formData, title: e.target.value })}
            placeholder="Vorlagen-Titel eingeben..."
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
            placeholder="Beschreibung der Vorlage (optional)..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value: string) => onChange({ ...formData, category: value })}
              disabled={loadingCategories}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingCategories ? "Kategorien werden geladen..." : "Kategorie wählen..."}
                />
              </SelectTrigger>
              <SelectContent>
                {orgaCategories.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine Kategorien verfügbar</div>
                ) : (
                  orgaCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sichtbarkeit</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => onChange({ ...formData, isPublic: !!checked })}
              />
              <Label htmlFor="isPublic" className="text-sm">
                Öffentliche Vorlage (für alle Praxen verfügbar)
              </Label>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="hideItems" className="font-medium">
                  Aufgaben nur für zugewiesene Benutzer sichtbar
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Wenn aktiviert, sehen Benutzer nur die Aufgaben, die ihnen zugewiesen sind. Praxis-Administratoren
                und Power User sehen weiterhin alle Aufgaben.
              </p>
            </div>
            <Switch
              id="hideItems"
              checked={formData.hideItemsFromOtherUsers}
              onCheckedChange={(checked) => onChange({ ...formData, hideItemsFromOtherUsers: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
