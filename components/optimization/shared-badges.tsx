import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status }: { status: "good" | "warning" | "critical" }) {
  if (status === "good") {
    return <Badge className="bg-green-100 text-green-800">Gut</Badge>
  } else if (status === "warning") {
    return <Badge className="bg-yellow-100 text-yellow-800">Warnung</Badge>
  }
  return <Badge variant="destructive">Kritisch</Badge>
}

export function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" | "info" }) {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">Hoch</Badge>
    case "medium":
      return <Badge className="bg-orange-100 text-orange-800">Mittel</Badge>
    case "low":
      return <Badge className="bg-yellow-100 text-yellow-800">Niedrig</Badge>
    default:
      return <Badge variant="secondary">Info</Badge>
  }
}

export function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-600"
    if (s >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${getColor(score)}`}>{score}%</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
