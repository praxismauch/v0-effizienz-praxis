"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Receipt, Zap, Loader2, CheckSquare } from "lucide-react"
import type { InventoryItem, InventoryBill } from "../types"
import { CATEGORIES } from "../types"

interface ItemFormState {
  name: string
  barcode: string
  category: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit: string
  price: number
}

interface CreateItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ItemFormState
  onFormChange: (data: ItemFormState) => void
  onSubmit: () => void
  disabled: boolean
}

export function CreateItemDialog({ open, onOpenChange, formData, onFormChange, onSubmit, disabled }: CreateItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Artikel</DialogTitle>
          <DialogDescription>Fügen Sie einen neuen Artikel zum Bestand hinzu</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Artikelname"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={formData.category} onValueChange={(v) => onFormChange({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Einheit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => onFormChange({ ...formData, unit: e.target.value })}
                placeholder="Stück"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="current_stock">Aktueller Bestand</Label>
              <Input
                id="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => onFormChange({ ...formData, current_stock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Stückpreis (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => onFormChange({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="min_stock">Mindestbestand</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => onFormChange({ ...formData, min_stock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max_stock">Maximalbestand</Label>
              <Input
                id="max_stock"
                type="number"
                value={formData.max_stock}
                onChange={(e) => onFormChange({ ...formData, max_stock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={!formData.name.trim() || disabled}>
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ItemFormState
  onFormChange: (data: ItemFormState) => void
  onSubmit: () => void
  disabled: boolean
}

export function EditItemDialog({ open, onOpenChange, formData, onFormChange, onSubmit, disabled }: EditItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Artikel bearbeiten</DialogTitle>
          <DialogDescription>Bearbeiten Sie die Artikelinformationen</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
              placeholder="Artikelname"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Kategorie</Label>
              <Select value={formData.category} onValueChange={(v) => onFormChange({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-unit">Einheit</Label>
              <Input
                id="edit-unit"
                value={formData.unit}
                onChange={(e) => onFormChange({ ...formData, unit: e.target.value })}
                placeholder="Stück"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-current_stock">Aktueller Bestand</Label>
              <Input
                id="edit-current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => onFormChange({ ...formData, current_stock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-price">Stückpreis (€)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => onFormChange({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-min_stock">Mindestbestand</Label>
              <Input
                id="edit-min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => onFormChange({ ...formData, min_stock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-max_stock">Maximalbestand</Label>
              <Input
                id="edit-max_stock"
                type="number"
                value={formData.max_stock}
                onChange={(e) => onFormChange({ ...formData, max_stock: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSubmit} disabled={!formData.name.trim() || disabled}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface BillDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: InventoryBill | null
  selectedItems: number[]
  onSelectedItemsChange: (items: number[]) => void
  onApply: () => void
  applying: boolean
}

export function BillDetailDialog({
  open,
  onOpenChange,
  bill,
  selectedItems,
  onSelectedItemsChange,
  onApply,
  applying,
}: BillDetailDialogProps) {
  if (!bill) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rechnungsdetails
          </DialogTitle>
          <DialogDescription>{bill.file_name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          {bill.file_type?.startsWith("image/") && (
            <div className="rounded-lg border overflow-hidden">
              <img src={bill.file_url || "/placeholder.svg"} alt={bill.file_name} className="w-full max-h-[300px] object-contain bg-muted" />
            </div>
          )}

          {/* Extracted Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Lieferant</Label>
              <p className="font-medium">{bill.supplier_name || "-"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Rechnungsnummer</Label>
              <p className="font-medium">{bill.bill_number || "-"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Datum</Label>
              <p className="font-medium">{bill.bill_date ? new Date(bill.bill_date).toLocaleDateString("de-DE") : "-"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground">Gesamtbetrag</Label>
              <p className="font-medium">{bill.total_amount ? `${bill.total_amount.toFixed(2)} ${bill.currency || "€"}` : "-"}</p>
            </div>
          </div>

          {/* Extracted Items */}
          {bill.extracted_items && bill.extracted_items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Extrahierte Artikel</Label>
                {!bill.is_archived && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedItems.length === bill.extracted_items!.length) {
                        onSelectedItemsChange([])
                      } else {
                        onSelectedItemsChange(bill.extracted_items!.map((_, i) => i))
                      }
                    }}
                  >
                    {selectedItems.length === bill.extracted_items.length ? "Alle abwählen" : "Alle auswählen"}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {bill.extracted_items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      selectedItems.includes(index) ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {!bill.is_archived && (
                      <Checkbox
                        checked={selectedItems.includes(index)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSelectedItemsChange([...selectedItems, index])
                          } else {
                            onSelectedItemsChange(selectedItems.filter((i) => i !== index))
                          }
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} × {item.unit_price?.toFixed(2) || "?"} € = {item.total_price?.toFixed(2) || "?"} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Confidence */}
          {bill.ai_confidence && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4 text-purple-500" />
              KI-Konfidenz: {Math.round(bill.ai_confidence * 100)}%
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          {!bill.is_archived && (
            <Button onClick={onApply} disabled={applying || (selectedItems.length === 0 && bill.extracted_items?.length === 0)}>
              {applying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="mr-2 h-4 w-4" />}
              {selectedItems.length > 0 ? `${selectedItems.length} Artikel übernehmen` : "Alle Artikel übernehmen"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  onConfirm: () => void
}

export function DeleteItemDialog({ open, onOpenChange, item, onConfirm }: DeleteItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie den Artikel "{item?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
