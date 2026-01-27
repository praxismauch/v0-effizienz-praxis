"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, RefreshCw, CheckCircle2, Package, Clock, Box, ShoppingCart } from "lucide-react"
import type { OrderSuggestion } from "../types"
import { URGENCY_COLORS, URGENCY_LABELS } from "../types"

interface SuggestionsTabProps {
  suggestions: OrderSuggestion[]
  loading: boolean
  onRefresh: () => void
}

export function SuggestionsTab({ suggestions, loading, onRefresh }: SuggestionsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              KI-Bestellvorschläge
            </CardTitle>
            <CardDescription>Basierend auf Verbrauchsmustern und Bestandsdaten</CardDescription>
          </div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
            <p className="text-lg font-medium">Keine Bestellungen erforderlich</p>
            <p className="text-sm">Alle Bestände sind auf einem guten Niveau.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.item.id}
                className={`p-4 rounded-lg border ${
                  suggestion.urgency === "critical"
                    ? "border-red-500/50 bg-red-500/5"
                    : suggestion.urgency === "high"
                      ? "border-orange-500/50 bg-orange-500/5"
                      : suggestion.urgency === "medium"
                        ? "border-amber-500/50 bg-amber-500/5"
                        : "border-border bg-card"
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        suggestion.urgency === "critical"
                          ? "bg-red-500/10"
                          : suggestion.urgency === "high"
                            ? "bg-orange-500/10"
                            : suggestion.urgency === "medium"
                              ? "bg-amber-500/10"
                              : "bg-muted"
                      }`}
                    >
                      <Package
                        className={`h-6 w-6 ${
                          suggestion.urgency === "critical"
                            ? "text-red-500"
                            : suggestion.urgency === "high"
                              ? "text-orange-500"
                              : suggestion.urgency === "medium"
                                ? "text-amber-500"
                                : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{suggestion.item.name}</h4>
                        <Badge variant="outline" className={URGENCY_COLORS[suggestion.urgency]}>
                          {URGENCY_LABELS[suggestion.urgency]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Box className="h-4 w-4 text-muted-foreground" />
                          Aktuell: {suggestion.item.current_stock} {suggestion.item.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />~{suggestion.daysUntilStockout} Tage bis leer
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {suggestion.suggestedQuantity} {suggestion.item.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">~{suggestion.estimatedCost.toFixed(2)} €</p>
                    </div>
                    <Button
                      size="sm"
                      className={
                        suggestion.urgency === "critical"
                          ? "bg-red-500 hover:bg-red-600"
                          : suggestion.urgency === "high"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : ""
                      }
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Bestellen
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
