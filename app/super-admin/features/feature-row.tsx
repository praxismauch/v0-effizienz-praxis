"use client"

import {
  ChevronRight,
  ChevronDown,
  Shield,
  Sparkles,
  FolderOpen,
  Building2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { FeatureFlag } from "./types"

interface FeatureRowProps {
  feature: FeatureFlag
  isChild?: boolean
  features: FeatureFlag[]
  expandedGroups: Set<string>
  saving: string | null
  onToggleGroup: (groupKey: string) => void
  onUpdateFeature: (featureKey: string, updates: { is_enabled?: boolean; is_beta?: boolean }) => void
  onResetToGlobal: (featureKey: string) => void
  getEffectiveValue: (feature: FeatureFlag, field: "is_enabled" | "is_beta") => boolean
  hasOverride: (featureKey: string) => boolean
}

export function FeatureRow({
  feature,
  isChild = false,
  features,
  expandedGroups,
  saving,
  onToggleGroup,
  onUpdateFeature,
  onResetToGlobal,
  getEffectiveValue,
  hasOverride,
}: FeatureRowProps) {
  const isGroup = !feature.parent_key && feature.feature_type
  const isExpanded = expandedGroups.has(feature.feature_key)
  const groupChildren = isGroup ? features.filter((f) => f.parent_key === feature.feature_key) : []
  const featureHasOverride = hasOverride(feature.feature_key)
  const effectiveEnabled = getEffectiveValue(feature, "is_enabled")
  const effectiveBeta = getEffectiveValue(feature, "is_beta")

  if (isGroup) {
    return (
      <div className="mb-2">
        <button
          onClick={() => onToggleGroup(feature.feature_key)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
            "bg-muted/50 hover:bg-muted transition-colors",
            "text-left font-medium",
          )}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="flex-1">{feature.feature_name}</span>
          <Badge variant="secondary" className="text-xs">
            {groupChildren.filter((c) => getEffectiveValue(c, "is_enabled")).length}/{groupChildren.length}
          </Badge>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-4">
            {groupChildren.map((child) => (
              <FeatureRow
                key={child.id}
                feature={child}
                isChild
                features={features}
                expandedGroups={expandedGroups}
                saving={saving}
                onToggleGroup={onToggleGroup}
                onUpdateFeature={onUpdateFeature}
                onResetToGlobal={onResetToGlobal}
                getEffectiveValue={getEffectiveValue}
                hasOverride={hasOverride}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg",
        "bg-card border transition-all",
        !effectiveEnabled && "opacity-60",
        feature.is_protected && "border-amber-500/30 bg-amber-500/5",
        featureHasOverride && "border-blue-500/30 bg-blue-500/5",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{feature.feature_name}</span>
          {feature.is_protected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Shield className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{"Geschutzte Funktion - kann nicht deaktiviert werden"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {featureHasOverride && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Building2 className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{"Praxis-spezifische Einstellung (uberschreibt global)"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {effectiveBeta && (
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 text-violet-600 text-xs font-semibold"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              BETA
            </Badge>
          )}
        </div>
        {feature.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{feature.description}</p>
        )}
        {feature.route_path && (
          <code className="text-xs text-muted-foreground/70 font-mono">{feature.route_path}</code>
        )}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {featureHasOverride && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResetToGlobal(feature.feature_key)}
                  disabled={saving === feature.feature_key}
                  className="h-8 px-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{"Auf globale Einstellung zurucksetzen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Beta</span>
                <Switch
                  checked={effectiveBeta}
                  onCheckedChange={(checked) => onUpdateFeature(feature.feature_key, { is_beta: checked })}
                  disabled={saving === feature.feature_key}
                  className="data-[state=checked]:bg-violet-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-600"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Beta-Label anzeigen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Aktiv</span>
                <Switch
                  checked={effectiveEnabled}
                  onCheckedChange={(checked) => onUpdateFeature(feature.feature_key, { is_enabled: checked })}
                  disabled={saving === feature.feature_key || feature.is_protected}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{feature.is_protected ? "Geschutzt" : "Feature aktivieren/deaktivieren"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
