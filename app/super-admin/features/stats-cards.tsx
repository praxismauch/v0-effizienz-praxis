"use client"

import { Monitor, Server, Check, X, Sparkles, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsData {
  total: number
  enabled: number
  beta: number
  overrides: number
}

interface StatsCardsProps {
  frontend: StatsData
  backend: StatsData
  showOverrides: boolean
}

function StatLine({ icon: Icon, color, label, count }: { icon: React.ElementType; color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color}`} />
      <span className="text-sm">{count} {label}</span>
    </div>
  )
}

export function StatsCards({ frontend, backend, showOverrides }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4 text-blue-500" />
            Frontend (App)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <StatLine icon={Check} color="text-green-500" label="aktiv" count={frontend.enabled} />
            <StatLine icon={X} color="text-muted-foreground" label="deaktiviert" count={frontend.total - frontend.enabled} />
            <StatLine icon={Sparkles} color="text-violet-500" label="Beta" count={frontend.beta} />
            {showOverrides && frontend.overrides > 0 && (
              <StatLine icon={Building2} color="text-blue-500" label={"Uberschreibungen"} count={frontend.overrides} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4 text-orange-500" />
            Backend (Super-Admin)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <StatLine icon={Check} color="text-green-500" label="aktiv" count={backend.enabled} />
            <StatLine icon={X} color="text-muted-foreground" label="deaktiviert" count={backend.total - backend.enabled} />
            <StatLine icon={Sparkles} color="text-violet-500" label="Beta" count={backend.beta} />
            {showOverrides && backend.overrides > 0 && (
              <StatLine icon={Building2} color="text-blue-500" label={"Uberschreibungen"} count={backend.overrides} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
