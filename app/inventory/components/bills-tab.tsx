"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Brain, Upload, Receipt, FileText, Loader2, Eye, CheckSquare, RefreshCw, Zap } from "lucide-react"
import type { InventoryBill } from "../types"

interface BillsTabProps {
  bills: InventoryBill[]
  loading: boolean
  uploading: boolean
  extractingBillId: string | null
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExtract: (billId: string) => void
  onViewDetails: (bill: InventoryBill) => void
  onApplyItems: (bill: InventoryBill) => void
}

export function BillsTab({
  bills,
  loading,
  uploading,
  extractingBillId,
  onUpload,
  onExtract,
  onViewDetails,
  onApplyItems,
}: BillsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              KI-Rechnungsanalyse
            </CardTitle>
            <CardDescription>
              Laden Sie Rechnungen hoch und lassen Sie die KI automatisch Artikel, Mengen und Preise extrahieren
            </CardDescription>
          </div>
          <div>
            <Label htmlFor="bill-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Rechnung hochladen
              </div>
            </Label>
            <Input
              id="bill-upload"
              type="file"
              accept="image/*,.pdf"
              multiple
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">Keine Rechnungen vorhanden</p>
            <p className="text-sm mb-4">
              Laden Sie Rechnungen oder Lieferscheine hoch, um den Materialfluss automatisch zu erfassen
            </p>
            <Label htmlFor="bill-upload-empty" className="cursor-pointer inline-block">
              <div className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-md hover:bg-muted/50 transition-colors">
                <Upload className="h-4 w-4" />
                Erste Rechnung hochladen
              </div>
            </Label>
            <Input id="bill-upload-empty" type="file" accept="image/*,.pdf" multiple className="hidden" onChange={onUpload} />
          </div>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Preview */}
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {bill.file_type?.startsWith("image/") ? (
                    <img src={bill.file_url || "/placeholder.svg"} alt={bill.file_name} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{bill.file_name}</p>
                    <Badge
                      variant="outline"
                      className={
                        bill.status === "completed"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : bill.status === "processing"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : bill.status === "failed"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                      }
                    >
                      {bill.status === "completed"
                        ? "Analysiert"
                        : bill.status === "processing"
                          ? "Wird analysiert..."
                          : bill.status === "failed"
                            ? "Fehler"
                            : "Ausstehend"}
                    </Badge>
                  </div>

                  {bill.status === "completed" && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {bill.supplier_name && (
                        <p>
                          Lieferant: <span className="font-medium">{bill.supplier_name}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        {bill.bill_date && <span>Datum: {new Date(bill.bill_date).toLocaleDateString("de-DE")}</span>}
                        {bill.total_amount && (
                          <span>
                            Summe: {bill.total_amount.toFixed(2)} {bill.currency || "€"}
                          </span>
                        )}
                        {bill.extracted_items && <span>{bill.extracted_items.length} Artikel</span>}
                      </div>
                      {bill.ai_confidence && (
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-purple-500" />
                          <span className="text-xs">{Math.round(bill.ai_confidence * 100)}% Konfidenz</span>
                        </div>
                      )}
                    </div>
                  )}

                  {bill.status === "failed" && bill.extraction_error && (
                    <p className="text-sm text-red-600">{bill.extraction_error}</p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    Hochgeladen am {new Date(bill.created_at).toLocaleDateString("de-DE")}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {bill.status === "pending" && (
                    <Button onClick={() => onExtract(bill.id)} disabled={extractingBillId === bill.id}>
                      {extractingBillId === bill.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                      Analysieren
                    </Button>
                  )}

                  {bill.status === "completed" && (
                    <>
                      <Button variant="outline" onClick={() => onViewDetails(bill)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Details
                      </Button>
                      <Button onClick={() => onApplyItems(bill)}>
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Übernehmen
                      </Button>
                    </>
                  )}

                  {bill.status === "failed" && (
                    <Button variant="outline" onClick={() => onExtract(bill.id)} disabled={extractingBillId === bill.id}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Erneut versuchen
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
