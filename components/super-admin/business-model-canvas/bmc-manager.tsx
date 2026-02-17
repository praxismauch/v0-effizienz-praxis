"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Save, Download, Sparkles, FileText, Target, CheckCircle2, BarChart3,
  TrendingUp, Printer, RefreshCw,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useBMC } from "./hooks/use-bmc"
import { CanvasSectionCard } from "./canvas-section-card"

export default function BusinessModelCanvasManager() {
  const { toast } = useToast()
  const bmc = useBMC()

  const cardProps = {
    isAddingItem: bmc.isAddingItem,
    setIsAddingItem: bmc.setIsAddingItem,
    newItemText: bmc.newItemText,
    setNewItemText: bmc.setNewItemText,
    onAddItem: bmc.addItem,
    onDeleteItem: bmc.deleteItem,
    onEditItem: (sectionId: string, item: any) => bmc.setEditingItem({ sectionId, item }),
  }

  if (bmc.isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Canvas...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Model Canvas</h2>
          <p className="text-muted-foreground">Visualisieren und entwickeln Sie Ihr Geschaeftsmodell</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={bmc.exportCanvas}>
                <FileText className="mr-2 h-4 w-4" />
                Als JSON exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={bmc.exportMarkdown}>
                <FileText className="mr-2 h-4 w-4" />
                Als Markdown exportieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={() => bmc.saveData(bmc.data)} disabled={bmc.isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {bmc.isSaving ? "Speichere..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vollstaendigkeit</p>
                <p className="text-2xl font-bold">{bmc.completeness}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Einträge gesamt</p>
                <p className="text-2xl font-bold">{bmc.totalItems}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hohe Priorität</p>
                <p className="text-2xl font-bold">{bmc.highPriorityItems}</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Einträge</p>
                <p className="text-2xl font-bold">{bmc.activeItems}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={bmc.activeTab} onValueChange={bmc.setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="ai">KI-Assistent</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {/* Row 1 */}
            <CanvasSectionCard section={bmc.getSectionById("key-partners")} sectionId="key-partners" {...cardProps} />
            <CanvasSectionCard section={bmc.getSectionById("key-activities")} sectionId="key-activities" {...cardProps} />
            <CanvasSectionCard section={bmc.getSectionById("value-propositions")} sectionId="value-propositions" className="row-span-2" showStatus {...cardProps} />
            <CanvasSectionCard section={bmc.getSectionById("customer-relationships")} sectionId="customer-relationships" {...cardProps} />
            <CanvasSectionCard section={bmc.getSectionById("customer-segments")} sectionId="customer-segments" {...cardProps} />
            {/* Row 2 */}
            <CanvasSectionCard section={bmc.getSectionById("key-resources")} sectionId="key-resources" className="col-span-2" {...cardProps} />
            <CanvasSectionCard section={bmc.getSectionById("channels")} sectionId="channels" className="col-span-2" {...cardProps} />
            {/* Row 3 */}
            <CanvasSectionCard section={bmc.getSectionById("cost-structure")} sectionId="cost-structure" className="col-span-2" {...cardProps} />
            <div /> {/* Spacer */}
            <CanvasSectionCard section={bmc.getSectionById("revenue-streams")} sectionId="revenue-streams" className="col-span-2" {...cardProps} />
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                KI-Assistent
              </CardTitle>
              <CardDescription>Lassen Sie die KI Vorschläge für Ihr Business Model Canvas generieren</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Beschreiben Sie, was Sie analysieren möchten</Label>
                <Textarea
                  value={bmc.aiPrompt}
                  onChange={(e) => bmc.setAiPrompt(e.target.value)}
                  placeholder="z.B. Analysiere mögliche neue Kundensegmente..."
                  rows={4}
                />
              </div>
              <Button onClick={bmc.generateWithAI} disabled={bmc.isGenerating || !bmc.aiPrompt.trim()}>
                {bmc.isGenerating ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Generiere...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />Vorschläge generieren</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Einstellungen</CardTitle>
              <CardDescription>Canvas-Einstellungen und Aktionen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auf Standard zurücksetzen</p>
                  <p className="text-sm text-muted-foreground">Setzt alle Einträge auf die Standardwerte zurück</p>
                </div>
                <Button variant="destructive" onClick={bmc.resetToDefault}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Zurücksetzen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={!!bmc.editingItem} onOpenChange={() => bmc.setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Details dieses Eintrags</DialogDescription>
          </DialogHeader>
          {bmc.editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Text</Label>
                <Input
                  value={bmc.editingItem.item.text}
                  onChange={(e) => bmc.setEditingItem({
                    ...bmc.editingItem!,
                    item: { ...bmc.editingItem!.item, text: e.target.value },
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Priorität</Label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={bmc.editingItem!.item.priority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => bmc.setEditingItem({
                        ...bmc.editingItem!,
                        item: { ...bmc.editingItem!.item, priority: p },
                      })}
                    >
                      {p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  {(["active", "planned", "archived"] as const).map((s) => (
                    <Button
                      key={s}
                      variant={bmc.editingItem!.item.status === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => bmc.setEditingItem({
                        ...bmc.editingItem!,
                        item: { ...bmc.editingItem!.item, status: s },
                      })}
                    >
                      {s === "active" ? "Aktiv" : s === "planned" ? "Geplant" : "Archiviert"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notizen</Label>
                <Textarea
                  value={bmc.editingItem.item.notes || ""}
                  onChange={(e) => bmc.setEditingItem({
                    ...bmc.editingItem!,
                    item: { ...bmc.editingItem!.item, notes: e.target.value },
                  })}
                  placeholder="Zusaetzliche Notizen..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => bmc.setEditingItem(null)}>Abbrechen</Button>
            <Button onClick={() => {
              if (bmc.editingItem) {
                bmc.updateItem(bmc.editingItem.sectionId, bmc.editingItem.item.id, bmc.editingItem.item)
                bmc.setEditingItem(null)
                toast({ title: "Gespeichert", description: "Änderungen wurden übernommen." })
              }
            }}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
