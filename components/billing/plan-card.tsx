"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings, Trash2, CheckCircle } from "lucide-react"
import { formatCurrency } from "@/lib/format-currency"
import type { SubscriptionPlan } from "./types"

interface PlanCardProps {
  plan: SubscriptionPlan
  annualDiscountPercentage: number
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (planId: string, planName: string) => void
}

export function PlanCard({ plan, annualDiscountPercentage, onEdit, onDelete }: PlanCardProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <Badge variant={plan.is_active ? "default" : "secondary"}>
                {plan.is_active ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            <CardDescription className="mt-1">{plan.description}</CardDescription>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-baseline gap-2">
                {plan.old_price_monthly && (
                  <span className="line-through text-muted-foreground">
                    {formatCurrency(plan.old_price_monthly / 100)}
                  </span>
                )}
                <span className="text-2xl font-bold">{formatCurrency(plan.price_monthly / 100)}</span>
                <span className="text-sm font-normal text-muted-foreground">/Monat</span>
              </div>
              {plan.price_yearly && (
                <div className="flex items-baseline gap-2">
                  {plan.old_price_yearly && (
                    <span className="line-through text-muted-foreground">
                      {formatCurrency(plan.old_price_yearly / 100)}
                    </span>
                  )}
                  <span className="text-2xl font-bold">{formatCurrency(plan.price_yearly / 100)}</span>
                  <span className="text-sm font-normal text-muted-foreground">/Jahr</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {annualDiscountPercentage}% Ersparnis
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(plan)}>
              <Settings className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(plan.id, plan.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <div className="font-medium text-muted-foreground">Monatlicher Preis</div>
            <div className="text-lg font-bold">{formatCurrency(plan.price_monthly / 100)}</div>
          </div>
          {plan.price_yearly && (
            <div>
              <div className="font-medium text-muted-foreground">Jährlicher Preis</div>
              <div className="text-lg font-bold">{formatCurrency(plan.price_yearly / 100)}</div>
            </div>
          )}
          <div>
            <div className="font-medium text-muted-foreground">Max. Benutzer</div>
            <div className="text-lg font-bold">{plan.max_users || "Unbegrenzt"}</div>
          </div>
          <div>
            <div className="font-medium text-muted-foreground">Max. Teammitglieder</div>
            <div className="text-lg font-bold">{plan.max_team_members || "Unbegrenzt"}</div>
          </div>
        </div>
        <div>
          <div className="font-medium text-sm text-muted-foreground mb-2">Enthaltene Features:</div>
          <div className="flex flex-wrap gap-2">
            {plan.features.map((feature, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
