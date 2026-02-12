"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Lightbulb, Plus, RefreshCw, Sparkles, TrendingUp, Zap } from "lucide-react"
import type { WellbeingSuggestion } from "../types"
import { SUGGESTION_CATEGORIES } from "../types"

interface SuggestionsTabProps {
  suggestions: WellbeingSuggestion[]
  isGeneratingSuggestions: boolean
  onGenerateSuggestions: () => void
}

export function SuggestionsTab({ suggestions, isGeneratingSuggestions, onGenerateSuggestions }: SuggestionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{"Work-Life-Balance Vorschläge"}</h2>
          <p className="text-sm text-muted-foreground">{"KI-generierte Maßnahmen für besseres Wohlbefinden"}</p>
        </div>
        <Button onClick={onGenerateSuggestions} disabled={isGeneratingSuggestions}>
          {isGeneratingSuggestions ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {"Neue Vorschläge"}
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {suggestions.map((suggestion) => {
            const category = SUGGESTION_CATEGORIES.find((c) => c.value === suggestion.category)
            return (
              <Card key={suggestion.id} className={suggestion.is_implemented ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {category?.icon && <category.icon className="h-5 w-5 text-primary" />}
                      <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    </div>
                    {suggestion.is_implemented && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Umgesetzt
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{suggestion.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>
                        {"Aufwand: "}
                        {suggestion.effort_level === "low" ? "Gering" : suggestion.effort_level === "medium" ? "Mittel" : "Hoch"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>
                        {"Wirkung: "}
                        {suggestion.impact_level === "low" ? "Gering" : suggestion.impact_level === "medium" ? "Mittel" : "Hoch"}
                      </span>
                    </div>
                  </div>
                  {suggestion.estimated_cost && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {"Geschätzte Kosten: "}{suggestion.estimated_cost}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Badge variant="outline">{category?.label || suggestion.category}</Badge>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lightbulb className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{"Noch keine Vorschläge"}</h3>
            <p className="text-muted-foreground mb-4">
              {"Lassen Sie die KI basierend auf Ihren Team-Daten Vorschläge generieren."}
            </p>
            <Button onClick={onGenerateSuggestions} disabled={isGeneratingSuggestions}>
              {isGeneratingSuggestions ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {"Vorschläge generieren"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
