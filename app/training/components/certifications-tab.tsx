"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Award, Edit, Trash2 } from "lucide-react"
import type { Certification } from "../types"

interface CertificationsTabProps {
  certifications: Certification[]
  onCreateNew: () => void
  onEdit: (certification: Certification) => void
  onDelete: (id: string, name: string) => void
}

export function CertificationsTab({ certifications, onCreateNew, onEdit, onDelete }: CertificationsTabProps) {
  if (certifications.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Zertifizierung
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Zertifizierungen gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Definieren Sie erforderliche Zertifizierungen</p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Zertifizierung erstellen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Zertifizierung
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certifications.map((cert) => (
          <Card key={cert.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{cert.name}</CardTitle>
                    <CardDescription>{cert.issuing_authority}</CardDescription>
                  </div>
                </div>
                <Badge variant={cert.is_mandatory ? "destructive" : "secondary"}>
                  {cert.is_mandatory ? "Pflicht" : "Optional"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Gültigkeit:</span>
                  <span>{cert.validity_months || 12} Monate</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Erinnerung:</span>
                  <span>{cert.reminder_days_before || 30} Tage vorher</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => onEdit(cert)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive bg-transparent"
                  onClick={() => onDelete(cert.id, cert.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
