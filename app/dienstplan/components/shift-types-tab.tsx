"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Clock, Users } from "lucide-react"
import type { ShiftType } from "../types"

interface ShiftTypesTabProps {
  shiftTypes: ShiftType[]
  onAdd: () => void
  onEdit: (shiftType: ShiftType) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export default function ShiftTypesTab({ shiftTypes, onAdd, onEdit, onDelete, isLoading }: ShiftTypesTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Schichttypen verwalten</h3>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Schichttyp
        </Button>
      </div>

      {shiftTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Keine Schichttypen vorhanden</p>
            <Button className="mt-4" onClick={onAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Schichttyp erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shiftTypes.map((shiftType) => (
            <Card key={shiftType.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shiftType.color }} />
                    <CardTitle className="text-base">{shiftType.name}</CardTitle>
                  </div>
                  <Badge variant={shiftType.is_active ? "default" : "secondary"}>
                    {shiftType.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {shiftType.start_time} - {shiftType.end_time}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Pause: {shiftType.break_minutes} Min.</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Min. {shiftType.min_staff} Mitarbeiter</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => onEdit(shiftType)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive bg-transparent"
                    onClick={() => onDelete(shiftType.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
