"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { availablePermissions, type TeamEditFormData } from "./constants"

interface PermissionsTabProps {
  formData: TeamEditFormData
  onPermissionChange: (permissionId: string, checked: boolean) => void
}

export function PermissionsTab({ formData, onPermissionChange }: PermissionsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">Berechtigungen</CardTitle>
        <CardDescription>Spezifische Berechtigungen fur dieses Teammitglied anpassen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availablePermissions.map((permission) => {
          const isChecked =
            formData.permissions.includes(permission.id) || formData.permissions.includes("all")
          const isDisabled = formData.permissions.includes("all") && permission.id !== "all"

          return (
            <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={permission.id}
                checked={isChecked}
                disabled={isDisabled}
                onCheckedChange={(checked) => onPermissionChange(permission.id, checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor={permission.id} className="font-medium">
                  {permission.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
