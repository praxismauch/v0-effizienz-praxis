"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Euro, Edit, Trash2, Users } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useTeam } from "@/contexts/team-context"
import { toast } from "sonner"
import type { TrainingBudget } from "../types"

interface BudgetsTabProps {
  budgets: TrainingBudget[]
  practiceId: string
  onBudgetsChange: React.Dispatch<React.SetStateAction<TrainingBudget[]>>
  createTrigger?: number
}

interface BudgetFormState {
  year: number
  budget_amount: number
  currency: string
  team_member_id: string
  notes: string
}

const EMPTY_FORM: BudgetFormState = {
  year: new Date().getFullYear(),
  budget_amount: 0,
  currency: "EUR",
  team_member_id: "",
  notes: "",
}

export function BudgetsTab({ budgets, practiceId, onBudgetsChange, createTrigger }: BudgetsTabProps) {
  const { currentUser } = useUser()
  const { teamMembers } = useTeam()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<TrainingBudget | null>(null)
  const [formData, setFormData] = useState<BudgetFormState>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TrainingBudget | null>(null)
  const prevTriggerRef = useRef(createTrigger)

  useEffect(() => {
    if (createTrigger && createTrigger > 0 && createTrigger !== prevTriggerRef.current) {
      openCreate()
    }
    prevTriggerRef.current = createTrigger
  }, [createTrigger])

  const openCreate = () => {
    setEditingBudget(null)
    setFormData(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (budget: TrainingBudget) => {
    setEditingBudget(budget)
    setFormData({
      year: budget.year,
      budget_amount: budget.budget_amount,
      currency: budget.currency || "EUR",
      team_member_id: budget.team_member_id || "",
      notes: budget.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.budget_amount || formData.budget_amount <= 0) {
      toast.error("Bitte geben Sie einen gültigen Budgetbetrag ein.")
      return
    }

    setIsSaving(true)
    try {
      if (editingBudget) {
        // Update
        const res = await fetch(`/api/practices/${practiceId}/training/budgets/${editingBudget.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error("Update failed")
        const data = await res.json()
        onBudgetsChange((prev) => prev.map((b) => (b.id === editingBudget.id ? { ...b, ...data.budget } : b)))
        toast.success("Budget aktualisiert")
      } else {
        // Create
        const res = await fetch(`/api/practices/${practiceId}/training/budgets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            team_member_id: formData.team_member_id || null,
            created_by: currentUser?.id,
          }),
        })
        if (!res.ok) throw new Error("Create failed")
        const data = await res.json()
        onBudgetsChange((prev) => [...prev, data.budget])
        toast.success("Budget erstellt")
      }
      setIsDialogOpen(false)
    } catch {
      toast.error(editingBudget ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await fetch(`/api/practices/${practiceId}/training/budgets/${deleteTarget.id}`, { method: "DELETE" })
      onBudgetsChange((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      toast.success("Budget gelöscht")
    } catch {
      toast.error("Fehler beim Löschen")
    } finally {
      setDeleteTarget(null)
    }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + (b.budget_amount || 0), 0)
  const totalUsed = budgets.reduce((sum, b) => sum + ((b as any).used_amount || 0), 0)

  return (
    <div className="space-y-4">
      {budgets.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Gesamt: <span className="font-semibold text-foreground">{totalBudget.toLocaleString("de-DE")} EUR</span>
          {totalUsed > 0 && (
            <span className="ml-2">
              | Verwendet: <span className="font-semibold text-foreground">{totalUsed.toLocaleString("de-DE")} EUR</span>
            </span>
          )}
        </div>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Euro className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Budgets gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Legen Sie Fortbildungsbudgets für Ihr Team an</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Budget erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const used = (budget as any).used_amount || 0
            const remaining = (budget as any).remaining_amount ?? budget.budget_amount
            const usagePercent = budget.budget_amount > 0 ? Math.round((used / budget.budget_amount) * 100) : 0

            return (
              <Card key={budget.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                        <Euro className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Budget {budget.year}</CardTitle>
                        {budget.team_member ? (
                          <p className="text-sm text-muted-foreground">
                            {budget.team_member.first_name} {budget.team_member.last_name}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Gesamtpraxis
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteTarget(budget)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{budget.budget_amount.toLocaleString("de-DE")} {budget.currency || "EUR"}</span>
                    {usagePercent > 0 && (
                      <Badge variant={usagePercent > 90 ? "destructive" : usagePercent > 70 ? "secondary" : "outline"}>
                        {usagePercent}% genutzt
                      </Badge>
                    )}
                  </div>
                  {used > 0 && (
                    <div className="space-y-1">
                      <Progress value={usagePercent} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Verwendet: {used.toLocaleString("de-DE")} {budget.currency || "EUR"}</span>
                        <span>Verbleibend: {remaining.toLocaleString("de-DE")} {budget.currency || "EUR"}</span>
                      </div>
                    </div>
                  )}
                  {budget.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{budget.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Budget bearbeiten" : "Neues Budget"}</DialogTitle>
            <DialogDescription>
              {editingBudget
                ? "Passen Sie die Budgeteinstellungen an."
                : "Erstellen Sie ein Fortbildungsbudget für Ihr Team oder einzelne Mitarbeitende."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jahr *</Label>
                <Select
                  value={String(formData.year)}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, year: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Betrag (EUR) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget_amount || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="z.B. 5000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mitarbeitende (optional)</Label>
              <Select
                value={formData.team_member_id || "all"}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, team_member_id: v === "all" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gesamtpraxis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Gesamtpraxis</SelectItem>
                  {teamMembers
                    .filter((m) => m.is_active !== false)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Anmerkungen zum Budget..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichern..." : editingBudget ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Budget löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Budget {deleteTarget?.year}
              {deleteTarget?.team_member
                ? ` für ${deleteTarget.team_member.first_name} ${deleteTarget.team_member.last_name}`
                : " (Gesamtpraxis)"}{" "}
              wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
