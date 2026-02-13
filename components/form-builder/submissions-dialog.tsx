"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import type { CustomForm, Parameter, FormSubmission } from "./types"

interface SubmissionsDialogProps {
  selectedFormId: string | null
  onClose: () => void
  forms: CustomForm[]
  submissions: FormSubmission[]
  parameters: Parameter[]
}

export function SubmissionsDialog({ selectedFormId, onClose, forms, submissions, parameters }: SubmissionsDialogProps) {
  const formSubmissions = selectedFormId ? submissions.filter((s) => s.formId === selectedFormId) : []
  const selectedForm = selectedFormId ? forms.find((f) => f.id === selectedFormId) : null

  const getParameterName = (id: string) => {
    const param = parameters.find((p) => p.id === id)
    return param ? param.name : `Parameter ${id}`
  }

  return (
    <Dialog open={!!selectedFormId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formular Einreichungen</DialogTitle>
          <DialogDescription>
            {selectedForm && `Einreichungen für "${selectedForm.name}"`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {formSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Einreichungsdatum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Daten</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.userName}</TableCell>
                    <TableCell>{formatDateDE(submission.submittedAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          submission.status === "reviewed"
                            ? "default"
                            : submission.status === "submitted"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {Object.entries(submission.data).map(([paramId, value]) => (
                          <div key={paramId} className="text-sm">
                            <span className="font-medium">{getParameterName(paramId)}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Einreichungen</h3>
              <p className="text-muted-foreground">Dieses Formular hat noch keine Einreichungen erhalten.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
