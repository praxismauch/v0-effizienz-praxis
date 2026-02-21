import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar } from "lucide-react"
import { formatOvertimeMinutes } from "./overtime-utils"

interface OvertimeSummaryCardsProps {
  totals: {
    total: number
    week: number
    month: number
  }
}

export function OvertimeSummaryCards({ totals }: OvertimeSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gesamt Überstunden</p>
              <p className="text-2xl font-bold">{formatOvertimeMinutes(totals.total)} h</p>
            </div>
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Diese Woche</p>
              <p className="text-2xl font-bold">{formatOvertimeMinutes(totals.week)} h</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dieser Monat</p>
              <p className="text-2xl font-bold">{formatOvertimeMinutes(totals.month)} h</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
