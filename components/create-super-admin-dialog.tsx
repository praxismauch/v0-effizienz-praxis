"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@/contexts/user-context"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateSuperAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSuperAdminDialog({ open, onOpenChange }: CreateSuperAdminDialogProps) {
  const { createSuperAdmin } = useUser()
  const { practices } = usePractice()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    defaultPracticeId: "none" as string,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      createSuperAdmin({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: "superadmin",
        practiceId: null,
        isActive: true,
        defaultPracticeId: formData.defaultPracticeId === "none" ? null : formData.defaultPracticeId,
      })

      // Reset form and close dialog
      setFormData({ name: "", email: "", defaultPracticeId: "none" })
      onOpenChange(false)

      alert(`Super admin "${formData.name}" has been created successfully!`)
    } catch (error) {
      console.error("Error creating super admin:", error)
      alert("Failed to create super admin. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ name: "", email: "", defaultPracticeId: "none" })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Create Super Administrator
          </DialogTitle>
          <DialogDescription>
            Create a new system administrator with full access to all practices and settings.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Super administrators have unrestricted access to all system functions, practices, and user data. Only create
            super admin accounts for trusted personnel.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPractice">Standard-Praxis (Optional)</Label>
            <Select
              value={formData.defaultPracticeId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultPracticeId: value }))}
            >
              <SelectTrigger id="defaultPractice">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Super Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSuperAdminDialog
