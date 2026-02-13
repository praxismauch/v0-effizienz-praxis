import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { OptimizationMetrics } from "./types"

interface RecommendationsTabProps {
  recommendations: OptimizationMetrics["recommendations"]
}

export function RecommendationsTab({ recommendations }: RecommendationsTabProps) {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              className={`border-l-4 ${
                rec.priority === "high"
                  ? "border-red-500"
                  : rec.priority === "medium"
                    ? "border-orange-500"
                    : "border-blue-500"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">{rec.category}</Badge>
                    <CardTitle className="text-base">{rec.title}</CardTitle>
                  </div>
                  <Badge variant={rec.priority === "high" ? "destructive" : "secondary"} className="capitalize">
                    {rec.priority === "high" ? "Hoch" : rec.priority === "medium" ? "Mittel" : "Niedrig"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{rec.description}</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Auswirkung:</p>
                  <p className="text-sm text-muted-foreground">{rec.impact}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">Empfohlene Aktion:</p>
                  <p className="text-sm">{rec.action}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
