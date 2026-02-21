"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, Trash2, Key, Laptop, Smartphone, ShirtIcon, Package } from "lucide-react"
import { useRouter } from "next/navigation"

const typeIcons: Record<string, any> = {
  Schlüssel: Key,
  Dienstkleidung: ShirtIcon,
  "Dienst Handy": Smartphone,
  "Dienst Laptop": Laptop,
  Sonstiges: Package,
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  assigned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  maintenance: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  retired: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const statusLabels: Record<string, string> = {
  available: "Verfügbar",
  assigned: "Zugewiesen",
  maintenance: "Wartung",
  retired: "Ausgemustert",
}

interface ArbeitsmittelTableProps {
  items: any[]
  teamMembers: any[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onEdit: (item: any) => void
  onDelete: (id: string) => void
}

export function ArbeitsmittelTable({ items, teamMembers, searchQuery, onSearchChange, onEdit, onDelete }: ArbeitsmittelTableProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Arbeitsmittel-Liste</CardTitle>
            <CardDescription>Alle Arbeitsmittel Ihrer Praxis</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Typ</TableHead>
                <TableHead className="min-w-[120px]">Name</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[140px]">Zugewiesen an</TableHead>
                <TableHead className="text-right min-w-[80px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Keine Arbeitsmittel gefunden
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const Icon = typeIcons[item.type] || Package
                  const assignedMember = item.assigned_to && Array.isArray(teamMembers)
                    ? teamMembers.find((m) => m.id === item.assigned_to || m.user_id === item.assigned_to)
                    : null
                  return (
                    <TableRow
                      key={item.id}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/arbeitsmittel/${item.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="whitespace-nowrap">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[item.status]}>
                          {statusLabels[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignedMember ? `${assignedMember.first_name} ${assignedMember.last_name}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
