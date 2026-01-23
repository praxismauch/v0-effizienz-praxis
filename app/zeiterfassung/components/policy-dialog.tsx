"use client"

import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { HomeofficePolicy } from "../types"

interface PolicyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  homeofficePolicy: HomeofficePolicy | null
}

const WEEKDAY_LABELS: Record<string, string> = {
  monday: "Mo",
  tuesday: "Di",
  wednesday: "Mi",
  thursday: "Do",
  friday: "Fr",
  saturday: "Sa",
  sunday: "So",
}

export default function PolicyDialog({ open, onOpenChange, homeofficePolicy }: PolicyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ihre Homeoffice-Regelung</DialogTitle>
          <DialogDescription>Details zu Ihrer persönlichen Homeoffice-Policy</DialogDescription>
        </DialogHeader>

        {homeofficePolicy ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={homeofficePolicy.is_allowed ? "default" : "secondary"}>
                  {homeofficePolicy.is_allowed ? "Erlaubt" : "Nicht erlaubt"}
                </Badge>
              </div>
            </div>

            {homeofficePolicy.is_allowed && (
              <>
                {homeofficePolicy.allowed_days && homeofficePolicy.allowed_days.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Erlaubte Tage</span>
                    <div className="flex flex-wrap gap-2">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                        <Badge
                          key={day}
                          variant={homeofficePolicy.allowed_days?.includes(day) ? "default" : "outline"}
                          className="text-xs"
                        >
                          {WEEKDAY_LABELS[day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-sm font-medium">Maximale Tage pro Woche</span>
                  <div className="text-2xl font-bold text-primary">{homeofficePolicy.max_days_per_week || 0}</div>
                </div>

                {(homeofficePolicy.allowed_start_time || homeofficePolicy.allowed_end_time) && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Zeitfenster</span>
                    <div className="text-sm text-muted-foreground">
                      {homeofficePolicy.allowed_start_time || "00:00"} -{" "}
                      {homeofficePolicy.allowed_end_time || "23:59"} Uhr
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t space-y-2">
                  {homeofficePolicy.requires_reason && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Begründung erforderlich</span>
                    </div>
                  )}
                  {homeofficePolicy.requires_location_verification && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Standort-Verifizierung erforderlich</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {!homeofficePolicy.is_allowed && (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                Homeoffice ist für Sie derzeit nicht freigegeben. Bitte wenden Sie sich an Ihren Administrator, wenn
                Sie Fragen haben.
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center p-8">Keine Homeoffice-Regelung gefunden.</div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Schließen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
