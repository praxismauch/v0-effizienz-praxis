import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface ArbeitsmittelStatsProps {
  stats: {
    total: number
    available: number
    assigned: number
    maintenance: number
  }
}

export function ArbeitsmittelStats({ stats }: ArbeitsmittelStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verfügbar</CardTitle>
          <Badge className="bg-emerald-500">{stats.available}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.available}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Zugewiesen</CardTitle>
          <Badge className="bg-blue-500">{stats.assigned}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.assigned}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Wartung</CardTitle>
          <Badge className="bg-amber-500">{stats.maintenance}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.maintenance}</div>
        </CardContent>
      </Card>
    </div>
  )
}
