"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Shield, Plus, CheckCircle2, BookOpen, Eye } from "lucide-react"
import { PLAN_TYPES, AREAS, FREQUENCIES, STATUS_OPTIONS, type HygienePlan } from "./hygiene-constants"

interface HygienePlansTableProps {
  plans: HygienePlan[]
  hasFilters: boolean
  onCreateNew: () => void
  onExecute: (plan: HygienePlan) => void
  onAddToKnowledge: (plan: HygienePlan) => void
  onViewDetail: (plan: HygienePlan) => void
}

export function HygienePlansTable({
  plans,
  hasFilters,
  onCreateNew,
  onExecute,
  onAddToKnowledge,
  onViewDetail,
}: HygienePlansTableProps) {
  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hygienepläne</CardTitle>
          <CardDescription>Übersicht aller Hygienepläne mit RKI-Richtlinien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Hygienepläne gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {hasFilters
                ? "Keine Pläne entsprechen Ihren Filterkriterien."
                : "Erstellen Sie Ihren ersten Hygieneplan basierend auf RKI-Empfehlungen."}
            </p>
            {!hasFilters && (
              <Button onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Plan erstellen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hygienepläne</CardTitle>
        <CardDescription>Übersicht aller Hygienepläne mit RKI-Richtlinien</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Bereich</TableHead>
              <TableHead>Häufigkeit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow
                key={plan.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onViewDetail(plan)}
              >
                <TableCell className="font-medium">
                  <div>
                    <div>{plan.title}</div>
                    {plan.rki_reference && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <BookOpen className="h-3 w-3" />
                        RKI-Referenz
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{PLAN_TYPES.find((t) => t.value === plan.plan_type)?.label || plan.plan_type}</TableCell>
                <TableCell>{AREAS.find((a) => a.value === plan.area)?.label || plan.area}</TableCell>
                <TableCell>{FREQUENCIES.find((f) => f.value === plan.frequency)?.label || plan.frequency}</TableCell>
                <TableCell>
                  <Badge
                    variant={plan.status === "active" ? "default" : "secondary"}
                    className={STATUS_OPTIONS.find((s) => s.value === plan.status)?.color}
                  >
                    {STATUS_OPTIONS.find((s) => s.value === plan.status)?.label || plan.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onViewDetail(plan) }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onExecute(plan) }}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Durchführen
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onAddToKnowledge(plan) }}>
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
