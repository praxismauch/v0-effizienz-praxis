"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser, type User } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditSuperAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  superAdmin: User | null
}

export function EditSuperAdminDialog({ open, onOpenChange, superAdmin }: EditSuperAdminDialogProps) {
  const { updateSuperAdmin, currentUser } = useUser()
  const { practices } = usePractice()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isActive: true,
    defaultPracticeId: "" as string,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (superAdmin) {
      setFormData({
        name: superAdmin.name,
        email: superAdmin.email,
        isActive: superAdmin.isActive,
        defaultPracticeId: superAdmin.defaultPracticeId || "none",
      })
    }
  }, [superAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!superAdmin) return

    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please fill in all required fields")
      return
    }

    if (!formData.email.includes("@")) {
      alert("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      updateSuperAdmin(superAdmin.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        isActive: formData.isActive,
        defaultPracticeId: formData.defaultPracticeId === "none" ? null : formData.defaultPracticeId,
      })

      onOpenChange(false)
      alert(`Super admin "${formData.name}" has been updated successfully!`)
    } catch (error) {
      console.error("Error updating super admin:", error)
      alert("Failed to update super admin. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (superAdmin) {
      setFormData({
        name: superAdmin.name,
        email: superAdmin.email,
        isActive: superAdmin.isActive,
        defaultPracticeId: superAdmin.defaultPracticeId || "none",
      })
    }
    onOpenChange(false)
  }

  const isCurrentUser = currentUser?.id === superAdmin?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Edit Super Administrator
          </DialogTitle>
          <DialogDescription>Update super administrator details and permissions.</DialogDescription>
        </DialogHeader>

        {isCurrentUser && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are editing your own account. Be careful when changing your status or permissions.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email Address *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-defaultPractice">Standard-Praxis (Optional)</Label>
            <Select
              value={formData.defaultPracticeId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultPracticeId: value }))}
            >
              <SelectTrigger id="edit-defaultPractice">
                <SelectValue placeholder="Keine Standard-Praxis (manuell auswählen)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Standard-Praxis</SelectItem>
                {practices.map((practice) => (
                  <SelectItem key={practice.id} value={practice.id}>
                    {practice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Diese Praxis wird automatisch beim Login ausgewählt</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edit-active">Account Status</Label>
              <div className="text-sm text-muted-foreground">
                {formData.isActive ? "Account is active" : "Account is inactive"}
              </div>
            </div>
            <Switch
              id="edit-active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
              disabled={isCurrentUser} // Prevent users from deactivating themselves
            />
          </div>

          {isCurrentUser && !formData.isActive && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>You cannot deactivate your own account while logged in.</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Super Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditSuperAdminDialog
