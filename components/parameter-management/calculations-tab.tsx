"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Calculator, Database } from "lucide-react"
import type { Parameter } from "./types"

interface CalculationsTabProps {
  parameters: Parameter[]
  onEdit: (parameter: Parameter) => void
  onCreateCalculation: () => void
  t: (key: string, fallback: string) => string
}

export function CalculationsTab({ parameters, onEdit, onCreateCalculation, t }: CalculationsTabProps) {
  const calculatedParams = parameters.filter((p) => p.type === "calculated")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("kpi.calculations.title", "Calculation Parameters")}</CardTitle>
            <CardDescription>{t("kpi.calculations.description", "Manage calculated parameters that derive values from other parameters")}</CardDescription>
          </div>
          <Button className="gap-2" onClick={onCreateCalculation}>
            <Calculator className="h-4 w-4" />
            {t("kpi.create_calculation", "Create Calculation")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {calculatedParams.map((parameter) => (
            <Card key={parameter.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">{parameter.name}</CardTitle>
                    <Badge variant="outline">{parameter.category}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t("kpi.actions", "Actions")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(parameter)}><Edit className="mr-2 h-4 w-4" />{t("kpi.edit_formula", "Edit Formula")}</DropdownMenuItem>
                      <DropdownMenuItem><Calculator className="mr-2 h-4 w-4" />{t("kpi.test_calculation", "Test Calculation")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>{parameter.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">{t("kpi.formula", "Formula")}</Label>
                  <code className="block mt-1 p-3 bg-muted rounded-md text-sm">{parameter.formula}</code>
                </div>
                <div>
                  <Label className="text-sm font-medium">{t("kpi.dependencies", "Dependencies")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {parameter.dependencies?.map((depId) => {
                      const depParam = parameters.find((p) => p.id === depId)
                      return depParam ? (
                        <Badge key={depId} variant="secondary" className="gap-1">
                          <Database className="h-3 w-3" />
                          {depParam.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("kpi.unit", "Unit")}: {parameter.unit || t("common.none", "None")}</span>
                  <Badge variant={parameter.isActive ? "default" : "secondary"}>
                    {parameter.isActive ? t("kpi.active", "Active") : t("kpi.inactive", "Inactive")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}

          {calculatedParams.length === 0 && (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("kpi.no_calculations", "No Calculated Parameters")}</h3>
              <p className="text-muted-foreground mb-4">{t("kpi.no_calculations_description", "Create calculated parameters to derive values from existing parameters")}</p>
              <Button onClick={onCreateCalculation}>
                <Plus className="mr-2 h-4 w-4" />
                {t("kpi.create_first_calculation", "Create First Calculation")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
