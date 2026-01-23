"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Key, Loader2, Save, Shield } from "lucide-react"

interface PasswordSettings {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface SecurityTabProps {
  passwordSettings: PasswordSettings
  onPasswordChange: (settings: PasswordSettings) => void
  onChangePassword: () => void
  saving: boolean
  isAdmin: boolean
  children?: React.ReactNode // For admin-only sections
}

export function SecurityTab({
  passwordSettings,
  onPasswordChange,
  onChangePassword,
  saving,
  isAdmin,
  children,
}: SecurityTabProps) {
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
              onChange={(e) => onPasswordChange({ ...passwordSettings, currentPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Neues Passwort</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordSettings.newPassword}
              onChange={(e) => onPasswordChange({ ...passwordSettings, newPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Passwort bestätigen</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordSettings.confirmPassword}
              onChange={(e) => onPasswordChange({ ...passwordSettings, confirmPassword: e.target.value })}
            />
          </div>
          <Button
            onClick={onChangePassword}
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

      {isAdmin && children}
    </div>
  )
}
