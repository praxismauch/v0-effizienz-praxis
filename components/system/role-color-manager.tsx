"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save, Palette } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { RoleColor } from "@/lib/use-role-colors"
import { Textarea } from "@/components/ui/textarea"

const PRESET_COLORS = [
  "bg-blue-100 text-blue-800 hover:bg-blue-100",
  "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  "bg-purple-100 text-purple-800 hover:bg-purple-100",
  "bg-pink-100 text-pink-800 hover:bg-pink-100",
  "bg-amber-100 text-amber-800 hover:bg-amber-100",
  "bg-red-100 text-red-800 hover:bg-red-100",
  "bg-indigo-100 text-indigo-800 hover:bg-indigo-100",
  "bg-teal-100 text-teal-800 hover:bg-teal-100",
  "bg-cyan-100 text-cyan-800 hover:bg-cyan-100",
  "bg-lime-100 text-lime-800 hover:bg-lime-100",
  "bg-orange-100 text-orange-800 hover:bg-orange-100",
  "bg-rose-100 text-rose-800 hover:bg-rose-100",
  "bg-violet-100 text-violet-800 hover:bg-violet-100",
  "bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-100",
  "bg-sky-100 text-sky-800 hover:bg-sky-100",
  "bg-gray-100 text-gray-800 hover:bg-gray-100",
]

export function RoleColorManager() {
  const [roleColors, setRoleColors] = useState<RoleColor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchRoleColors()
  }, [])

  const fetchRoleColors = async () => {
    try {
      const response = await fetch("/api/system/role-colors")

      if (!response.ok) {
        console.error(`[v0] Failed to fetch role colors: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.error(`[v0] Response body:`, text)
        toast({
          title: "Fehler",
          description: "Rollenfarben konnten nicht geladen werden",
          variant: "destructive",
        })
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error(`[v0] Non-JSON response from role colors API:`, text)
        toast({
          title: "Fehler",
          description: "Ungültige Antwort vom Server",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      setRoleColors(data)
    } catch (error) {
      console.error("[v0] Failed to fetch role colors:", error)
      toast({
        title: "Fehler",
        description: "Rollenfarben konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateColor = async (role: string, updates: Partial<RoleColor>) => {
    setIsSaving(true)
    try {
      const roleData = roleColors.find((rc) => rc.role === role)
      if (!roleData) {
        console.log("[v0] Role not found in local state:", role)
        throw new Error("Role not found")
      }

      console.log("[v0] Updating role color:", { role, updates })

      const response = await fetch("/api/system/role-colors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          color: updates.color ?? roleData.color,
          label: updates.label ?? roleData.label,
          description: updates.description ?? roleData.description,
        }),
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorData
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json()
        } else {
          const text = await response.text()
          errorData = { error: text }
        }
        console.error("[v0] Failed to update role color:", errorData)
        throw new Error(errorData.details || errorData.error || "Failed to update")
      }

      console.log("[v0] Role color updated successfully")
      await fetchRoleColors()
      toast({
        title: "Gespeichert",
        description: "Rollenfarbe wurde aktualisiert",
      })
    } catch (error: any) {
      console.error("[v0] Failed to update role color:", error)
      toast({
        title: "Fehler",
        description: error?.message || "Rollenfarbe konnte nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleColorChange = (role: string, field: keyof RoleColor, value: string) => {
    setRoleColors((prev) => prev.map((rc) => (rc.role === role ? { ...rc, [field]: value } : rc)))
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rollenfarben</CardTitle>
          <CardDescription>Lädt...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Rollenfarben</CardTitle>
        </div>
        <CardDescription>
          Definieren Sie Farben für jede Systemrolle. Diese werden im gesamten System verwendet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {roleColors.map((roleColor) => (
          <div key={roleColor.role} className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{roleColor.label}</h3>
                <p className="text-sm text-muted-foreground">{roleColor.description}</p>
              </div>
              <Badge className={roleColor.color}>{roleColor.label}</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor={`${roleColor.role}-label`}>Anzeigename</Label>
                <Input
                  id={`${roleColor.role}-label`}
                  value={roleColor.label}
                  onChange={(e) => handleColorChange(roleColor.role, "label", e.target.value)}
                  placeholder="z.B. Praxis Admin"
                />
              </div>

              <div>
                <Label htmlFor={`${roleColor.role}-description`}>Beschreibung</Label>
                <Textarea
                  id={`${roleColor.role}-description`}
                  value={roleColor.description || ""}
                  onChange={(e) => handleColorChange(roleColor.role, "description", e.target.value)}
                  placeholder="Beschreibung der Rolle"
                  rows={2}
                />
              </div>

              <div>
                <Label>Farbe</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(roleColor.role, "color", color)}
                      className={`h-10 rounded-md border-2 transition-all ${color} ${
                        roleColor.color === color ? "ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                      }`}
                      title={color}
                    />
                  ))}
                </div>
                <Input
                  className="mt-2"
                  value={roleColor.color}
                  onChange={(e) => handleColorChange(roleColor.role, "color", e.target.value)}
                  placeholder="z.B. bg-blue-100 text-blue-800 hover:bg-blue-100"
                />
              </div>

              <Button
                onClick={() =>
                  handleUpdateColor(roleColor.role, {
                    color: roleColor.color,
                    label: roleColor.label,
                    description: roleColor.description,
                  })
                }
                disabled={isSaving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
