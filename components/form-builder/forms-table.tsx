"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, FileText, MoreHorizontal, Edit, Trash2, UserCheck } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import type { CustomForm, Parameter, FormSubmission } from "./types"

interface FormsTableProps {
  forms: CustomForm[]
  parameters: Parameter[]
  submissions: FormSubmission[]
  onEdit: (form: CustomForm) => void
  onDelete: (formId: string) => void
  onViewSubmissions: (formId: string) => void
}

export function FormsTable({ forms, parameters, submissions, onEdit, onDelete, onViewSubmissions }: FormsTableProps) {
  const getParameterName = (id: string) => {
    const param = parameters.find((p) => p.id === id)
    return param ? param.name : `Parameter ${id}`
  }

  const getFormStats = (formId: string) => {
    const formSubmissions = submissions.filter((s) => s.formId === formId)
    const form = forms.find((f) => f.id === formId)
    const assignedCount = form?.assignedUsers.length || 0
    const submittedCount = formSubmissions.length
    return {
      assigned: assignedCount,
      submitted: submittedCount,
      completionRate: assignedCount > 0 ? Math.round((submittedCount / assignedCount) * 100) : 0,
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benutzerdefinierte Formulare</CardTitle>
        <CardDescription>
          Verwalten Sie benutzerdefinierte Dateneingabeformulare und verfolgen Sie Einreichungen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Formularname</TableHead>
              <TableHead>Parameter</TableHead>
              <TableHead>Zugewiesene Benutzer</TableHead>
              <TableHead>Häufigkeit</TableHead>
              <TableHead>Fortschritt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => {
              const stats = getFormStats(form.id)
              return (
                <TableRow key={form.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{form.name}</div>
                      <div className="text-sm text-muted-foreground">{form.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {form.parameters.slice(0, 2).map((paramId) => (
                        <Badge key={paramId} variant="outline" className="text-xs">
                          {getParameterName(paramId)}
                        </Badge>
                      ))}
                      {form.parameters.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{form.parameters.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{form.assignedUsers.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{form.frequency}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span>
                          {stats.submitted}/{stats.assigned}
                        </span>
                        <Badge variant={stats.completionRate === 100 ? "default" : "outline"} className="text-xs">
                          {stats.completionRate}%
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={form.isActive ? "default" : "secondary"}>
                      {form.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateDE(form.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewSubmissions(form.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Einreichungen anzeigen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(form)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Formular bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Benutzer verwalten
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(form.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Formular löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
