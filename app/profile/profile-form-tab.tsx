"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Loader2, Save } from "lucide-react"

interface ProfileFormTabProps {
  formData: {
    name: string
    email: string
    avatar: string
    preferred_language: string
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string
    email: string
    avatar: string
    preferred_language: string
  }>>
  onSave: () => void
  isLoading: boolean
}

export function ProfileFormTab({ formData, setFormData, onSave, isLoading }: ProfileFormTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personliche Informationen
        </CardTitle>
        <CardDescription>Aktualisieren Sie Ihre grundlegenden Profilinformationen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vollstandiger Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ihr Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="ihre@email.de"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="language">Bevorzugte Sprache</Label>
          <Select
            value={formData.preferred_language}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, preferred_language: value }))}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichere...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Anderungen speichern
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
