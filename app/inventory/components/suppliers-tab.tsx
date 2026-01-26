"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus } from "lucide-react"
import type { Supplier } from "../types"

interface SuppliersTabProps {
  suppliers: Supplier[]
  onCreateSupplier: () => void
}

export function SuppliersTab({ suppliers, onCreateSupplier }: SuppliersTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lieferanten</CardTitle>
            <CardDescription>Verwalten Sie Ihre Materiallieferanten</CardDescription>
          </div>
          <Button onClick={onCreateSupplier}>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Lieferant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suppliers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Lieferanten angelegt</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={onCreateSupplier}>
              <Plus className="mr-2 h-4 w-4" />
              Ersten Lieferanten anlegen
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Building2 className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{supplier.name}</CardTitle>
                        {supplier.contact_person && <p className="text-sm text-muted-foreground">{supplier.contact_person}</p>}
                      </div>
                    </div>
                    {supplier.is_preferred && <Badge className="bg-emerald-500">Bevorzugt</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {supplier.email && <p className="text-muted-foreground">{supplier.email}</p>}
                  {supplier.phone && <p className="text-muted-foreground">{supplier.phone}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
