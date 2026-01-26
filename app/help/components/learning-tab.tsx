"use client"

import { Clock, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { LearningPath } from "../types"

interface LearningTabProps {
  learningPaths: LearningPath[]
}

function getDifficultyBadge(difficulty: string) {
  const config = {
    beginner: { label: "Einsteiger", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    intermediate: { label: "Fortgeschritten", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    advanced: { label: "Experte", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  }
  const { label, className } = config[difficulty as keyof typeof config] || config.beginner
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

export function LearningTab({ learningPaths }: LearningTabProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {learningPaths.map((path) => {
        const Icon = path.icon
        const completedModules = path.modules.filter((m) => m.completed).length
        return (
          <Card key={path.id} className="overflow-hidden hover:shadow-lg transition-all">
            <div className={cn("h-2 bg-gradient-to-r", path.gradient)} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    path.gradient,
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {getDifficultyBadge(path.difficulty)}
              </div>
              <CardTitle className="text-lg">{path.title}</CardTitle>
              <CardDescription>{path.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {completedModules}/{path.modules.length} Module
                  </span>
                  <span className="font-medium">
                    {Math.round((completedModules / path.modules.length) * 100)}%
                  </span>
                </div>
                <Progress value={(completedModules / path.modules.length) * 100} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {path.estimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {path.enrolledCount.toLocaleString()} Teilnehmer
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button className="w-full" variant={path.progress > 0 ? "default" : "outline"}>
                {path.progress > 0 ? "Fortsetzen" : "Starten"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
