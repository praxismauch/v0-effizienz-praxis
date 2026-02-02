"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Globe,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Filter,
  Calculator,
  Database,
  Copy,
  Shield,
  Users,
  BarChart3,
} from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { useTranslation } from "@/contexts/translation-context"

interface GlobalParameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select" | "calculated"
  category: string
  defaultValue?: string
  options?: string[]
  formula?: string
  dependencies?: string[]
  unit?: string // Added unit field back
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
  isActive: boolean
  isTemplate: boolean
  createdAt: string
  updatedAt: string
  usageCount: number // How many practices are using this parameter
  groupIds?: string[] // Added groupIds to track which groups this parameter belongs to
}

interface GlobalParameterGroup {
  id: string
  name: string
  description: string
  parameters: string[]
  color: string
  isActive: boolean
  isTemplate: boolean
  createdAt: string
  usageCount: number
}

// Map Tailwind bg colors to hex colors for border
const COLOR_MAP: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-green-500": "#22c55e",
  "bg-purple-500": "#a855f7",
  "bg-orange-500": "#f97316",
  "bg-red-500": "#ef4444",
  "bg-pink-500": "#ec4899",
  "bg-yellow-500": "#eab308",
  "bg-indigo-500": "#6366f1",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-lime-500": "#84cc16",
  "bg-amber-500": "#f59e0b",
  "bg-rose-500": "#f43f5e",
  "bg-violet-500": "#8b5cf6",
  "bg-emerald-500": "#10b981",
  "bg-gray-500": "#6b7280",
}

