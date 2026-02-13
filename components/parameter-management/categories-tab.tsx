"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Download, Users, Library } from "lucide-react"
import type { ParameterGroup } from "./types"

interface CategoriesTabProps {
  groups: ParameterGroup[]
  onEdit: (group: ParameterGroup) => void
  onDelete: (id: string) => void
  onOpenCreateDialog: () => void
  onOpenImportDialog: () => void
  t: (key: string, fallback: string) => string
}

export function CategoriesTab({ groups, onEdit, onDelete, onOpenCreateDialog, onOpenImportDialog, t }: CategoriesTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("kpi.categories.title", "KPI Categories")}</CardTitle>
            <CardDescription>{t("kpi.categories.description", "Create categories of parameters for dashboard visualizations")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={onOpenImportDialog}>
              <Download className="h-4 w-4" />
              {t("kpi.import_from_template", "Import from Template")}
            </Button>
            <Button className="gap-2" onClick={onOpenCreateDialog}>
              <Plus className="h-4 w-4" />
              {t("kpi.create_category", "Create Category")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${group.color}`} />
                    {group.templateId && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Library className="h-3 w-3" />
                        {t("kpi.from_library", "From Library")}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t("kpi.actions", "Actions")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(group)}><Edit className="mr-2 h-4 w-4" />{t("kpi.edit", "Edit")}</DropdownMenuItem>
                      <DropdownMenuItem><Users className="mr-2 h-4 w-4" />{t("kpi.manage_parameters", "Manage Parameters")}</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(group.id)}><Trash2 className="mr-2 h-4 w-4" />{t("kpi.delete", "Delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-base">{group.name}</CardTitle>
                <CardDescription className="text-sm">{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{group.parameters.length} {t("kpi.parameters_count", "parameters")}</span>
                  <Badge variant={group.isActive ? "default" : "secondary"}>
                    {group.isActive ? t("kpi.active", "Active") : t("kpi.inactive", "Inactive")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
