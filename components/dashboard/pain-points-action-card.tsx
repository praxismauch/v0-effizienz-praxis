"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertTriangle,
  Brain,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Target,
  Clock,
  Zap,
  Users,
  Settings,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface PainPoint {
  id: string
  title: string
  description: string
  createdAt?: string
}

interface ActionItem {
  id: string
  painPointId: string
  painPointTitle: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: string
  estimatedEffort: string
  expectedImpact: string
  steps: string[]
  completed?: boolean
}

const categoryIcons: Record<string, React.ReactNode> = {
  prozesse: <Settings className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  technologie: <Zap className="h-4 w-4" />,
  kommunikation: <MessageSquare className="h-4 w-4" />,
  organisation: <Target className="h-4 w-4" />,
}

const categoryColors: Record<string, string> = {
  prozesse: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  team: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  technologie: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  kommunikation: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  organisation: "bg-rose-500/10 text-rose-600 border-rose-500/20",
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

const priorityLabels: Record<string, string> = {
  high: "Hoch",
  medium: "Mittel",
  low: "Niedrig",
}

export function PainPointsActionCard() {
  const { currentPractice } = usePractice()
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPainPoint, setSelectedPainPoint] = useState<string>("all")
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  useEffect(() => {
    if (currentPractice?.id) {
      loadPainPoints()
    }
  }, [currentPractice?.id])

  const loadPainPoints = async () => {
    if (!currentPractice?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/pain-points`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setPainPoints(data.painPoints || [])

        // Load action items from practice settings
        const settings = (currentPractice.settings as Record<string, unknown>) || {}
        if (settings.aiActionItems) {
          setActionItems(settings.aiActionItems as ActionItem[])
        }
      }
    } catch (error) {
      console.error("Error loading pain points:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateActionItems = async () => {
    if (!currentPractice?.id) return

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/pain-points/ai-actions`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setActionItems(data.actionItems || [])
        toast.success("KI-Maßnahmen wurden generiert")
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Generieren")
      }
    } catch (error) {
      console.error("Error generating actions:", error)
      toast.error("Fehler beim Generieren der Maßnahmen")
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleItemComplete = (itemId: string) => {
    setActionItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
    )
  }

  const filteredActions =
    selectedPainPoint === "all" ? actionItems : actionItems.filter((item) => item.painPointId === selectedPainPoint)

  const completedCount = actionItems.filter((item) => item.completed).length
  const progressPercent = actionItems.length > 0 ? (completedCount / actionItems.length) * 100 : 0

  if (painPoints.length === 0 && !isLoading) {
    return null
  }

  return (
    <Card className="overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Ihre Praxis-Herausforderungen
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {painPoints.length} Probleme
                </Badge>
              </CardTitle>
              <CardDescription>KI-generierte Lösungsvorschläge für Ihre größten Herausforderungen</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateActionItems}
            disabled={isGenerating || painPoints.length === 0}
            className="gap-2 bg-transparent"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                KI-Analyse
              </>
            )}
          </Button>
        </div>

        {/* Progress bar */}
        {actionItems.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Fortschritt</span>
              <span className="font-medium">
                {completedCount} von {actionItems.length} erledigt
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pain Points Pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedPainPoint === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPainPoint("all")}
            className="h-8"
          >
            Alle
          </Button>
          {painPoints.map((point, index) => (
            <Button
              key={point.id}
              variant={selectedPainPoint === point.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPainPoint(point.id)}
              className={cn("h-8 gap-2", selectedPainPoint === point.id && "bg-amber-500 hover:bg-amber-600")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {index + 1}
              </span>
              <span className="max-w-[150px] truncate">{point.title}</span>
            </Button>
          ))}
        </div>

        {/* Selected Pain Point Details */}
        {selectedPainPoint !== "all" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-sm">
                {painPoints.findIndex((p) => p.id === selectedPainPoint) + 1}
              </div>
              <div>
                <h4 className="font-medium text-foreground">
                  {painPoints.find((p) => p.id === selectedPainPoint)?.title}
                </h4>
                {painPoints.find((p) => p.id === selectedPainPoint)?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {painPoints.find((p) => p.id === selectedPainPoint)?.description}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Items */}
        {actionItems.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              <AnimatePresence>
                {filteredActions.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden transition-all cursor-pointer hover:shadow-md",
                        item.completed && "opacity-60",
                        expandedItem === item.id && "ring-2 ring-primary",
                      )}
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleItemComplete(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={cn(
                                  "font-medium text-foreground",
                                  item.completed && "line-through text-muted-foreground",
                                )}
                              >
                                {item.title}
                              </h4>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant="outline" className={priorityColors[item.priority]}>
                                  {priorityLabels[item.priority]}
                                </Badge>
                                <Badge variant="outline" className={categoryColors[item.category]}>
                                  {categoryIcons[item.category]}
                                  <span className="ml-1 capitalize">{item.category}</span>
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>

                            {/* Expanded content */}
                            <AnimatePresence>
                              {expandedItem === item.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 space-y-4"
                                >
                                  <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span>Aufwand: {item.estimatedEffort}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Target className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-emerald-600">{item.expectedImpact}</span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h5 className="text-sm font-medium flex items-center gap-2">
                                      <Lightbulb className="h-4 w-4 text-amber-500" />
                                      Umsetzungsschritte
                                    </h5>
                                    <div className="space-y-2 pl-6">
                                      {item.steps.map((step, stepIndex) => (
                                        <div key={stepIndex} className="flex items-start gap-2 text-sm">
                                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                                            {stepIndex + 1}
                                          </div>
                                          <span className="text-muted-foreground">{step}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t">
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                                    >
                                      Problem: {item.painPointTitle}
                                    </Badge>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="flex items-center gap-2 mt-2">
                              <ChevronRight
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform",
                                  expandedItem === item.id && "rotate-90",
                                )}
                              />
                              <span className="text-xs text-muted-foreground">
                                {expandedItem === item.id ? "Weniger anzeigen" : "Details anzeigen"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-2">Keine Maßnahmen vorhanden</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Klicken Sie auf "KI-Analyse", um personalisierte Lösungsvorschläge zu erhalten.
            </p>
            <Button onClick={generateActionItems} disabled={isGenerating} className="gap-2">
              <Brain className="h-4 w-4" />
              Jetzt analysieren
            </Button>
          </div>
        )}
      </CardContent>

      {actionItems.length > 0 && (
        <CardFooter className="border-t bg-muted/30">
          <div className="flex items-center justify-between w-full text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{completedCount} erledigt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Circle className="h-4 w-4 text-amber-500" />
                <span>{actionItems.length - completedCount} offen</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-2 text-primary">
              Alle Maßnahmen exportieren
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

export default PainPointsActionCard
