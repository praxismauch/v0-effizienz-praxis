"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, Globe, Check, Plus } from "lucide-react"
import type { Parameter, ParameterGroup, GlobalParameter } from "./types"

// --- Parameter Create/Edit Form Fields ---
function ParameterFormFields({
  newParameter, setNewParameter, categoryNames, parameters, t, idPrefix = "",
}: {
  newParameter: Partial<Parameter>
  setNewParameter: (p: Partial<Parameter>) => void
  categoryNames: string[]
  parameters: Parameter[]
  t: (key: string, fallback: string) => string
  idPrefix?: string
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${idPrefix}param-name`}>{t("kpi.parameter_name", "Parameter Name")}</Label>
          <Input id={`${idPrefix}param-name`} value={newParameter.name || ""} onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })} placeholder={t("kpi.parameter_name_placeholder", "z.B. Teamgroesse")} />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}parameter-category`}>{t("kpi.category", "Category")}</Label>
          <Select value={newParameter.category || ""} onValueChange={(value) => setNewParameter({ ...newParameter, category: value })}>
            <SelectTrigger><SelectValue placeholder={t("kpi.select_category", "Select category")} /></SelectTrigger>
            <SelectContent>
              {categoryNames.length === 0 ? (
                <SelectItem value="none" disabled>{t("kpi.no_categories", "No categories available.")}</SelectItem>
              ) : (
                categoryNames.filter((c) => c?.trim()).map((cat, i) => (
                  <SelectItem key={`${idPrefix}cat-${i}-${cat}`} value={cat}>{cat}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Input className="mt-2" placeholder={t("kpi.new_category_placeholder", "Or enter new category name")} value={newParameter.category || ""} onChange={(e) => setNewParameter({ ...newParameter, category: e.target.value })} />
        </div>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}param-description`}>{t("kpi.description", "Description")}</Label>
        <Textarea id={`${idPrefix}param-description`} value={newParameter.description || ""} onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })} placeholder={t("kpi.description_placeholder", "Parameter description...")} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`${idPrefix}param-unit`}>{t("kpi.unit_optional", "Unit (optional)")}</Label>
          <Input id={`${idPrefix}param-unit`} value={newParameter.unit || ""} onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })} placeholder={t("kpi.unit_placeholder", "z.B. Personen, Stunden, %, EUR")} />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}param-interval`}>{t("kpi.interval", "Reporting Interval")}</Label>
          <Select value={newParameter.interval || "monthly"} onValueChange={(value: "weekly" | "monthly" | "quarterly" | "yearly") => setNewParameter({ ...newParameter, interval: value })}>
            <SelectTrigger id={`${idPrefix}param-interval`}><SelectValue placeholder={t("kpi.select_interval", "Select interval")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">{t("kpi.interval_weekly", "Weekly")}</SelectItem>
              <SelectItem value="monthly">{t("kpi.interval_monthly", "Monthly")}</SelectItem>
              <SelectItem value="quarterly">{t("kpi.interval_quarterly", "Quarterly")}</SelectItem>
              <SelectItem value="yearly">{t("kpi.interval_yearly", "Yearly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {newParameter.type === "numeric" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${idPrefix}param-min`}>{t("kpi.min_value", "Min Value")}</Label>
              <Input id={`${idPrefix}param-min`} type="number" value={newParameter.min ?? ""} onChange={(e) => setNewParameter({ ...newParameter, min: Number.parseFloat(e.target.value) })} placeholder={t("kpi.enter_min_value", "e.g. 0")} />
            </div>
            <div>
              <Label htmlFor={`${idPrefix}param-max`}>{t("kpi.max_value", "Max Value")}</Label>
              <Input id={`${idPrefix}param-max`} type="number" value={newParameter.max ?? ""} onChange={(e) => setNewParameter({ ...newParameter, max: Number.parseFloat(e.target.value) })} placeholder={t("kpi.enter_max_value", "e.g. 100")} />
            </div>
          </div>
          <div>
            <Label htmlFor={`${idPrefix}param-target`}>{t("kpi.target_value", "Target Value")}</Label>
            <Input id={`${idPrefix}param-target`} type="number" value={newParameter.target ?? ""} onChange={(e) => setNewParameter({ ...newParameter, target: Number.parseFloat(e.target.value) })} placeholder={t("kpi.enter_target_value", "e.g. 50")} />
          </div>
        </>
      )}
      <div>
        <Label htmlFor={`${idPrefix}param-data-collection-start`}>{t("kpi.data_collection_start", "Beginn der Datensammlung")}</Label>
        <Input id={`${idPrefix}param-data-collection-start`} type="date" value={newParameter.dataCollectionStart || ""} onChange={(e) => setNewParameter({ ...newParameter, dataCollectionStart: e.target.value })} />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id={`${idPrefix}param-active`} checked={newParameter.isActive} onCheckedChange={(checked) => setNewParameter({ ...newParameter, isActive: checked })} />
        <Label htmlFor={`${idPrefix}param-active`}>{t("kpi.active", "Active")}</Label>
      </div>
      {newParameter.type === "calculated" && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div>
            <Label htmlFor={`${idPrefix}param-formula`}>Formula</Label>
            <Input id={`${idPrefix}param-formula`} value={newParameter.formula || ""} onChange={(e) => setNewParameter({ ...newParameter, formula: e.target.value })} placeholder="e.g. ({Parameter1} + {Parameter2}) / 2" />
            <p className="text-xs text-muted-foreground mt-1">{"Use {Parameter Name} to reference other parameters"}</p>
          </div>
          <div>
            <Label>Dependencies</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {parameters.filter((p) => p.type !== "calculated").map((param) => (
                <Badge key={param.id} variant={newParameter.dependencies?.includes(param.id) ? "default" : "outline"} className="cursor-pointer"
                  onClick={() => {
                    const deps = newParameter.dependencies || []
                    setNewParameter({ ...newParameter, dependencies: deps.includes(param.id) ? deps.filter((id) => id !== param.id) : [...deps, param.id] })
                  }}>
                  {param.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Create Parameter Dialog ---
export function CreateParameterDialog({
  open, onOpenChange, newParameter, setNewParameter, categoryNames, parameters, onSubmit, t,
}: {
  open: boolean; onOpenChange: (open: boolean) => void
  newParameter: Partial<Parameter>; setNewParameter: (p: Partial<Parameter>) => void
  categoryNames: string[]; parameters: Parameter[]
  onSubmit: () => void; t: (key: string, fallback: string) => string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("kpi.create_new_parameter", "Create New Parameter")}</DialogTitle>
          <DialogDescription>{t("kpi.create_parameter_description", "Create a new parameter for analysis dashboards")}</DialogDescription>
        </DialogHeader>
        <ParameterFormFields newParameter={newParameter} setNewParameter={setNewParameter} categoryNames={categoryNames} parameters={parameters} t={t} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={onSubmit}>{t("kpi.create_parameter", "Create Parameter")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Edit Parameter Dialog ---
export function EditParameterDialog({
  open, onOpenChange, newParameter, setNewParameter, categoryNames, parameters, onSubmit, t,
}: {
  open: boolean; onOpenChange: (open: boolean) => void
  newParameter: Partial<Parameter>; setNewParameter: (p: Partial<Parameter>) => void
  categoryNames: string[]; parameters: Parameter[]
  onSubmit: () => void; t: (key: string, fallback: string) => string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("kpi.edit_parameter", "Edit Parameter")}</DialogTitle>
          <DialogDescription>{t("kpi.edit_parameter_description", "Update parameter settings and configuration")}</DialogDescription>
        </DialogHeader>
        <ParameterFormFields newParameter={newParameter} setNewParameter={setNewParameter} categoryNames={categoryNames} parameters={parameters} t={t} idPrefix="edit-" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={onSubmit}>{t("kpi.update_parameter", "Update Parameter")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Group Create/Edit Dialogs ---
const COLOR_OPTIONS = [
  { value: "bg-blue-500", label: "Blue" }, { value: "bg-green-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" }, { value: "bg-orange-500", label: "Orange" },
  { value: "bg-red-500", label: "Red" }, { value: "bg-pink-500", label: "Pink" },
  { value: "bg-yellow-500", label: "Yellow" }, { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-teal-500", label: "Teal" }, { value: "bg-cyan-500", label: "Cyan" },
  { value: "bg-lime-500", label: "Lime" }, { value: "bg-amber-500", label: "Amber" },
  { value: "bg-rose-500", label: "Rose" }, { value: "bg-violet-500", label: "Violet" },
  { value: "bg-emerald-500", label: "Emerald" }, { value: "bg-gray-500", label: "Gray" },
]

function GroupFormFields({ newGroup, setNewGroup, t }: { newGroup: Partial<ParameterGroup>; setNewGroup: (g: Partial<ParameterGroup>) => void; t: (key: string, fallback: string) => string }) {
  return (
    <div className="grid gap-4 py-4">
      <div>
        <Label htmlFor="group-name">{t("kpi.category_name", "Category Name")}</Label>
        <Input id="group-name" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} placeholder={t("kpi.category_name_placeholder", "e.g. Daily Practice Metrics")} />
      </div>
      <div>
        <Label htmlFor="group-description">{t("kpi.description", "Description")}</Label>
        <Textarea id="group-description" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} placeholder={t("kpi.description_placeholder", "Description of the KPI category...")} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="group-color">{t("kpi.color", "Color")}</Label>
          <Select value={newGroup.color} onValueChange={(value) => setNewGroup({ ...newGroup, color: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{t(`common.colors.${opt.label.toLowerCase()}`, opt.label)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch id="group-active" checked={newGroup.isActive} onCheckedChange={(checked) => setNewGroup({ ...newGroup, isActive: checked })} />
          <Label htmlFor="group-active">{t("kpi.active", "Active")}</Label>
        </div>
      </div>
    </div>
  )
}

export function CreateGroupDialog({ open, onOpenChange, newGroup, setNewGroup, onSubmit, t }: { open: boolean; onOpenChange: (open: boolean) => void; newGroup: Partial<ParameterGroup>; setNewGroup: (g: Partial<ParameterGroup>) => void; onSubmit: () => void; t: (key: string, fallback: string) => string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("kpi.create_new_category", "Create New KPI Category")}</DialogTitle>
          <DialogDescription>{t("kpi.create_category_description", "Category parameters for shared dashboard views")}</DialogDescription>
        </DialogHeader>
        <GroupFormFields newGroup={newGroup} setNewGroup={setNewGroup} t={t} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={onSubmit}>{t("kpi.create_category", "Create Category")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function EditGroupDialog({ open, onOpenChange, newGroup, setNewGroup, onSubmit, t }: { open: boolean; onOpenChange: (open: boolean) => void; newGroup: Partial<ParameterGroup>; setNewGroup: (g: Partial<ParameterGroup>) => void; onSubmit: () => void; t: (key: string, fallback: string) => string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("kpi.edit_category", "Edit KPI Category")}</DialogTitle>
          <DialogDescription>{t("kpi.edit_category_description", "Update category settings")}</DialogDescription>
        </DialogHeader>
        <GroupFormFields newGroup={newGroup} setNewGroup={setNewGroup} t={t} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={onSubmit}>{t("kpi.update_category", "Update Category")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Delete Confirmation Dialogs ---
export function DeleteParameterDialog({ open, onClose, onConfirm, t }: { open: boolean; onClose: () => void; onConfirm: () => void; t: (key: string, fallback: string) => string }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("kpi.delete_parameter", "Delete Parameter")}</AlertDialogTitle>
          <AlertDialogDescription>{t("kpi.delete_parameter_confirmation", "Are you sure you want to delete this parameter? This action cannot be undone.")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("kpi.delete", "Delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteGroupDialog({ open, onClose, onConfirm, t }: { open: boolean; onClose: () => void; onConfirm: () => void; t: (key: string, fallback: string) => string }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("kpi.delete_category", "Delete KPI Category")}</AlertDialogTitle>
          <AlertDialogDescription>{t("kpi.delete_category_confirmation", "Are you sure you want to delete this KPI category? This action cannot be undone.")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("kpi.delete", "Delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteGlobalTemplateDialog({ open, onClose, onConfirm, t }: { open: boolean; onClose: () => void; onConfirm: () => void; t: (key: string, fallback: string) => string }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("kpi.remove_global_template", "Remove Global KPI Template")}</AlertDialogTitle>
          <AlertDialogDescription>{t("kpi.remove_global_template_confirmation", "Are you sure you want to remove this global KPI template?")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("kpi.remove_template", "Remove Template")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// --- Browse Global Library Dialog ---
export function BrowseGlobalDialog({
  open, onOpenChange, globalParameters, usedTemplates, selectedTemplates, setSelectedTemplates,
  isLoading, error, onApply, t,
}: {
  open: boolean; onOpenChange: (open: boolean) => void
  globalParameters: GlobalParameter[]; usedTemplates: Set<string>
  selectedTemplates: Set<string>; setSelectedTemplates: (s: Set<string>) => void
  isLoading: boolean; error: string | null; onApply: () => void
  t: (key: string, fallback: string) => string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("kpi.browse_global_library", "Browse Global KPI Library")}</DialogTitle>
          <DialogDescription>{t("kpi.browse_global_library_description", "Select multiple global KPIs from the admin library to add to your practice templates.")}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t("kpi.loading_global_kpis", "Loading global KPIs...")}</div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">{t("kpi.load_global_failed", "Failed to load global KPIs")}</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {globalParameters.map((gp) => {
                const isUsed = usedTemplates.has(gp.id)
                const isSelected = selectedTemplates.has(gp.id)
                return (
                  <div key={gp.id} className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${isSelected ? "bg-primary/10 border-primary" : isUsed ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 opacity-60" : "hover:bg-accent/50"}`}>
                    <Checkbox checked={isSelected} disabled={isUsed} onCheckedChange={(checked) => {
                      if (isUsed) return
                      const next = new Set(selectedTemplates)
                      if (checked) next.add(gp.id); else next.delete(gp.id)
                      setSelectedTemplates(next)
                    }} />
                    <div className="flex items-center gap-3 flex-1">
                      <Globe className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {gp.name}
                          {isUsed && <Badge variant="default" className="bg-green-600 hover:bg-green-600"><Check className="h-3 w-3 mr-1" />{t("kpi.applied", "Applied")}</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{gp.description}</div>
                      </div>
                      <Badge variant="outline">{gp.category}</Badge>
                      <Badge variant="secondary">{gp.type}</Badge>
                      {gp.unit && <Badge variant="outline">{gp.unit}</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{selectedTemplates.size > 0 && `${selectedTemplates.size} template${selectedTemplates.size > 1 ? "s" : ""} selected`}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setSelectedTemplates(new Set()); onOpenChange(false) }}>{t("common.cancel", "Cancel")}</Button>
            <Button onClick={onApply} disabled={selectedTemplates.size === 0} className="gap-2">
              <Plus className="h-4 w-4" />{t("kpi.apply_selected", "Apply Selected")} ({selectedTemplates.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- Import Categories Dialog ---
export function ImportCategoriesDialog({
  open, onOpenChange, globalCategories, selectedIds, setSelectedIds,
  isLoading, onImport, t,
}: {
  open: boolean; onOpenChange: (open: boolean) => void
  globalCategories: ParameterGroup[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void
  isLoading: boolean; onImport: () => void
  t: (key: string, fallback: string) => string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("kpi.import_categories", "Import Categories from Template")}</DialogTitle>
          <DialogDescription>{t("kpi.import_categories_description", "Select categories from the Super Admin global templates to import into your practice")}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><div className="text-sm text-muted-foreground">Loading global categories...</div></div>
          ) : globalCategories.length === 0 ? (
            <div className="flex items-center justify-center py-8"><div className="text-sm text-muted-foreground">{t("kpi.no_global_categories", "No global categories available to import")}</div></div>
          ) : (
            <>
              <div className="flex justify-end mb-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedIds(selectedIds.length === globalCategories.length ? [] : globalCategories.map((c) => c.id))}>
                  {selectedIds.length === globalCategories.length ? t("kpi.deselect_all", "Deselect All") : t("kpi.select_all", "Select All")}
                </Button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {globalCategories.map((category) => (
                  <div key={category.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedIds(selectedIds.includes(category.id) ? selectedIds.filter((id) => id !== category.id) : [...selectedIds, category.id])}>
                    <Checkbox checked={selectedIds.includes(category.id)} onCheckedChange={(checked) => setSelectedIds(checked ? [...selectedIds, category.id] : selectedIds.filter((id) => id !== category.id))} onClick={(e) => e.stopPropagation()} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
          <Button onClick={onImport} disabled={selectedIds.length === 0}>{t("kpi.import", "Import")} {selectedIds.length > 0 && `(${selectedIds.length})`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
