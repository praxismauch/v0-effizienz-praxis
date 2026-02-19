"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { MONTHS, YEARS, CURRENT_YEAR } from "./report-types"

interface GenerateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string | number | undefined
  teamMembers: Array<{ id: string; name: string }>
  onSuccess: () => void
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  practiceId,
  teamMembers,
  onSuccess,
}: GenerateReportDialogProps) {
  const [generateUserId, setGenerateUserId] = useState("")
  const [generateYear, setGenerateYear] = useState(CURRENT_YEAR.toString())
  const [generateMonth, setGenerateMonth] = useState((new Date().getMonth() + 1).toString())
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async () => {
    if (!generateUserId || !generateYear || !generateMonth) {
      toast.error("Bitte alle Felder ausfüllen")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/zeiterfassung/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: generateUserId,
          year: Number.parseInt(generateYear),
          month: Number.parseInt(generateMonth),
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error("Fehler beim Generieren des Reports", { description: data.error })
        return
      }

      toast.success("Report erfolgreich generiert")
      onOpenChange(false)
      setGenerateUserId("")
      onSuccess()
    } catch (error) {
      console.error("Generate report error:", error)
      toast.error("Fehler beim Generieren des Reports")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuen Report generieren</DialogTitle>
          <DialogDescription>
            Erstellen Sie einen monatlichen Zeiterfassungs-Report für einen Mitarbeiter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mitarbeiter</label>
            <Select value={generateUserId} onValueChange={setGenerateUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <TeamMemberSelectItem
                    key={member.id}
                    value={member.id}
                    name={member.name}
                    avatarUrl={(member as any).avatar_url}
                  />
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jahr</label>
              <Select value={generateYear} onValueChange={setGenerateYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monat</label>
              <Select value={generateMonth} onValueChange={setGenerateMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Abbrechen
          </Button>
          <Button onClick={handleGenerateReport} disabled={isGenerating || !generateUserId}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Generieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
