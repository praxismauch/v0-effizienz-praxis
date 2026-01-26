"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Archive, ImageIcon, FileText, Eye } from "lucide-react"
import type { InventoryBill } from "../types"

interface ArchiveTabProps {
  bills: InventoryBill[]
  loading: boolean
  onViewDetails: (bill: InventoryBill) => void
}

export function ArchiveTab({ bills, loading, onViewDetails }: ArchiveTabProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-muted-foreground" />
            Archivierte Rechnungen
          </CardTitle>
          <CardDescription>Rechnungen deren Artikel bereits in den Bestand übernommen wurden</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine archivierten Rechnungen</p>
            <p className="text-sm">Analysierte Rechnungen werden hier archiviert, nachdem Sie die Artikel übernommen haben</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datei</TableHead>
                <TableHead>Lieferant</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead className="text-center">Artikel</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {bill.file_type?.startsWith("image/") ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium truncate max-w-[200px]">{bill.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{bill.supplier_name || "-"}</TableCell>
                  <TableCell>{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString("de-DE") : "-"}</TableCell>
                  <TableCell className="text-right">
                    {bill.total_amount ? `${bill.total_amount.toFixed(2)} ${bill.currency || "€"}` : "-"}
                  </TableCell>
                  <TableCell className="text-center">{bill.extracted_items?.length || 0}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(bill)}>
                      <Eye className="h-4 w-4" />
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
