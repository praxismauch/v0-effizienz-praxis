"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash2, Search, Filter, Download, Shield, Library, Calculator } from "lucide-react"
import type { useParameters } from "./hooks/use-parameters"

type ParametersHook = ReturnType<typeof useParameters>

interface ParametersTabProps {
  hook: ParametersHook
  onOpenCreateDialog: () => void
  onOpenImportLibraryDialog: () => void
}

export function ParametersTab({ hook, onOpenCreateDialog, onOpenImportLibraryDialog }: ParametersTabProps) {
  const {
    filteredParameters, searchTerm, setSearchTerm, selectedCategory, setSelectedCategory,
    selectedInterval, setSelectedInterval, categories, intervalBadgeColors,
    isLoadingPractice, practiceError, handleEditParameter, setDeleteParameterId, t,
  } = hook

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("kpi.parameters.title", "Practice Parameters")}</CardTitle>
            <CardDescription>{t("kpi.parameters.description", "Manage parameters for analysis and reporting")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent" onClick={onOpenImportLibraryDialog}>
              <Download className="h-4 w-4" />
              {t("kpi.import_from_library", "Import from Library")}
            </Button>
            <Button className="gap-2" onClick={onOpenCreateDialog}>
              <Plus className="h-4 w-4" />
              {t("kpi.create_parameter", "Create Parameter")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedInterval} onValueChange={setSelectedInterval} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="yearly">{t("kpi.yearly", "Yearly")}</TabsTrigger>
            <TabsTrigger value="quarterly">{t("kpi.quarterly", "Quarterly")}</TabsTrigger>
            <TabsTrigger value="monthly">{t("kpi.monthly", "Monthly")}</TabsTrigger>
            <TabsTrigger value="weekly">{t("kpi.weekly", "Weekly")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("kpi.search_parameters", "Search parameters...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("kpi.choose_category", "Choose category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("kpi.all_categories", "All Categories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoadingPractice ? (
          <div className="text-center py-8 text-muted-foreground">{t("kpi.loading_parameters", "Loading practice parameters...")}</div>
        ) : practiceError ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-2">{t("kpi.load_failed", "Failed to load practice parameters")}</p>
            <p className="text-sm text-muted-foreground">{practiceError}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("kpi.name", "Name")}</TableHead>
                <TableHead>{t("kpi.category", "Category")}</TableHead>
                <TableHead>{t("kpi.interval", "Interval")}</TableHead>
                <TableHead>{t("kpi.status", "Status")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParameters.map((parameter) => (
                <TableRow key={parameter.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {parameter.templateId && <Library className="h-4 w-4 text-primary flex-shrink-0" />}
                      {parameter.type === "calculated" && <Calculator className="h-4 w-4 text-blue-500" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{parameter.name}</span>
                          {parameter.templateId && <Badge variant="secondary" className="text-xs">{t("kpi.from_library", "From Library")}</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">{parameter.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{parameter.category}</Badge></TableCell>
                  <TableCell>
                    <IntervalBadge interval={parameter.interval} colors={intervalBadgeColors} t={t} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={parameter.isActive ? "default" : "secondary"}>
                      {parameter.isActive ? t("kpi.active", "Active") : t("kpi.inactive", "Inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!parameter.isGlobal ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t("kpi.actions", "Actions")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditParameter(parameter)}><Edit className="mr-2 h-4 w-4" />{t("kpi.edit", "Edit")}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteParameterId(parameter.id)}><Trash2 className="mr-2 h-4 w-4" />{t("kpi.delete", "Delete")}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Badge variant="secondary" className="text-xs"><Shield className="mr-1 h-3 w-3" />{t("kpi.template", "Template")}</Badge>
                    )}
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

function IntervalBadge({ interval, colors, t }: { interval?: string; colors: Record<string, string>; t: (key: string, fallback: string) => string }) {
  const key = interval || "monthly"
  const color = colors[key] || colors.monthly
  const labels: Record<string, string> = {
    weekly: t("kpi.interval_weekly", "Weekly"),
    monthly: t("kpi.interval_monthly", "Monthly"),
    quarterly: t("kpi.interval_quarterly", "Quarterly"),
    yearly: t("kpi.interval_yearly", "Yearly"),
  }
  return (
    <Badge variant="default" style={{ backgroundColor: color, color: "#ffffff" }}>
      {labels[key] || labels.monthly}
    </Badge>
  )
}
