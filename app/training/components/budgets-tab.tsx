"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Euro } from "lucide-react"
import type { TrainingBudget } from "../types"

interface BudgetsTabProps {
  budgets: TrainingBudget[]
}

export function BudgetsTab({ budgets }: BudgetsTabProps) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Euro className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Keine Budgets gefunden</p>
          <p className="text-sm text-muted-foreground">Budgets werden über die API verwaltet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {budgets.map((budget) => (
        <Card key={budget.id}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Euro className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Budget {budget.year}</p>
                  {budget.team_member && (
                    <p className="text-sm text-muted-foreground">
                      {budget.team_member.first_name} {budget.team_member.last_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold">
              {(budget.budget_amount || 0).toLocaleString("de-DE")} {budget.currency || "EUR"}
            </div>
            {budget.notes && <p className="text-sm text-muted-foreground mt-2">{budget.notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
