"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, RefreshCcw } from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import type { PracticeSubscription } from "./types"
import { getStatusColor, getStatusLabel } from "./types"

interface SubscriptionsTableProps {
  subscriptions: PracticeSubscription[]
  loading: boolean
  onEdit: (subscription: PracticeSubscription) => void
  onRefresh: () => void
}

export function SubscriptionsTable({ subscriptions, loading, onEdit, onRefresh }: SubscriptionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Praxis-Abonnements</CardTitle>
        <CardDescription>Übersicht aller Abonnements</CardDescription>
        <div className="absolute top-4 right-4">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Aktualisieren
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Lade Daten...</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Keine Abonnements vorhanden</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Praxis</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preis</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.practices?.name}</div>
                      <div className="text-sm text-muted-foreground">{sub.practices?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{sub.subscription_plans?.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sub.status)}>{getStatusLabel(sub.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {((sub.subscription_plans?.price_monthly || 0) / 100).toLocaleString("de-DE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    €
                  </TableCell>
                  <TableCell className="text-sm">
                    {sub.current_period_start && formatDateDE(new Date(sub.current_period_start))} -{" "}
                    {sub.current_period_end && formatDateDE(new Date(sub.current_period_end))}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(sub)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
