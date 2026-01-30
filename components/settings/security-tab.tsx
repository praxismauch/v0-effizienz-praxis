"use client"

import React, { useState } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Key, Loader2, Save, Shield } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"

interface PasswordSettings {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function SecurityTab() {
  const { currentUser } = useUser()
  const [passwordSettings, setPasswordSettings] = useState<PasswordSettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [saving, setSaving] = useState(false)
  
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "practice_owner"

  const handleChangePassword = async () => {
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein")
      return
    }
    
    if (passwordSettings.newPassword.length < 8) {
      toast.error("Das Passwort muss mindestens 8 Zeichen lang sein")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordSettings.currentPassword,
          newPassword: passwordSettings.newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Passwort erfolgreich geändert")
        setPasswordSettings({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const data = await response.json()
        toast.error(data.error || "Fehler beim Ändern des Passworts")
      }
    } catch (error) {
      toast.error("Fehler beim Ändern des Passworts")
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Passwort ändern
          </CardTitle>
          <CardDescription>Aktualisieren Sie Ihr Passwort für mehr Sicherheit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Aktuelles Passwort</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordSettings.currentPassword}
              onChange={(e) => setPasswordSettings({ ...passwordSettings, currentPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordSettings.newPassword}
              onChange={(e) => setPasswordSettings({ ...passwordSettings, newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Passwort bestätigen</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordSettings.confirmPassword}
              onChange={(e) => setPasswordSettings({ ...passwordSettings, confirmPassword: e.target.value })}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={!passwordSettings.currentPassword || !passwordSettings.newPassword || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichert...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Passwort ändern
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