const GroupCard = memo(
  ({
    group,
    onEdit,
    onDuplicate,
    onDelete,
    isDeletingGroup,
  }: {
    group: GlobalParameterGroup
    onEdit: (group: GlobalParameterGroup) => void
    onDuplicate: (group: GlobalParameterGroup) => void
    onDelete: (id: string) => void
    isDeletingGroup: boolean
  }) => {
    const borderColor = COLOR_MAP[group.color || "bg-blue-500"] || "#3b82f6"
    
    return (
      <Card
        key={group.id}
        className="relative border-l-4"
        style={{ borderLeftColor: borderColor }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <div className={`w-3 h-3 rounded-full ${group.color || "bg-blue-500"}`} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(group)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(group)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplizieren
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(group.id)}
                  disabled={isDeletingGroup}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="text-lg">{group.name || "Unbenannte Kategorie"}</CardTitle>
          <CardDescription>{group.description || "Keine Beschreibung"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Parameter:</span>
              <Badge variant="outline">{group.parameters?.length || 0}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Verwendet von:</span>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>{group.usageCount || 0} Praxen</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={group.isActive ? "default" : "secondary"}>{group.isActive ? "Aktiv" : "Inaktiv"}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
)

GroupCard.displayName = "GroupCard"

export function GlobalParameterManagement() {
  const { t } = useTranslation()
  const [parameters, setParameters] = useState<GlobalParameter[]>([])
  const [groups, setGroups] = useState<GlobalParameterGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedInterval, setSelectedInterval] = useState<string>("all")
  const [isCreateParameterOpen, setIsCreateParameterOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isEditParameterOpen, setIsEditParameterOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [editingParameter, setEditingParameter] = useState<GlobalParameter | null>(null)
  const [editingGroup, setEditingGroup] = useState<GlobalParameterGroup | null>(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  const [parameterValues, setParameterValues] = useState<any[]>([])
  const [selectedParameterForValues, setSelectedParameterForValues] = useState<string | null>(null)
  const [isAddValueDialogOpen, setIsAddValueDialogOpen] = useState(false)
  const [newValue, setNewValue] = useState({
    value: "",
    recordedDate: new Date().toISOString().split("T")[0],
    notes: "",
  })

  const [newParameter, setNewParameter] = useState<Partial<GlobalParameter>>({
    name: "",
    description: "",
    type: "number",
    category: "",
    isActive: true,
    isTemplate: true,
    groupIds: [],
    defaultValue: "",
    formula: "",
    unit: "", // Added unit field back
    interval: "monthly",
  })

  const [newGroup, setNewGroup] = useState<Partial<GlobalParameterGroup>>({
    name: "",
    description: "",
    parameters: [],
    color: "bg-blue-500",
    isActive: true,
    isTemplate: true,
  })

  const categories = Array.from(new Set(parameters.map((p) => p.category)))
  const validCategories = categories.filter((cat) => cat && cat.trim() !== "")

  const displayCategories = useMemo(() => {
    // Extract category names from groups instead of parameters
    return groups
      .filter((group) => group && group.name && group.name.trim() !== "")
      .map((group) => ({ id: group.id, name: group.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [groups])

  const filteredParameters = parameters.filter((param) => {
    const matchesSearch =
      param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      param.description.toLowerCase().includes(searchTerm.toLowerCase())

    // Check if parameter belongs to selected group via groupIds
    const matchesCategory = selectedCategory === "all" || (param.groupIds && param.groupIds.includes(selectedCategory))

    const matchesInterval = selectedInterval === "all" || param.interval === selectedInterval

    return matchesSearch && matchesCategory && matchesInterval
  })

  const getParameterName = (id: string) => {
    const param = parameters.find((p) => p.id === id)
    return param ? param.name : `Parameter ${id}`
  }

  const transformParameterFromAPI = (apiParam: any): GlobalParameter => {
    return {
      id: apiParam.id,
      name: apiParam.name,
      description: apiParam.description,
      type: apiParam.type,
      category: apiParam.category || "",
      defaultValue: apiParam.default_value || undefined,
      options: apiParam.options,
      formula: apiParam.formula || undefined,
      dependencies: apiParam.dependencies,
      unit: apiParam.unit || undefined, // Added unit field back
      interval: apiParam.interval || "monthly",
      isActive: apiParam.is_active,
      isTemplate: apiParam.is_template,
      createdAt: apiParam.created_at,
      updatedAt: apiParam.updated_at,
      usageCount: apiParam.usage_count || 0,
      groupIds: apiParam.group_ids || apiParam.groupIds || [],
    }
  }

  const transformGroupFromAPI = (apiGroup: any): GlobalParameterGroup | null => {
    if (!apiGroup) {
      console.warn("[v0] transformGroupFromAPI received undefined/null apiGroup, skipping")
      return null
    }

    return {
      id: apiGroup.id,
      name: apiGroup.name,
      description: apiGroup.description,
      parameters: apiGroup.parameters || [],
      color: apiGroup.color,
      isActive: apiGroup.is_active ?? apiGroup.isActive,
      isTemplate: apiGroup.is_template ?? apiGroup.isTemplate,
      createdAt: apiGroup.created_at || apiGroup.createdAt, // FIXED: Changed apiParam to apiGroup
      usageCount: apiGroup.usage_count ?? apiGroup.usageCount ?? 0,
    }
  }

  useEffect(() => {
    fetchParameters()
    fetchGroups()
  }, [])

  const fetchParameters = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/global-parameters")

      if (!response.ok) {
        console.error("[v0] Failed to fetch parameters:", response.status)
        setParameters([])
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Invalid response content type")
        setParameters([])
        return
      }

      const data = await response.json()
      const transformedParameters = (data.parameters || []).map(transformParameterFromAPI)
      setParameters(transformedParameters)
    } catch (error) {
      console.error("[v0] Error fetching parameters:", error)
      setParameters([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/global-parameter-groups")

      if (!response.ok) {
        setGroups([])
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        setGroups([])
        return
      }

      const data = await response.json()
      
      const transformedGroups = (data.categories || [])
        .map(transformGroupFromAPI)
        .filter((group): group is GlobalParameterGroup => group !== null)
      
      setGroups(transformedGroups)
    } catch (error) {
      console.error("[v0] Error fetching groups:", error)
      setGroups([])
    }
  }

  const fetchParameterValues = async (parameterId: string) => {
    try {
      const response = await fetch(`/api/super-admin/parameter-values?parameter_id=${parameterId}`)
      if (!response.ok) throw new Error("Failed to fetch values")
      const data = await response.json()
      setParameterValues(data.values || [])
    } catch (error) {
      console.error("[v0] Error fetching parameter values:", error)
      setParameterValues([])
    }
  }

  const handleCreateParameter = async () => {
    try {
      const requestBody = {
        name: newParameter.name,
        description: newParameter.description,
        type: newParameter.type,
        category: newParameter.category,
        defaultValue: newParameter.defaultValue,
        options: newParameter.options,
        formula: newParameter.formula,
        dependencies: newParameter.dependencies,
        unit: newParameter.unit, // Added unit field back
        interval: newParameter.interval,
        isActive: newParameter.isActive,
        isTemplate: newParameter.isTemplate,
        groupIds: newParameter.groupIds, // Include groupIds in the request
      }

      const response = await fetch("/api/global-parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      const transformedParameter = transformParameterFromAPI(data.parameter)

      if (!transformedParameter.groupIds || transformedParameter.groupIds.length === 0) {
        if (newParameter.groupIds && newParameter.groupIds.length > 0) {
          transformedParameter.groupIds = newParameter.groupIds
        }
      }

      setParameters([...parameters, transformedParameter])
      setNewParameter({
        name: "",
        description: "",
        type: "number",
        category: "",
        isActive: true,
        isTemplate: true,
        groupIds: [], // Reset groupIds
        defaultValue: "",
        formula: "",
        unit: "", // Added unit field back
        interval: "monthly",
      })
      setIsCreateParameterOpen(false)
    } catch (error) {
      console.error("[v0] Error creating parameter:", error)
    }
  }

  const handleCreateGroup = async () => {
    try {
      if (!newGroup.name || newGroup.name.trim() === "") {
        console.error("[v0] Cannot create group: name is required")
        return
      }

      const response = await fetch("/api/global-parameter-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          parameters: newGroup.parameters,
          color: newGroup.color,
          isActive: newGroup.isActive,
          isTemplate: newGroup.isTemplate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to create group" }))
        console.error("[v0] Failed to create group - Status:", response.status, "Error:", errorData)
        return
      }

      const data = await response.json()

      if (!data || !data.category) {
        console.error("[v0] API returned invalid response structure:", data)
        return
      }

      const transformedGroup = transformGroupFromAPI(data.category)
      if (!transformedGroup) {
        console.error("[v0] Failed to transform group data:", data.category)
        return
      }

      setGroups([...groups, transformedGroup])
      setNewGroup({
        name: "",
        description: "",
        parameters: [],
        color: "bg-blue-500",
        isActive: true,
        isTemplate: true,
      })
      setIsCreateGroupOpen(false)
    } catch (error) {
      console.error("[v0] Error creating group:", error)
    }
  }

  const handleAddParameterValue = async () => {
    if (!selectedParameterForValues) return

    try {
      const response = await fetch("/api/super-admin/parameter-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterId: selectedParameterForValues,
          value: newValue.value,
          recordedDate: newValue.recordedDate,
          notes: newValue.notes,
          recordedBy: "Super Admin", // You can get this from user context
        }),
      })

      if (!response.ok) throw new Error("Failed to add value")

      const data = await response.json()
      setParameterValues([data.value, ...parameterValues])
      setNewValue({
        value: "",
        recordedDate: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setIsAddValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error adding parameter value:", error)
    }
  }

  const handleEditParameter = (parameter: GlobalParameter) => {
    setEditingParameter(parameter)
    setNewParameter({
      name: parameter.name || "", // Ensure no null values
      description: parameter.description || "",
      type: parameter.type,
      category: parameter.category || "",
      defaultValue: parameter.defaultValue || "",
      options: parameter.options,
      formula: parameter.formula || "",
      dependencies: parameter.dependencies,
      unit: parameter.unit || "", // Added unit field back
      interval: parameter.interval || "monthly",
      isActive: parameter.isActive,
      isTemplate: parameter.isTemplate,
      groupIds: parameter.groupIds || [],
    })
    setIsEditParameterOpen(true)
  }

  const handleUpdateParameter = async () => {
    if (!editingParameter) return

    try {
      const response = await fetch(`/api/global-parameters/${editingParameter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParameter.name,
          description: newParameter.description,
          type: newParameter.type,
          category: newParameter.category,
          defaultValue: newParameter.defaultValue,
          options: newParameter.options,
          formula: newParameter.formula,
          dependencies: newParameter.dependencies,
          unit: newParameter.unit, // Added unit field back
          interval: newParameter.interval,
          isActive: newParameter.isActive,
          isTemplate: newParameter.isTemplate,
          groupIds: newParameter.groupIds,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Update failed with status:", response.status)
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)
        return
      }

      const data = await response.json()

      const transformedParameter = transformParameterFromAPI(data.parameter)

      if (!transformedParameter.groupIds || transformedParameter.groupIds.length === 0) {
        if (newParameter.groupIds && newParameter.groupIds.length > 0) {
          transformedParameter.groupIds = newParameter.groupIds
        }
      }

      if (!transformedParameter.interval && newParameter.interval) {
        transformedParameter.interval = newParameter.interval
      }

      const updatedParameters = parameters.map((p) => (p.id === editingParameter.id ? transformedParameter : p))

      setParameters(updatedParameters)

      setEditingParameter(null)
      setNewParameter({
        name: "",
        description: "",
        type: "number",
        category: "",
        isActive: true,
        isTemplate: true,
        groupIds: [],
        defaultValue: "",
        formula: "",
        unit: "", // Added unit field back
        interval: "monthly",
      })
      setIsEditParameterOpen(false)
    } catch (error) {
      console.error("[v0] Error updating parameter:", error)
    }
  }

  const handleDeleteParameter = useCallback(
    async (parameterId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this global parameter? This will affect all practices currently using this template.",
      )

      if (!confirmed) {
        return
      }

      try {
        const response = await fetch(`/api/global-parameters/${parameterId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          const updatedGroups = groups.map((group) => ({
            ...group,
            parameters: group.parameters.filter((id) => id !== parameterId),
          }))
          setGroups(updatedGroups)
          setParameters(parameters.filter((p) => p.id !== parameterId))
        } else {
          const data = await response.json()
          console.error("[v0] Delete failed:", data)
          alert(data.error || "Failed to delete parameter")
        }
      } catch (error) {
        console.error("[v0] Error deleting parameter:", error)
        alert("Error deleting parameter")
      }
    },
    [groups, parameters],
  ) // Added dependencies

  const handleViewParameterValues = (parameterId: string) => {
    setSelectedParameterForValues(parameterId)
    fetchParameterValues(parameterId)
  }

  const handleEditGroup = (group: GlobalParameterGroup) => {
    setEditingGroup(group)
    setNewGroup({
      name: group.name || "", // Ensure no null values
      description: group.description || "",
      parameters: group.parameters,
      color: group.color,
      isActive: group.isActive,
      isTemplate: group.isTemplate,
    })
    setIsEditGroupOpen(true)
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup) return

    try {
      const response = await fetch(`/api/global-parameter-groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          parameters: newGroup.parameters,
          color: newGroup.color,
          isActive: newGroup.isActive,
          isTemplate: newGroup.isTemplate,
        }),
      })

      const data = await response.json()
      const transformedGroup = transformGroupFromAPI(data.category)
      if (!transformedGroup) {
        console.error("[v0] Failed to transform updated group")
        return
      }
      setGroups(groups.map((g) => (g.id === editingGroup.id ? transformedGroup : g)))
      setEditingGroup(null)
      setNewGroup({
        name: "",
        description: "",
        parameters: [],
        color: "bg-blue-500",
        isActive: true,
        isTemplate: true,
      })
      setIsEditGroupOpen(false)
    } catch (error) {
      console.error("[v0] Error updating group:", error)
    }
  }

  const handleDeleteGroup = useCallback(async (groupId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this global KPI category? This will affect all practices currently using this template.",
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeletingGroup(true)
      setIsReloading(true)

      const response = await fetch(`/api/global-parameter-groups/${groupId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Delete failed:", errorData)
        alert(`Failed to delete category: ${errorData.details || errorData.error}`)
        setIsDeletingGroup(false)
        setIsReloading(false)
        return
      }

      const data = await response.json()

      await Promise.all([fetchGroups(), fetchParameters()])

      setIsDeletingGroup(false)
      setIsReloading(false)
    } catch (error: any) {
      console.error("[v0] Error deleting group:", {
        message: error?.message,
        stack: error?.stack,
      })
      alert(`Error deleting category: ${error?.message || "Unknown error"}`)
      setIsDeletingGroup(false)
      setIsReloading(false)
    }
  }, [])

  const handleDuplicateParameter = async (parameter: GlobalParameter) => {
    const duplicatedParameter = {
      name: `${parameter.name} (Copy)`,
      description: parameter.description,
      type: parameter.type,
      category: parameter.category,
      defaultValue: parameter.defaultValue,
      options: parameter.options,
      formula: parameter.formula,
      dependencies: parameter.dependencies,
      unit: parameter.unit, // Added unit field back
      isActive: parameter.isActive,
      isTemplate: parameter.isTemplate,
      groupIds: parameter.groupIds,
    }

    const response = await fetch("/api/global-parameters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicatedParameter),
    })

    if (!response.ok) {
      console.error("[v0] Failed to duplicate parameter")
      return
    }

    const data = await response.json()
    const transformedParameter = transformParameterFromAPI(data.parameter)

    if (!transformedParameter.groupIds || transformedParameter.groupIds.length === 0) {
      if (parameter.groupIds && parameter.groupIds.length > 0) {
        transformedParameter.groupIds = parameter.groupIds
      }
    }

    setParameters([...parameters, transformedParameter])
  }

  const handleDuplicateGroup = async (group: GlobalParameterGroup) => {
    const duplicatedGroup = {
      name: `${group.name} (Copy)`,
      description: group.description,
      parameters: group.parameters,
      color: group.color,
      isActive: group.isActive,
      isTemplate: group.isTemplate,
    }

    const response = await fetch("/api/global-parameter-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(duplicatedGroup),
    })

    if (!response.ok) {
      console.error("[v0] Failed to duplicate group")
      return
    }

    const data = await response.json()
    const transformedGroup = transformGroupFromAPI(data.category)
    if (!transformedGroup) {
      console.error("[v0] Failed to transform duplicated group")
      return
    }
    setGroups([...groups, transformedGroup])
  }

  const handleUpdateParameterGroups = async (parameterId: string, newGroupIds: string[]) => {
    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter) return

    const response = await fetch(`/api/global-parameters/${parameterId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...parameter,
        groupIds: newGroupIds,
      }),
    })

    if (!response.ok) {
      console.error("[v0] Failed to update parameter groups")
      return
    }

    const data = await response.json()
    const transformedParameter = transformParameterFromAPI(data.parameter)

    // Update local state
    setParameters(parameters.map((p) => (p.id === parameterId ? transformedParameter : p)))
  }

  const displayGroups = useMemo(() => {
    return groups.filter((group) => group && group.id)
  }, [groups])

  return (
    <div className="space-y-6">
      {isReloading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-lg border flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-lg font-medium">{t("kpi.deleting_category", "Deleting category...")}</p>
            <p className="text-sm text-muted-foreground">{t("kpi.refreshing_data", "Refreshing data")}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t("kpi.global_templates", "Global KPI Templates")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "kpi.global_templates_desc",
              "Create and manage global KPI templates that practices can use as standards",
            )}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Shield className="h-3 w-3" />
          {t("kpi.super_admin_only", "Super Admin Only")}
        </Badge>
      </div>

  <Tabs defaultValue="parameters" className="space-y-6">
  <TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="parameters" className="gap-2">
  <Database className="h-4 w-4" />
  {t("kpi.global_kpis", "Globale KPIs")}
  {parameters.length > 0 && (
    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
      {parameters.length}
    </Badge>
  )}
  </TabsTrigger>
  <TabsTrigger value="groups" className="gap-2">
  <BarChart3 className="h-4 w-4" />
  {t("kpi.categories", "Kategorien")}
  {groups.length > 0 && (
    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
      {groups.length}
    </Badge>
  )}
  </TabsTrigger>
  </TabsList>

        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("kpi.global_templates", "Global KPI Templates")}</CardTitle>
                  <CardDescription>
                    {t("kpi.create_standardized", "Create standardized KPI templates that practices can adopt")}
                  </CardDescription>
                </div>
                <Dialog open={isCreateParameterOpen} onOpenChange={setIsCreateParameterOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t("kpi.create_template", "Create Global KPI Template")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("kpi.create_template", "Create Global KPI Template")}</DialogTitle>
                      <DialogDescription>
                        {t("kpi.create_template_desc", "Create a standardized KPI template that practices can use")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="global-param-name">Parameter Name</Label>
                        <Input
                          id="global-param-name"
                          value={newParameter.name || ""} // Ensure value is never null
                          onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                          placeholder="e.g. Daily Patient Count"
                        />
                      </div>
                      <div>
                        <Label htmlFor="global-param-description">Description</Label>
                        <Textarea
                          id="global-param-description"
                          value={newParameter.description || ""} // Ensure value is never null
                          onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                          placeholder="Standard description for this parameter..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Assign to KPI Categories (optional)</Label>
                        <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg bg-muted/50 min-h-[60px]">
                          {groups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No groups available. Create groups first.</p>
                          ) : (
                            groups.map((group) => (
                              <Badge
                                key={group.id}
                                variant={newParameter.groupIds?.includes(group.id) ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                  const currentGroups = newParameter.groupIds || []
                                  const newGroups = currentGroups.includes(group.id)
                                    ? currentGroups.filter((id) => id !== group.id)
                                    : [...currentGroups, group.id]
                                  setNewParameter({ ...newParameter, groupIds: newGroups })
                                }}
                              >
                                <div className={`w-2 h-2 rounded-full ${group.color} mr-1`} />
                                {group.name}
                              </Badge>
                            ))
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Click to select/deselect groups this parameter belongs to
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="global-param-interval">{t("kpi.interval", "Interval")}</Label>
                          <Select
                            value={newParameter.interval || "monthly"}
                            onValueChange={(value: any) => setNewParameter({ ...newParameter, interval: value })}
                          >
                            <SelectTrigger id="global-param-interval">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">{t("kpi.interval_weekly", "Weekly")}</SelectItem>
                              <SelectItem value="monthly">{t("kpi.interval_monthly", "Monthly")}</SelectItem>
                              <SelectItem value="quarterly">{t("kpi.interval_quarterly", "Quarterly")}</SelectItem>
                              <SelectItem value="yearly">{t("kpi.interval_yearly", "Yearly")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="global-param-type">Data Type</Label>
                          <Select
                            value={newParameter.type}
                            onValueChange={(value: any) => setNewParameter({ ...newParameter, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="boolean">Yes/No</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Selection</SelectItem>
                              <SelectItem value="calculated">Calculated</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="global-param-unit">{t("kpi.unit", "Unit")}</Label>
                          <Input
                            id="global-param-unit"
                            value={newParameter.unit || ""}
                            onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })}
                            placeholder={t("kpi.unit_placeholder", "e.g. patients, hours")}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="global-param-active"
                          checked={newParameter.isActive ?? true}
                          onCheckedChange={(checked) => {
                            setNewParameter({ ...newParameter, isActive: checked })
                          }}
                        />
                        <Label htmlFor="global-param-active" className="cursor-pointer">
                          Active
                        </Label>
                      </div>
                      {newParameter.type === "calculated" && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <div>
                            <Label htmlFor="global-param-formula">Formula</Label>
                            <Input
                              id="global-param-formula"
                              value={newParameter.formula || ""} // Ensure value is never null
                              onChange={(e) => setNewParameter({ ...newParameter, formula: e.target.value })}
                              placeholder="e.g. ({Parameter1} + {Parameter2}) / 2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Use {"{Parameter Name}"} to reference other parameters
                            </p>
                          </div>
                          <div>
                            <Label>Dependencies</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {parameters
                                .filter((p) => p.type !== "calculated")
                                .map((param) => (
                                  <Badge
                                    key={param.id}
                                    variant={newParameter.dependencies?.includes(param.id) ? "default" : "outline"}
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const deps = newParameter.dependencies || []
                                      const newDeps = deps.includes(param.id)
                                        ? deps.filter((id) => id !== param.id)
                                        : [...deps, param.id]
                                      setNewParameter({ ...newParameter, dependencies: newDeps })
                                    }}
                                  >
                                    {param.name}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateParameterOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateParameter}>Create Global KPI Template</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("kpi.search_templates", "Search global KPI templates...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("kpi.choose_category", "Choose category")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("kpi.all_categories", "All Categories")}</SelectItem>
                    {displayCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedInterval}
                  onValueChange={(value) => {
                    setSelectedInterval(value)
                  }}
                >
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t("kpi.choose_interval", "Choose interval")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("kpi.all_intervals", "All Intervals")}</SelectItem>
                    <SelectItem value="weekly">{t("kpi.interval_weekly", "Weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("kpi.interval_monthly", "Monthly")}</SelectItem>
                    <SelectItem value="quarterly">{t("kpi.interval_quarterly", "Quarterly")}</SelectItem>
                    <SelectItem value="yearly">{t("kpi.interval_yearly", "Yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Assigned to Categories</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">Loading parameters...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredParameters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <Database className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">
                            {searchTerm || selectedCategory !== "all" || selectedInterval !== "all"
                              ? "No parameters match your filters"
                              : "No KPI templates yet. Create your first template to get started."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParameters.map((parameter) => (
                      <TableRow key={parameter.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            {parameter.type === "calculated" && <Calculator className="h-4 w-4 text-blue-500" />}
                            <div>
                              <div className="font-medium">{parameter.name}</div>
                              <div className="text-sm text-muted-foreground">{parameter.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className="flex flex-wrap gap-1 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                                {parameter.groupIds && parameter.groupIds.length > 0 ? (
                                  parameter.groupIds.map((groupId) => {
                                    const group = groups.find((g) => g.id === groupId)
                                    return group ? (
                                      <Badge key={groupId} variant="outline" className="gap-1">
                                        <div className={`w-2 h-2 rounded-full ${group.color}`} />
                                        {group.name}
                                      </Badge>
                                    ) : null
                                  })
                                ) : (
                                  <span className="text-sm text-muted-foreground">Click to assign</span>
                                )}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="start">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Assign to Categories</h4>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Select which categories this parameter belongs to
                                  </p>
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                  {groups.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No categories available</p>
                                  ) : (
                                    groups.map((group) => {
                                      const isSelected = parameter.groupIds?.includes(group.id) || false
                                      return (
                                        <div
                                          key={group.id}
                                          className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                          onClick={() => {
                                            const currentGroups = parameter.groupIds || []
                                            const newGroups = isSelected
                                              ? currentGroups.filter((id) => id !== group.id)
                                              : [...currentGroups, group.id]
                                            handleUpdateParameterGroups(parameter.id, newGroups)
                                          }}
                                        >
                                          <div
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                            }`}
                                          >
                                            {isSelected && (
                                              <svg
                                                className="w-3 h-3 text-primary-foreground"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path d="M5 13l4 4L19 7" />
                                              </svg>
                                            )}
                                          </div>
                                          <div className={`w-3 h-3 rounded-full ${group.color}`} />
                                          <span className="text-sm flex-1">{group.name}</span>
                                        </div>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <Badge variant={parameter.type === "calculated" ? "default" : "secondary"}>
                            {parameter.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {parameter.interval === "weekly" && t("kpi.interval_weekly", "Weekly")}
                            {parameter.interval === "monthly" && t("kpi.interval_monthly", "Monthly")}
                            {parameter.interval === "quarterly" && t("kpi.interval_quarterly", "Quarterly")}
                            {parameter.interval === "yearly" && t("kpi.interval_yearly", "Yearly")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{parameter.usageCount} practices</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={parameter.isActive ? "default" : "secondary"}>
                            {parameter.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateDE(parameter.createdAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditParameter(parameter)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateParameter(parameter)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteParameter(parameter.id)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("kpi.categories", "KPI Categories")}</CardTitle>
                  <CardDescription>
                    {t("kpi.create_categories_desc", "Create standardized KPI categories for practices to adopt")}
                  </CardDescription>
                </div>
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t("kpi.create_category", "Create Global Category")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{t("kpi.create_category", "Create Global Category")}</DialogTitle>
                      <DialogDescription>
                        {t("kpi.create_category_desc", "Create a standardized KPI category template")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="global-group-name">Category Name</Label>
                        <Input
                          id="global-group-name"
                          value={newGroup.name || ""} // Ensure value is never null
                          onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                          placeholder="e.g. Essential Practice Metrics"
                        />
                      </div>
                      <div>
                        <Label htmlFor="global-group-description">Description</Label>
                        <Textarea
                          id="global-group-description"
                          value={newGroup.description || ""} // Ensure value is never null
                          onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                          placeholder="Description of the KPI category template..."
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="global-group-color">Color</Label>
                          <Select
                            value={newGroup.color}
                            onValueChange={(value) => setNewGroup({ ...newGroup, color: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bg-blue-500">Blue</SelectItem>
                              <SelectItem value="bg-green-500">Green</SelectItem>
                              <SelectItem value="bg-purple-500">Purple</SelectItem>
                              <SelectItem value="bg-orange-500">Orange</SelectItem>
                              <SelectItem value="bg-red-500">Red</SelectItem>
                              <SelectItem value="bg-pink-500">Pink</SelectItem>
                              <SelectItem value="bg-yellow-500">Yellow</SelectItem>
                              <SelectItem value="bg-indigo-500">Indigo</SelectItem>
                              <SelectItem value="bg-teal-500">Teal</SelectItem>
                              <SelectItem value="bg-cyan-500">Cyan</SelectItem>
                              <SelectItem value="bg-lime-500">Lime</SelectItem>
                              <SelectItem value="bg-amber-500">Amber</SelectItem>
                              <SelectItem value="bg-rose-500">Rose</SelectItem>
                              <SelectItem value="bg-violet-500">Violet</SelectItem>
                              <SelectItem value="bg-emerald-500">Emerald</SelectItem>
                              <SelectItem value="bg-gray-500">Gray</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            id="global-group-active"
                            checked={newGroup.isActive}
                            onCheckedChange={(checked) => setNewGroup({ ...newGroup, isActive: checked })}
                          />
                          <Label htmlFor="global-group-active">Active</Label>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateGroup}>Create Global Category</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {displayGroups.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No KPI categories yet. Create your first category to get started.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {displayGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onEdit={handleEditGroup}
                      onDuplicate={handleDuplicateGroup}
                      onDelete={handleDeleteGroup}
                      isDeletingGroup={isDeletingGroup}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Parameter Dialog */}
        <Dialog open={isEditParameterOpen} onOpenChange={setIsEditParameterOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("kpi.edit_template", "Edit Global KPI Template")}</DialogTitle>
              <DialogDescription>
                {t("kpi.edit_template_desc", "Update global KPI template settings")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-param-name">Parameter Name</Label>
                <Input
                  id="edit-param-name"
                  value={newParameter.name || ""} // Ensure value is never null
                  onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                  placeholder="e.g. Daily Patient Count"
                />
              </div>
              <div>
                <Label htmlFor="edit-param-description">Description</Label>
                <Textarea
                  id="edit-param-description"
                  value={newParameter.description || ""} // Ensure value is never null
                  onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                  placeholder="Standard description for this parameter..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Assign to KPI Categories (optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg bg-muted/50 min-h-[60px]">
                  {groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No groups available. Create groups first.</p>
                  ) : (
                    groups.map((group) => (
                      <Badge
                        key={group.id}
                        variant={newParameter.groupIds?.includes(group.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentGroups = newParameter.groupIds || []
                          const newGroups = currentGroups.includes(group.id)
                            ? currentGroups.filter((id) => id !== group.id)
                            : [...currentGroups, group.id]
                          setNewParameter({ ...newParameter, groupIds: newGroups })
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${group.color} mr-1`} />
                        {group.name}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click to select/deselect groups this parameter belongs to
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-param-interval">{t("kpi.interval", "Interval")}</Label>
                  <Select
                    value={newParameter.interval || "monthly"}
                    onValueChange={(value: any) => setNewParameter({ ...newParameter, interval: value })}
                  >
                    <SelectTrigger id="edit-param-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{t("kpi.interval_weekly", "Weekly")}</SelectItem>
                      <SelectItem value="monthly">{t("kpi.interval_monthly", "Monthly")}</SelectItem>
                      <SelectItem value="quarterly">{t("kpi.interval_quarterly", "Quarterly")}</SelectItem>
                      <SelectItem value="yearly">{t("kpi.interval_yearly", "Yearly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-param-type">Data Type</Label>
                  <Select
                    value={newParameter.type}
                    onValueChange={(value: any) => setNewParameter({ ...newParameter, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Selection</SelectItem>
                      <SelectItem value="calculated">Calculated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-param-unit">{t("kpi.unit", "Unit")}</Label>
                  <Input
                    id="edit-param-unit"
                    value={newParameter.unit || ""}
                    onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })}
                    placeholder={t("kpi.unit_placeholder", "e.g. patients, hours")}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-param-active"
                  checked={newParameter.isActive ?? true}
                  onCheckedChange={(checked) => {
                    setNewParameter({ ...newParameter, isActive: checked })
                  }}
                />
                <Label htmlFor="edit-param-active" className="cursor-pointer">
                  Active
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditParameterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateParameter}>Update Parameter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Group Dialog */}
        <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("kpi.edit_category", "Globale KPI-Kategorie bearbeiten")}</DialogTitle>
              <DialogDescription>
                Update the category details and assigned parameters. Changes will be available to all practices.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Same content as Create Group Dialog */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-group-name">Category Name</Label>
                  <Input
                    id="edit-group-name"
                    value={newGroup.name || ""}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="e.g. Essential Practice Metrics"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-group-description">Description</Label>
                  <Textarea
                    id="edit-group-description"
                    value={newGroup.description || ""}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Description of the KPI category template..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-group-color">Color</Label>
                    <Select
                      value={newGroup.color}
                      onValueChange={(value) => setNewGroup({ ...newGroup, color: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bg-blue-500">Blue</SelectItem>
                        <SelectItem value="bg-green-500">Green</SelectItem>
                        <SelectItem value="bg-purple-500">Purple</SelectItem>
                        <SelectItem value="bg-orange-500">Orange</SelectItem>
                        <SelectItem value="bg-red-500">Red</SelectItem>
                        <SelectItem value="bg-pink-500">Pink</SelectItem>
                        <SelectItem value="bg-yellow-500">Yellow</SelectItem>
                        <SelectItem value="bg-indigo-500">Indigo</SelectItem>
                        <SelectItem value="bg-teal-500">Teal</SelectItem>
                        <SelectItem value="bg-cyan-500">Cyan</SelectItem>
                        <SelectItem value="bg-lime-500">Lime</SelectItem>
                        <SelectItem value="bg-amber-500">Amber</SelectItem>
                        <SelectItem value="bg-rose-500">Rose</SelectItem>
                        <SelectItem value="bg-violet-500">Violet</SelectItem>
                        <SelectItem value="bg-emerald-500">Emerald</SelectItem>
                        <SelectItem value="bg-gray-500">Gray</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="edit-group-active"
                      checked={newGroup.isActive}
                      onCheckedChange={(checked) => setNewGroup({ ...newGroup, isActive: checked })}
                    />
                    <Label htmlFor="edit-group-active">Active</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditGroupOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGroup}>Update Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialogs */}

        <Dialog open={isAddValueDialogOpen} onOpenChange={setIsAddValueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add KPI Value</DialogTitle>
              <DialogDescription>
                Enter a new value for{" "}
                {parameters.find((p) => p.id === selectedParameterForValues)?.name || "this parameter"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  value={newValue.value}
                  onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
                  placeholder="Enter value"
                />
              </div>
              <div>
                <Label htmlFor="recorded-date">Date *</Label>
                <Input
                  id="recorded-date"
                  type="date"
                  value={newValue.recordedDate}
                  onChange={(e) => setNewValue({ ...newValue, recordedDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={newValue.notes}
                  onChange={(e) => setNewValue({ ...newValue, notes: e.target.value })}
                  placeholder="Add any relevant notes..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddValueDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddParameterValue}>Add Value</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}

export default GlobalParameterManagement
