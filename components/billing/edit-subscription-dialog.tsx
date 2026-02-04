"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/format-currency"
import type { PracticeSubscription, SubscriptionPlan } from "./types"

interface EditSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: PracticeSubscription | null
  plans: SubscriptionPlan[]
  selectedPlanId: string
  onPlanChange: (planId: string) => void
  onSave: () => void
}

export function EditSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  plans,
  selectedPlanId,
  onPlanChange,
  onSave,
}: EditSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abonnement bearbeiten</DialogTitle>
          <DialogDescription>Ändern Sie den Plan für {subscription?.practices?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Neuer Plan</Label>
            <Select value={selectedPlanId} onValueChange={onPlanChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {formatCurrency(plan.price_monthly / 100)}/Monat
                    {plan.price_yearly && <span> - {formatCurrency(plan.price_yearly / 100)}/Jahr</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave}>Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
