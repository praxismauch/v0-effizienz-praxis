"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SubscriptionPlan, PlanConfigData } from "./types"

interface PlanConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: SubscriptionPlan | null
  configData: PlanConfigData | null
  onConfigChange: (data: PlanConfigData) => void
  onSave: () => void
  saving: boolean
  annualDiscountPercentage: number
}

export function PlanConfigDialog({
  open,
  onOpenChange,
  plan,
  configData,
  onConfigChange,
  onSave,
  saving,
  annualDiscountPercentage,
}: PlanConfigDialogProps) {
  if (!plan || !configData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Plan konfigurieren: <span className="font-bold">{plan.name}</span>
          </DialogTitle>
          <DialogDescription>Passen Sie die detaillierten Parameter für diesen Abonnement-Plan an</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Grundeinstellungen</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name">Plan-Name</Label>
                <Input
                  id="plan-name"
                  value={configData.name || ""}
                  onChange={(e) => onConfigChange({ ...configData, name: e.target.value })}
                  placeholder="z.B. Professional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-description">Beschreibung</Label>
                <Textarea
                  id="plan-description"
                  value={configData.description || ""}
                  onChange={(e) => onConfigChange({ ...configData, description: e.target.value })}
                  placeholder="Kurze Beschreibung des Plans"
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Preisgestaltung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price-monthly">Monatlicher Preis (€)</Label>
                    <Input
                      id="price-monthly"
                      type="number"
                      step="0.01"
                      value={configData.priceMonthly || ""}
                      onChange={(e) => {
                        const monthly = Number.parseFloat(e.target.value) || 0
                        const yearly = (monthly * 12 * (1 - annualDiscountPercentage / 100)).toFixed(2)
                        onConfigChange({
                          ...configData,
                          priceMonthly: e.target.value,
                          priceYearly: yearly,
                        })
                      }}
                      placeholder="99,00"
                    />
                    <p className="text-xs text-muted-foreground">Aktueller Preis pro Monat</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="old-price-monthly">Alter Monatspreis (€)</Label>
                    <Input
                      id="old-price-monthly"
                      type="number"
                      step="0.01"
                      value={configData.oldPriceMonthly || ""}
                      onChange={(e) => onConfigChange({ ...configData, oldPriceMonthly: e.target.value })}
                      placeholder="149,00"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Durchgestrichener Vergleichspreis</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-yearly">Jährlicher Preis (€)</Label>
                    <Input
                      id="price-yearly"
                      type="number"
                      step="0.01"
                      value={configData.priceYearly || ""}
                      readOnly
                      className="bg-muted"
                      placeholder="Wird automatisch berechnet"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatisch berechnet mit {annualDiscountPercentage}% Rabatt
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="old-price-yearly">Alter Jahrespreis (€)</Label>
                    <Input
                      id="old-price-yearly"
                      type="number"
                      step="0.01"
                      value={configData.oldPriceYearly || ""}
                      onChange={(e) => onConfigChange({ ...configData, oldPriceYearly: e.target.value })}
                      placeholder="1788,00"
                    />
                    <p className="text-xs text-muted-foreground">Optional: Durchgestrichener Vergleichspreis</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={configData.isActive}
                  onCheckedChange={(checked) => onConfigChange({ ...configData, isActive: checked })}
                />
                <Label htmlFor="is-active">Plan aktiv (sichtbar auf Preisseite)</Label>
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Nutzungslimits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-users">Max. Benutzer</Label>
                <Input
                  id="max-users"
                  type="number"
                  value={configData.maxUsers === null ? "" : configData.maxUsers}
                  onChange={(e) =>
                    onConfigChange({
                      ...configData,
                      maxUsers: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="Unbegrenzt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-team-members">Max. Teammitglieder</Label>
                <Input
                  id="max-team-members"
                  type="number"
                  value={configData.maxTeamMembers === null ? "" : configData.maxTeamMembers}
                  onChange={(e) =>
                    onConfigChange({
                      ...configData,
                      maxTeamMembers: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="Unbegrenzt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-practices">Max. Praxisstandorte</Label>
                <Input
                  id="max-practices"
                  type="number"
                  value={configData.maxPractices === null ? "" : configData.maxPractices}
                  onChange={(e) =>
                    onConfigChange({
                      ...configData,
                      maxPractices: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage-limit">Speicherplatz (GB)</Label>
                <Input
                  id="storage-limit"
                  type="number"
                  value={configData.storageLimit === null ? "" : configData.storageLimit}
                  onChange={(e) =>
                    onConfigChange({
                      ...configData,
                      storageLimit: e.target.value === "" ? null : Number.parseInt(e.target.value, 10),
                    })
                  }
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Features & Funktionen</h3>
            <div className="space-y-3">
              <FeatureSwitch
                id="feature-todos"
                label="To-Do-Verwaltung"
                checked={configData.featureTodos ?? true}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureTodos: checked })}
              />
              <FeatureSwitch
                id="feature-goals"
                label="Zielverwaltung"
                checked={configData.featureGoals ?? true}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureGoals: checked })}
              />
              <FeatureSwitch
                id="feature-workflows"
                label="Workflows"
                checked={configData.featureWorkflows ?? true}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureWorkflows: checked })}
              />
              <FeatureSwitch
                id="feature-team"
                label="Team-Management"
                checked={configData.featureTeam ?? true}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureTeam: checked })}
              />
              <FeatureSwitch
                id="feature-reports"
                label="Erweiterte Berichte"
                checked={configData.featureReports ?? false}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureReports: checked })}
              />
              <FeatureSwitch
                id="feature-ai"
                label="KI-Funktionen"
                checked={configData.featureAi ?? false}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureAi: checked })}
              />
              <FeatureSwitch
                id="feature-api"
                label="API-Zugriff"
                checked={configData.featureApi ?? false}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featureApi: checked })}
              />
              <FeatureSwitch
                id="feature-priority-support"
                label="Prioritäts-Support"
                checked={configData.featurePrioritySupport ?? false}
                onCheckedChange={(checked) => onConfigChange({ ...configData, featurePrioritySupport: checked })}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Erweiterte Einstellungen</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="trial-days">Testphase (Tage)</Label>
                <Input
                  id="trial-days"
                  type="number"
                  value={configData.trialDays === null ? "" : configData.trialDays}
                  onChange={(e) =>
                    onConfigChange({
                      ...configData,
                      trialDays: e.target.value === "" ? null : e.target.value,
                    })
                  }
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-interval">Abrechnungsintervall</Label>
                <Select
                  value={configData.billingInterval || "monthly"}
                  onValueChange={(value) => onConfigChange({ ...configData, billingInterval: value })}
                >
                  <SelectTrigger id="billing-interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-renew"
                  checked={configData.autoRenew ?? true}
                  onCheckedChange={(checked) => onConfigChange({ ...configData, autoRenew: checked })}
                />
                <Label htmlFor="auto-renew">Automatische Verlängerung</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-downgrades"
                  checked={configData.allowDowngrades ?? false}
                  onCheckedChange={(checked) => onConfigChange({ ...configData, allowDowngrades: checked })}
                />
                <Label htmlFor="allow-downgrades">Downgrade erlauben</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FeatureSwitch({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
