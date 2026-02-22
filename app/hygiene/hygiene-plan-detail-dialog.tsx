"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  Clock,
  User,
  FileText,
  CheckCircle2,
  BookOpen,
  Beaker,
  MapPin,
  ClipboardList,
  AlertTriangle,
  Printer,
  Pencil,
} from "lucide-react"
import {
  type HygienePlan,
  PLAN_TYPES,
  AREAS,
  FREQUENCIES,
  STATUS_OPTIONS,
} from "./hygiene-constants"

interface HygienePlanDetailDialogProps {
  plan: HygienePlan | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onExecute: (plan: HygienePlan) => void
  onAddToKnowledge: (plan: HygienePlan) => void
  onEdit: (plan: HygienePlan) => void
}

export function HygienePlanDetailDialog({
  plan,
  open,
  onOpenChange,
  onExecute,
  onAddToKnowledge,
  onEdit,
}: HygienePlanDetailDialogProps) {
  if (!plan) return null

  const planType = PLAN_TYPES.find((t) => t.value === plan.plan_type)?.label || plan.plan_type
  const area = AREAS.find((a) => a.value === plan.area)?.label || plan.area
  const frequency = FREQUENCIES.find((f) => f.value === plan.frequency)?.label || plan.frequency
  const statusOption = STATUS_OPTIONS.find((s) => s.value === plan.status)

  const procedureSteps = plan.procedure
    ? plan.procedure
        .split(/\n|(?:\d+\.\s)/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl text-balance">{plan.title}</DialogTitle>
              {plan.description && (
                <DialogDescription className="mt-2">{plan.description}</DialogDescription>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant={plan.status === "active" ? "default" : "secondary"} className={statusOption?.color}>
                  {statusOption?.label || plan.status}
                </Badge>
                {plan.documentation_required && (
                  <Badge variant="outline" className="gap-1">
                    <ClipboardList className="h-3 w-3" />
                    Dokumentationspflicht
                  </Badge>
                )}
                {plan.rki_reference && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    RKI-Referenz
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Card className="bg-muted/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Beaker className="h-3.5 w-3.5" />
                Typ
              </div>
              <p className="font-medium text-sm">{planType}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <MapPin className="h-3.5 w-3.5" />
                Bereich
              </div>
              <p className="font-medium text-sm">{area}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Häufigkeit
              </div>
              <p className="font-medium text-sm">{frequency}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/40">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <User className="h-3.5 w-3.5" />
                Verantwortlich
              </div>
              <p className="font-medium text-sm">{plan.responsible_role || "Nicht zugewiesen"}</p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-2" />

        {/* Procedure Steps */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Durchführung
          </h3>

          {procedureSteps.length > 1 ? (
            <div className="space-y-2">
              {procedureSteps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {plan.procedure || "Keine Durchführungsbeschreibung hinterlegt."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Products Used */}
        {plan.products_used && plan.products_used.length > 0 && (
          <>
            <Separator className="my-2" />
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Verwendete Produkte / Materialien
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.products_used.map((product, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* RKI Reference */}
        {plan.rki_reference && (
          <>
            <Separator className="my-2" />
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                RKI-Referenz
              </h3>
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.rki_reference}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Documentation Warning */}
        {plan.documentation_required && (
          <>
            <Separator className="my-2" />
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Dokumentationspflicht</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Die Durchführung dieses Hygieneplans muss dokumentiert werden. Stellen Sie sicher, dass jede Ausführung protokolliert wird.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>Version {plan.version || 1}</span>
          <span>
            Zuletzt aktualisiert: {new Date(plan.updated_at).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          <Button variant="outline" onClick={() => { onEdit(plan); onOpenChange(false) }}>
            <Pencil className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onAddToKnowledge(plan)
              onOpenChange(false)
            }}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Zur Wissensdatenbank
          </Button>
          <Button
            onClick={() => {
              onExecute(plan)
              onOpenChange(false)
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Durchführen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
