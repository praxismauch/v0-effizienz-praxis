"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Package, Plus, Calendar, FileSignature, CheckCircle2, XCircle, Edit, Trash2, PenTool } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { useTeamMemberArbeitsmittel } from "@/hooks/use-team-data"
import useSWR from "swr"

interface ArbeitsmittelAssignment {
  id: string
  arbeitsmittel_id: string
  arbeitsmittel: {
    name: string
    category: string
    serial_number?: string
  }
  given_date: string
  expected_return_date?: string
  actual_return_date?: string
  description?: string
  signature_data?: string
  signed_at?: string
  status: "ausgegeben" | "zurückgegeben"
  notes?: string
}

interface ArbeitsmittelAssignmentsProps {
  teamMemberId: string
  practiceId: string
}

export function ArbeitsmittelAssignments({ teamMemberId, practiceId }: ArbeitsmittelAssignmentsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { assignments, isLoading, mutate } = useTeamMemberArbeitsmittel(practiceId, teamMemberId)
  
  // Fetch available arbeitsmittel
  const { data: availableArbeitsmittel = [] } = useSWR(
    practiceId ? `/api/practices/${practiceId}/arbeitsmittel` : null,
    (url) => fetch(url).then(r => r.json())
  )
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<ArbeitsmittelAssignment | null>(null)
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [currentAssignmentToSign, setCurrentAssignmentToSign] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const handleSubmit = async () => {
    if (!formData.arbeitsmittel_id || !formData.given_date) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      })
      return
    }

    try {
      const payload = {
        ...formData,
        expected_return_date: formData.expected_return_date || null,
        status: "ausgegeben",
      }

      if (editingAssignment) {
        const response = await fetch(
          `/api/practices/${practiceId}/team-members/${teamMemberId}/arbeitsmittel/${editingAssignment.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        )
        if (!response.ok) throw new Error("Failed to update assignment")
      } else {
        const response = await fetch(`/api/practices/${practiceId}/team-members/${teamMemberId}/arbeitsmittel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error("Failed to create assignment")
      }

      toast({
        title: "Erfolgreich",
        description: editingAssignment ? "Zuweisung wurde aktualisiert." : "Arbeitsmittel wurde zugewiesen.",
      })

      mutate()
      handleCloseDialog()
    } catch (error) {
      console.error("Error saving assignment:", error)
      toast({
        title: "Fehler",
        description: "Zuweisung konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handleReturn = async (assignmentId: string, arbeitsmittelId: string) => {
    try {
      const response = await fetch(
        `/api/practices/${practiceId}/team-members/${teamMemberId}/arbeitsmittel/${assignmentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actual_return_date: format(new Date(), "yyyy-MM-dd"),
            status: "zurückgegeben",
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to mark as returned")

      toast({
        title: "Erfolgreich",
        description: "Arbeitsmittel wurde als zurückgegeben markiert.",
      })

      mutate()
    } catch (error) {
      console.error("Error marking as returned:", error)
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (assignmentId: string, arbeitsmittelId: string) => {
    if (!confirm("Möchten Sie diese Zuweisung wirklich löschen?")) return

    try {
      const response = await fetch(
        `/api/practices/${practiceId}/team-members/${teamMemberId}/arbeitsmittel/${assignmentId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) throw new Error("Failed to delete assignment")

      toast({
        title: "Erfolgreich",
        description: "Zuweisung wurde gelöscht.",
      })

      mutate()
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast({
        title: "Fehler",
        description: "Zuweisung konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const handleOpenDialog = (assignment?: ArbeitsmittelAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setFormData({
        arbeitsmittel_id: assignment.arbeitsmittel_id,
        given_date: assignment.given_date,
        expected_return_date: assignment.expected_return_date || "",
        description: assignment.description || "",
        notes: assignment.notes || "",
      })
    } else {
      setEditingAssignment(null)
      setFormData({
        arbeitsmittel_id: "",
        given_date: format(new Date(), "yyyy-MM-dd"),
        expected_return_date: "",
        description: "",
        notes: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAssignment(null)
    setFormData({
      arbeitsmittel_id: "",
      given_date: format(new Date(), "yyyy-MM-dd"),
      expected_return_date: "",
      description: "",
      notes: "",
    })
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleOpenSignatureDialog = (assignmentId: string) => {
    setCurrentAssignmentToSign(assignmentId)
    setIsSignatureDialogOpen(true)
  }

  const handleSaveSignature = async () => {
    if (!currentAssignmentToSign) return

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const signatureData = canvas.toDataURL("image/png")

      const response = await fetch(
        `/api/practices/${practiceId}/team-members/${teamMemberId}/arbeitsmittel/${currentAssignmentToSign}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature_data: signatureData,
            signed_at: new Date().toISOString(),
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to save signature")

      toast({
        title: "Erfolgreich",
        description: "Unterschrift wurde gespeichert.",
      })

      mutate()
      setIsSignatureDialogOpen(false)
      setCurrentAssignmentToSign(null)
      clearSignature()
    } catch (error) {
      console.error("Error saving signature:", error)
      toast({
        title: "Fehler",
        description: "Unterschrift konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const [formData, setFormData] = useState({
    arbeitsmittel_id: "",
    given_date: format(new Date(), "yyyy-MM-dd"),
    expected_return_date: "",
    description: "",
    notes: "",
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-pulse">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Lade Arbeitsmittel...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Zugewiesene Arbeitsmittel
              </CardTitle>
              <CardDescription>Arbeitsmittel, die diesem Mitarbeiter zugewiesen wurden</CardDescription>
            </div>
            <Button onClick={() => router.push("/arbeitsmittel")}>
              <Plus className="mr-2 h-4 w-4" />
              Arbeitsmittel Verwaltung
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Keine Arbeitsmittel zugewiesen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{assignment.arbeitsmittel?.name}</h4>
                      <Badge variant={assignment.status === "zurückgegeben" ? "secondary" : "default"}>
                        {assignment.status === "zurückgegeben" ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Zurückgegeben
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Ausgegeben
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">{assignment.arbeitsmittel?.category}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div>
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Ausgegeben: {format(new Date(assignment.given_date), "dd.MM.yyyy", { locale: de })}
                      </div>
                      {assignment.actual_return_date && (
                        <div>
                          <CheckCircle2 className="inline h-3 w-3 mr-1" />
                          Zurück: {format(new Date(assignment.actual_return_date), "dd.MM.yyyy", { locale: de })}
                        </div>
                      )}
                      {assignment.expected_return_date && !assignment.actual_return_date && (
                        <div>
                          Erwartet bis:{" "}
                          {format(new Date(assignment.expected_return_date), "dd.MM.yyyy", { locale: de })}
                        </div>
                      )}
                      {assignment.arbeitsmittel?.serial_number && (
                        <div>S/N: {assignment.arbeitsmittel.serial_number}</div>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mt-2">{assignment.description}</p>
                    )}
                    {assignment.signature_data && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileSignature className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">
                          Unterschrieben am{" "}
                          {format(new Date(assignment.signed_at!), "dd.MM.yyyy HH:mm", { locale: de })}
                        </span>
                        <img
                          src={assignment.signature_data || "/placeholder.svg"}
                          alt="Unterschrift"
                          className="h-12 border rounded ml-2"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!assignment.signature_data && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenSignatureDialog(assignment.id)}>
                        <PenTool className="mr-2 h-4 w-4" />
                        Unterschreiben
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReturn(assignment.id, assignment.arbeitsmittel_id)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Als zurückgegeben markieren
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(assignment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(assignment.id, assignment.arbeitsmittel_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? "Zuweisung bearbeiten" : "Arbeitsmittel zuweisen"}</DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? "Bearbeiten Sie die Details der Arbeitsmittel-Zuweisung"
                : "Weisen Sie diesem Mitarbeiter ein Arbeitsmittel zu"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="arbeitsmittel">Arbeitsmittel *</Label>
              <Select
                value={formData.arbeitsmittel_id}
                onValueChange={(value) => setFormData({ ...formData, arbeitsmittel_id: value })}
                disabled={!!editingAssignment}
              >
                <SelectTrigger id="arbeitsmittel">
                  <SelectValue placeholder="Arbeitsmittel auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableArbeitsmittel.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {item.category}
                      {item.serial_number && ` (S/N: ${item.serial_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="given_date">Ausgabedatum *</Label>
                <Input
                  id="given_date"
                  type="date"
                  value={formData.given_date}
                  onChange={(e) => setFormData({ ...formData, given_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expected_return_date">Voraussichtliche Rückgabe</Label>
                <Input
                  id="expected_return_date"
                  type="date"
                  value={formData.expected_return_date}
                  onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Zusätzliche Informationen zur Ausgabe..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interne Notizen..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit}>{editingAssignment ? "Speichern" : "Zuweisen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Erhalt bestätigen</DialogTitle>
            <DialogDescription>
              Bitte unterschreiben Sie unten, um den Erhalt des Arbeitsmittels zu bestätigen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-4 bg-muted/20">
              <Label className="mb-2 block">Unterschrift</Label>
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="border bg-white rounded cursor-crosshair w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Unterschreiben Sie mit der Maus oder dem Finger (auf Touch-Geräten)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearSignature}>
              Löschen
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsSignatureDialogOpen(false)
                clearSignature()
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleSaveSignature}>
              <FileSignature className="mr-2 h-4 w-4" />
              Unterschrift speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ArbeitsmittelAssignments
