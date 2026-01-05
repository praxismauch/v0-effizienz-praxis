"use client"

import { useState, useEffect, useMemo } from "react"
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
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Filter,
  Calculator,
  Database,
  Users,
  BarChart3,
  Download,
  Globe,
  Shield,
  Check,
  Library,
} from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { Checkbox } from "@/components/ui/checkbox"
import { useUser } from "@/contexts/user-context" // Added import
import { useToast } from "@/hooks/use-toast" // Added missing import for useToast hook
import { useTranslation } from "@/contexts/translation-context" // Added useTranslation import

interface Parameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select" | "calculated" | "numeric" | "rating" // Updated types
  category: string
  unit?: string
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
  defaultValue?: string
  options?: string[]
  formula?: string
  dependencies?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  isGlobal?: boolean // Added for global parameter integration
  templateId?: string
  dataCollectionStart?: string
  min?: number // Added for numeric parameters
  max?: number // Added for numeric parameters
  target?: number // Added for numeric parameters
}

interface ParameterGroup {
  id: string
  name: string
  description: string
  parameters: string[] // Changed from parameterIds to parameters to match the interface
  color: string
  isActive: boolean
  createdAt: string
  practiceId?: string | null
  templateId?: string | null
}

interface GlobalParameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select" | "calculated" | "numeric" | "rating" // Updated types
  category: string
  unit?: string
  defaultValue?: string
  options?: string[]
  formula?: string
  dependencies?: string[]
  isActive: boolean
  isTemplate: boolean
  isGlobal: boolean // Indicates if this is from a global KPI template
  createdAt: string
  updatedAt: string
  min?: number // Added for numeric parameters
  max?: number // Added for numeric parameters
  target?: number // Added for numeric parameters
  dataCollectionStart?: string // Added
}

// Mock global parameters that practices can use as templates
// const mockGlobalParameters: GlobalParameter[] = [
//   {
//     id: "global-1",
//     name: "Daily Patient Count",
//     description: "Standard metric for tracking daily patient volume",
//     type: "number",
//     category: "Practice Metrics",
//     unit: "Patients",
//     isActive: true,
//     isTemplate: true,
//     isGlobal: true,
//     createdAt: "2024-01-15",
//     updatedAt: "2024-01-15",
//   },
//   {
//     id: "global-2",
//     name: "Average Wait Time",
//     description: "Standard metric for patient waiting time in minutes",
//     type: "number",
//     category: "Service Quality",
//     unit: "Minutes",
//     isActive: true,
//     isTemplate: true,
//     isGlobal: true,
//     createdAt: "2024-01-16",
//     updatedAt: "2024-01-16",
//   },
//   {
//     id: "global-3",
//     name: "Patient Satisfaction Score",
//     description: "Standard 1-5 rating scale for patient satisfaction",
//     type: "select",
//     category: "Service Quality",
//     options: ["1", "2", "3", "4", "5"],
//     isActive: true,
//     isTemplate: true,
//     isGlobal: true,
//     createdAt: "2024-01-17",
//     updatedAt: "2024-01-17",
//   },
// ]

// Parameters and groups are now fetched from /api/practices/[practiceId]/parameters

// State for new parameter and group creation/editing

export function ParameterManagement({ practiceId }: { practiceId: string }) {
  const { currentUser } = useUser() // Added useUser hook
  const { currentPractice } = usePractice()
  const { toast } = useToast() // Fixed: Changed from `const { toast } = toast` to `const { toast } = useToast()`
  const { t } = useTranslation() // Added translation hook

  const [activeTab, setActiveTab] = useState("parameters") // Added state for active tab

  const [parameters, setParameters] = useState<Parameter[]>([])
  const [groups, setGroups] = useState<ParameterGroup[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedInterval, setSelectedInterval] = useState<string>("all")
  const [isCreateParameterOpen, setIsCreateParameterOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isCalculationDialogOpen, setIsCalculationDialogOpen] = useState(false)
  const [isEditParameterOpen, setIsEditParameterOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null)
  const [editingGroup, setEditingGroup] = useState<ParameterGroup | null>(null)
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)

  const [globalParameters, setGlobalParameters] = useState<GlobalParameter[]>([])
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const [isLoadingPractice, setIsLoadingPractice] = useState(true)
  const [practiceError, setPracticeError] = useState<string | null>(null)

  // REMOVED: const [parameterCategories, setParameterCategories] = useState<ParameterGroup[]>([])
  // REMOVED: const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  const [usedTemplates, setUsedTemplates] = useState<Set<string>>(new Set())
  const [isLoadingUsedTemplates, setIsLoadingUsedTemplates] = useState(true)
  const [isBrowseGlobalOpen, setIsBrowseGlobalOpen] = useState(false)
  const [deleteGlobalParameterId, setDeleteGlobalParameterId] = useState<string | null>(null)
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set()) // Changed from string[] to Set<string>

  // Added state for importing categories
  const [isImportCategoriesOpen, setIsImportCategoriesOpen] = useState(false)
  const [globalCategories, setGlobalCategories] = useState<ParameterGroup[]>([])
  const [selectedCategoriesToImport, setSelectedCategoriesToImport] = useState<string[]>([])
  const [isLoadingGlobalCategories, setIsLoadingGlobalCategories] = useState(false)

  const [isImportFromLibraryOpen, setIsImportFromLibraryOpen] = useState(false)
  const [globalTemplates, setGlobalTemplates] = useState<any[]>([])
  const [selectedTemplatesForImport, setSelectedTemplatesForImport] = useState<string[]>([]) // Renamed to avoid conflict
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [importSearchTerm, setImportSearchTerm] = useState("")

  const [newParameter, setNewParameter] = useState<Partial<Parameter>>({
    name: "",
    description: "",
    type: "number", // Changed from "number" to "numeric" if that's the desired default
    category: "",
    unit: "",
    interval: "monthly",
    isActive: true,
    dataCollectionStart: new Date().toISOString().split("T")[0],
  })

  const [newGroup, setNewGroup] = useState<Partial<ParameterGroup>>({
    name: "",
    description: "",
    parameters: [],
    color: "bg-blue-500",
    isActive: true,
  })

  const [intervalBadgeColors, setIntervalBadgeColors] = useState({
    weekly: "#3b82f6",
    monthly: "#f97316",
    quarterly: "#a855f7",
    yearly: "#22c55e",
  })

  useEffect(() => {
    const loadDisplaySettings = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        const data = await response.json()

        if (data.settings?.display_settings?.intervalBadgeColors) {
          setIntervalBadgeColors(data.settings.display_settings.intervalBadgeColors)
        } else {
          // Fallback to localStorage
          const savedSettings = localStorage.getItem("displaySettings")
          if (savedSettings) {
            const parsed = JSON.JSON.parse(savedSettings)
            if (parsed.intervalBadgeColors) {
              setIntervalBadgeColors(parsed.intervalBadgeColors)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load display settings:", error)
      }
    }

    loadDisplaySettings()
  }, [currentPractice?.id])

  // Function to fetch practice parameters
  const fetchParameters = async () => {
    if (!currentPractice) {
      setIsLoadingPractice(false)
      return
    }

    try {
      setIsLoadingPractice(true)
      setPracticeError(null)

      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const data = await response.json()

      // Transform the API response to match our Parameter interface
      const transformedParameters: Parameter[] = (data.parameters || []).map((param: any) => ({
        id: param.id,
        name: param.name,
        description: param.description || "",
        type: param.data_type, // Assuming API uses 'data_type'
        category: param.category,
        unit: param.unit,
        interval: param.interval, // Include interval here
        isActive: true,
        createdAt: param.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        updatedAt: param.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        isGlobal: param.is_global || false,
        templateId: param.template_id,
        dataCollectionStart: param.data_collection_start, // Added
        min: param.min, // Added
        max: param.max, // Added
        target: param.target, // Added
      }))

      setParameters(transformedParameters)
    } catch (error) {
      console.error("[v0] Error fetching practice parameters:", error)
      setPracticeError(error instanceof Error ? error.message : "Failed to load practice parameters")
    } finally {
      setIsLoadingPractice(false)
    }
  }

  useEffect(() => {
    fetchParameters()
  }, [currentPractice])

  const fetchCategories = async () => {
    if (!currentPractice) {
      setIsLoadingCategories(false)
      return
    }

    try {
      setIsLoadingCategories(true)

      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const data = await response.json()

      // Transform the API response to match our ParameterGroup interface
      const transformedCategories: ParameterGroup[] = (data.categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || "",
        parameters: cat.parameters || [],
        color: cat.color || "bg-blue-500",
        isActive: cat.is_active ?? true,
        createdAt: cat.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        practiceId: cat.practice_id,
        templateId: cat.template_id,
      }))

      setGroups(transformedCategories)
    } catch (error) {
      console.error("[v0] Error fetching practice categories:", error)
      // Don't show error to user, just use empty array
      setGroups([])
    } finally {
      setIsLoadingCategories(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [currentPractice])

  useEffect(() => {
    const fetchGlobalParameters = async () => {
      try {
        setIsLoadingGlobal(true)
        setGlobalError(null)

        const response = await fetch("/api/global-parameters")

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        const data = await response.json()

        // Transform the API response to match our GlobalParameter interface
        const transformedParameters: GlobalParameter[] = (data.parameters || []).map((param: any) => ({
          id: param.id,
          name: param.name,
          description: param.description || "",
          type: param.type,
          category: param.category,
          unit: param.unit,
          defaultValue: param.default_value,
          options: param.options,
          formula: param.formula,
          dependencies: param.dependencies,
          isActive: param.is_active ?? true,
          isTemplate: param.is_template ?? true,
          isGlobal: true,
          createdAt: param.created_at || new Date().toISOString().split("T")[0],
          updatedAt: param.updated_at || new Date().toISOString().split("T")[0],
          min: param.min, // Added
          max: param.max, // Added
          target: param.target, // Added
          dataCollectionStart: param.data_collection_start, // Added
        }))

        setGlobalParameters(transformedParameters)
      } catch (error) {
        console.error("[v0] Error fetching global KPIs:", error)
        setGlobalError(error instanceof Error ? error.message : "Failed to load global KPIs")
      } finally {
        setIsLoadingGlobal(false)
      }
    }

    fetchGlobalParameters()
  }, [])

  useEffect(() => {
    const fetchUsedTemplates = async () => {
      if (!currentPractice) {
        setIsLoadingUsedTemplates(false)
        return
      }

      try {
        setIsLoadingUsedTemplates(true)

        const response = await fetch(`/api/practices/${currentPractice.id}/template-usage`)

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`)
        }

        const data = await response.json()

        // Create a Set of template IDs that have been used
        const usedTemplateIds = new Set(data.usedTemplates?.map((usage: any) => usage.template_id) || [])
        setUsedTemplates(usedTemplateIds)
      } catch (error) {
        console.error("[v0] Error fetching used templates:", error)
        // Don't show error to user, just assume no templates are used
        setUsedTemplates(new Set())
      } finally {
        setIsLoadingUsedTemplates(false)
      }
    }

    fetchUsedTemplates()
  }, [currentPractice])

  // Filter out global KPIs (applied templates) from the practice-specific list
  const practiceOnlyParameters = parameters.filter((p) => !p.isGlobal)

  // Remove duplicates by keeping only the first occurrence of each parameter name
  const uniqueParameters = useMemo(() => {
    return practiceOnlyParameters.reduce((acc, param) => {
      const existingParam = acc.find((p) => p.name === param.name)
      if (!existingParam) {
        acc.push(param)
      }
      return acc
    }, [] as Parameter[])
  }, [practiceOnlyParameters])

  // Get unique category names from groups (KPI categories)
  const categoryNames = useMemo(() => {
    const uniqueNames = new Set(groups.map((group) => group.name))
    return Array.from(uniqueNames).sort()
  }, [groups])

  const categories = useMemo(() => {
    // Get unique categories from practice parameters
    const uniqueCategories = new Set<string>()
    parameters.forEach((param) => {
      if (param.category && param.category.trim()) {
        uniqueCategories.add(param.category)
      }
    })
    return Array.from(uniqueCategories).sort()
  }, [parameters])

  const filteredParameters = useMemo(() => {
    return uniqueParameters.filter((param) => {
      const matchesSearch =
        param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || param.category === selectedCategory
      const matchesInterval = selectedInterval === "all" || param.interval === selectedInterval
      return matchesSearch && matchesCategory && matchesInterval
    })
  }, [uniqueParameters, searchTerm, selectedCategory, selectedInterval])

  const getParameterName = (id: string) => {
    // Use allParameters to find names for dependencies
    const allParameters = [...parameters, ...globalParameters]
    const param = allParameters.find((p) => p.id === id)
    return param ? param.name : `Parameter ${id}`
  }

  const validateFormula = (formula: string, dependencies: string[]) => {
    // Basic validation - check if all referenced parameters exist in dependencies
    const referencedParams = formula.match(/\{([^}]+)\}/g) || []
    const referencedNames = referencedParams.map((ref) => ref.slice(1, -1))

    return referencedNames.every((name) => dependencies.some((depId) => getParameterName(depId) === name))
  }

  const handleEditParameter = (parameter: Parameter) => {
    setEditingParameter(parameter)
    setNewParameter({
      name: parameter.name,
      description: parameter.description,
      type: parameter.type,
      category: parameter.category,
      unit: parameter.unit,
      interval: parameter.interval, // Include interval here
      defaultValue: parameter.defaultValue,
      options: parameter.options,
      formula: parameter.formula,
      dependencies: parameter.dependencies,
      isActive: parameter.isActive,
      dataCollectionStart: parameter.dataCollectionStart || new Date().toISOString().split("T")[0],
      min: parameter.min, // Added
      max: parameter.max, // Added
      target: parameter.target, // Added
    })
    setIsEditParameterOpen(true)
  }

  const handleUpdateParameter = () => {
    if (!editingParameter) return

    const updatedParameter: Parameter = {
      ...editingParameter,
      ...newParameter,
      updatedAt: new Date().toISOString().split("T")[0],
    } as Parameter

    // Check if the parameter is global or practice-specific and update accordingly
    if (updatedParameter.isGlobal) {
      // For now, assume global parameters are not directly editable in this way
      // In a real scenario, you might have a separate mechanism for editing global templates
      toast({
        title: t("kpi.cannot_edit_global", "Cannot Edit Global KPI"),
        description: t(
          "kpi.cannot_edit_global_description",
          "Global KPIs are templates and cannot be directly modified here.",
        ),
        variant: "destructive",
      })
      return
    } else {
      setParameters(parameters.map((p) => (p.id === editingParameter.id ? updatedParameter : p)))
    }

    setEditingParameter(null)
    setNewParameter({
      name: "",
      description: "",
      type: "number", // Reset to default or previous type
      category: "",
      unit: "",
      interval: "monthly",
      isActive: true,
      dataCollectionStart: new Date().toISOString().split("T")[0], // Reset
      min: undefined, // Reset
      max: undefined, // Reset
      target: undefined, // Reset
    })
    setIsEditParameterOpen(false)
  }

  const handleDeleteParameter = async (parameterId: string, force = false) => {
    console.log("[v0] handleDeleteParameter called with ID:", parameterId, "force:", force)

    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter) {
      console.error("[v0] Parameter not found:", parameterId)
      return
    }

    console.log("[v0] Parameter to delete:", parameter)

    // Check if the parameter is global and prevent deletion
    // Global parameters are templates, they should not be deleted from here.
    if (parameter.isGlobal) {
      toast({
        title: t("kpi.cannot_delete_global", "Cannot Delete Global KPI"),
        description: t("kpi.cannot_delete_global_description", "Global KPIs are templates and cannot be deleted."),
        variant: "destructive",
      })
      setDeleteParameterId(null)
      return
    }

    if (!currentPractice) {
      console.error("[v0] No current practice selected")
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.no_practice_selected", "No practice selected"),
        variant: "destructive",
      })
      setDeleteParameterId(null)
      return
    }

    try {
      console.log("[v0] Deleting parameter from database:", parameterId)

      // The API endpoint should handle the `force` parameter for cascade deletion
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters/${parameterId}?force=${force}`, {
        method: "DELETE",
      })

      console.log("[v0] Delete response status:", response.status)

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()

          if (errorData.hasValues && !force) {
            const valueCount = errorData.valueCount || 0
            const confirmMessage = t(
              "kpi.confirm_delete_with_data",
              `This parameter has {{count}} data {{count, plural, one{entry} other{entries}}}. Deleting it will also delete all associated data. Do you want to continue?`,
              { count: valueCount },
            )

            if (window.confirm(confirmMessage)) {
              await handleDeleteParameter(parameterId, true)
              return
            } else {
              setDeleteParameterId(null)
              return
            }
          }

          throw new Error(errorData.error || "Failed to delete parameter")
        } else {
          const errorText = await response.text()
          console.error("[v0] Non-JSON error response:", errorText)
          throw new Error(errorText || "Failed to delete parameter")
        }
      }

      console.log("[v0] Parameter deleted successfully from database")

      setParameters((prevParams) => prevParams.filter((p) => p.id !== parameterId))
      setGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          parameters: group.parameters.filter((id) => id !== parameterId),
        })),
      )

      console.log("[v0] Parameter removed from local state")

      toast({
        title: t("kpi.parameter_deleted", "Parameter deleted"),
        description: t("kpi.parameter_deleted_description", "The parameter has been successfully deleted."),
      })
      console.log("[v0] Delete operation completed, deleteParameterId cleared")
    } catch (error) {
      console.error("[v0] Error deleting parameter:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.delete_parameter_error", "Failed to delete parameter"),
        variant: "destructive",
      })
      setDeleteParameterId(null)
    }
  }

  const handleCreateGroup = async () => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          color: newGroup.color,
          parameters: newGroup.parameters,
          isActive: newGroup.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create category")
      }

      const data = await response.json()

      const group: ParameterGroup = {
        id: data.category.id,
        name: data.category.name,
        description: data.category.description,
        parameters: data.category.parameters,
        color: data.category.color,
        isActive: data.category.is_active,
        createdAt: data.category.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
      }

      setGroups([...groups, group])
      setNewGroup({
        name: "",
        description: "",
        parameters: [],
        color: "bg-blue-500",
        isActive: true,
      })
      setIsCreateGroupOpen(false)

      toast({
        title: t("kpi.category_created", "Category Created"),
        description: t("kpi.category_created_description", "KPI category has been created successfully"),
      })
    } catch (error) {
      console.error("[v0] Error creating category:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.create_category_failed", "Failed to create category"),
        variant: "destructive",
      })
    }
  }

  const handleEditGroup = (group: ParameterGroup) => {
    setEditingGroup(group)
    setNewGroup({
      name: group.name || "", // Ensure no null values
      description: group.description || "",
      parameters: group.parameters,
      color: group.color,
      isActive: group.isActive,
    })
    setIsEditGroupOpen(true)
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup || !currentPractice) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          color: newGroup.color,
          isActive: newGroup.isActive,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update category")
      }

      const data = await response.json()

      const updatedGroup: ParameterGroup = {
        id: data.category.id,
        name: data.category.name,
        description: data.category.description,
        parameters: data.category.parameters,
        color: data.category.color,
        isActive: data.category.is_active,
        createdAt: editingGroup.createdAt,
      }

      setGroups(groups.map((g) => (g.id === editingGroup.id ? updatedGroup : g)))
      setEditingGroup(null)
      setNewGroup({
        name: "",
        description: "",
        parameters: [],
        color: "bg-blue-500",
        isActive: true,
      })
      setIsEditGroupOpen(false)

      toast({
        title: t("kpi.category_updated", "Category Updated"),
        description: t("kpi.category_updated_description", "KPI category has been updated successfully"),
      })
    } catch (error) {
      console.error("[v0] Error updating category:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.update_category_failed", "Failed to update category"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentPractice) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups?id=${groupId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        let errorMessage = t("kpi.delete_category_failed", "Failed to delete category")
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.log("[v0] Could not parse error response as JSON:", parseError)
          errorMessage = `${errorMessage} (${response.status} ${response.statusText})`
        }
        throw new Error(errorMessage)
      }

      await fetchCategories() // Re-fetch categories to update the list
      setDeleteGroupId(null)
      toast({
        title: t("common.success", "Success"),
        description: t("kpi.category_deleted_description", "Category deleted successfully"),
      })
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.delete_category_failed", "Failed to delete category"),
        variant: "destructive",
      })
    }
  }

  const handleCreateParameter = async () => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!newParameter.name || !newParameter.category) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.name_category_required", "Name and category are required"),
        variant: "destructive",
      })
      return
    }

    try {
      // Save parameter to database
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParameter.name,
          description: newParameter.description,
          category: newParameter.category,
          dataType: newParameter.type || "number", // Use "number" as default if API expects it
          unit: newParameter.unit,
          interval: newParameter.interval || "monthly",
          dataCollectionStart: newParameter.dataCollectionStart, // Added
          isGlobal: false,
          min: newParameter.type === "numeric" ? newParameter.min : undefined, // Only send min/max/target for numeric
          max: newParameter.type === "numeric" ? newParameter.max : undefined,
          target: newParameter.type === "numeric" ? newParameter.target : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create parameter")
      }

      const data = await response.json()

      // Add the new parameter to local state with the actual database ID
      const parameter: Parameter = {
        id: data.parameter.id,
        name: newParameter.name || "",
        description: newParameter.description || "",
        type: newParameter.type || "number", // Default to "number" if not set
        category: newParameter.category || "",
        unit: newParameter.unit || "",
        interval: newParameter.interval || "monthly",
        dataCollectionStart: newParameter.dataCollectionStart, // Added
        isActive: true,
        createdAt: data.parameter.createdAt || new Date().toISOString().split("T")[0],
        updatedAt: data.parameter.updatedAt || new Date().toISOString().split("T")[0],
        isGlobal: false,
        min: newParameter.min, // Added
        max: newParameter.max, // Added
        target: newParameter.target, // Added
      }

      setParameters([...parameters, parameter])

      // Reset form
      setNewParameter({
        name: "",
        description: "",
        type: "number", // Reset to default
        category: "",
        unit: "",
        interval: "monthly",
        isActive: true,
        dataCollectionStart: new Date().toISOString().split("T")[0], // Reset
        min: undefined, // Reset
        max: undefined, // Reset
        target: undefined, // Reset
      })

      setIsCreateParameterOpen(false)

      toast({
        title: t("kpi.parameter_created", "Parameter Created"),
        description: t("kpi.parameter_created_description", "The parameter has been created successfully"),
      })
    } catch (error) {
      console.error("[v0] Error creating parameter:", error)
      toast({
        title: t("common.error", "Error"),
        description: error instanceof Error ? error.message : t("kpi.create_failed", "Failed to create parameter"),
        variant: "destructive",
      })
    }
  }

  const createParameterFromTemplate = async (globalParam: GlobalParameter) => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    if (usedTemplates.has(globalParam.id)) {
      toast({
        title: t("kpi.template_already_applied", "Template Already Applied"),
        description: t(
          "kpi.template_already_applied_description",
          "This template has already been applied to your practice",
        ),
        variant: "destructive",
      })
      return
    }

    try {
      // Create the parameter in the database
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: globalParam.name,
          description: globalParam.description,
          category: globalParam.category,
          dataType: globalParam.type, // Use dataType for API
          unit: globalParam.unit,
          interval: globalParam.interval, // Include interval here
          dataCollectionStart: globalParam.dataCollectionStart, // Added
          isGlobal: true, // Indicate that this is derived from a global template
          templateId: globalParam.id, // Track which template was used
          min: globalParam.type === "numeric" ? globalParam.min : undefined, // Added
          max: globalParam.type === "numeric" ? globalParam.max : undefined, // Added
          target: globalParam.type === "numeric" ? globalParam.target : undefined, // Added
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create parameter from template")
      }

      const data = await response.json()

      // Add the new parameter to local state
      const parameter: Parameter = {
        id: data.parameter.id,
        name: globalParam.name,
        description: globalParam.description,
        type: globalParam.type,
        category: globalParam.category,
        unit: globalParam.unit,
        interval: globalParam.interval, // Include interval here
        defaultValue: globalParam.defaultValue,
        options: globalParam.options,
        formula: globalParam.formula,
        dependencies: globalParam.dependencies,
        isActive: true, // Newly created parameters are active by default
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        isGlobal: true, // Mark as global
        templateId: globalParam.id, // Assign the templateId
        dataCollectionStart: globalParam.dataCollectionStart, // Added
        min: globalParam.min, // Added
        max: globalParam.max, // Added
        target: globalParam.target, // Added
      }

      setParameters([...parameters, parameter])

      setUsedTemplates(new Set([...usedTemplates, globalParam.id]))

      toast({
        title: t("kpi.template_applied", "Template Applied"),
        description: t(
          "kpi.template_applied_description",
          `Successfully added "${globalParam.name}" to your practice parameters`,
        ),
      })
    } catch (error) {
      console.error("[v0] Error creating parameter from template:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.apply_template_failed", "Failed to apply template"),
        variant: "destructive",
      })
    }
  }

  const handleApplySelectedTemplates = async () => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    if (selectedTemplates.size === 0) {
      toast({
        title: t("kpi.no_templates_selected", "No Templates Selected"),
        description: t("kpi.no_templates_selected_description", "Please select at least one template to apply"),
        variant: "destructive",
      })
      return
    }

    const templatesToApply = globalParameters.filter((p) => selectedTemplates.has(p.id) && !usedTemplates.has(p.id))

    if (templatesToApply.length === 0) {
      toast({
        title: t("kpi.templates_already_applied", "Templates Already Applied"),
        description: t(
          "kpi.templates_already_applied_description",
          "All selected templates have already been applied to your practice",
        ),
        variant: "destructive",
      })
      // Clear selection since all are already applied
      setSelectedTemplates(new Set())
      return
    }

    const alreadyAppliedCount = selectedTemplates.size - templatesToApply.length
    if (alreadyAppliedCount > 0) {
      toast({
        title: t("kpi.some_templates_already_applied", "Some Templates Already Applied"),
        description: t(
          "kpi.some_templates_already_applied_description",
          `${alreadyAppliedCount} template${alreadyAppliedCount > 1 ? "s" : ""} ${alreadyAppliedCount > 1 ? "have" : "has"} already been applied and will be skipped`,
        ),
      })
    }

    try {
      // Apply all selected templates
      const results = await Promise.all(
        templatesToApply.map(async (globalParam) => {
          const response = await fetch(`/api/practices/${currentPractice.id}/parameters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: globalParam.name,
              description: globalParam.description,
              category: globalParam.category,
              dataType: globalParam.type,
              unit: globalParam.unit,
              interval: globalParam.interval, // Include interval here
              dataCollectionStart: globalParam.dataCollectionStart, // Added
              isGlobal: true,
              templateId: globalParam.id,
              min: globalParam.type === "numeric" ? globalParam.min : undefined, // Added
              max: globalParam.type === "numeric" ? globalParam.max : undefined, // Added
              target: globalParam.type === "numeric" ? globalParam.target : undefined, // Added
            }),
          })

          if (!response.ok) {
            throw new Error(`Failed to apply ${globalParam.name}`)
          }

          return response.json()
        }),
      )

      // Add all new parameters to local state
      const newParameters: Parameter[] = results.map((data, index) => ({
        id: data.parameter.id,
        name: templatesToApply[index].name,
        description: templatesToApply[index].description,
        type: templatesToApply[index].type,
        category: templatesToApply[index].category,
        unit: templatesToApply[index].unit,
        interval: templatesToApply[index].interval, // Include interval here
        defaultValue: templatesToApply[index].defaultValue,
        options: templatesToApply[index].options,
        formula: templatesToApply[index].formula,
        dependencies: templatesToApply[index].dependencies,
        isActive: true,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
        isGlobal: true,
        templateId: templatesToApply[index].id, // Assign the templateId
        dataCollectionStart: templatesToApply[index].dataCollectionStart, // Added
        min: templatesToApply[index].min, // Added
        max: templatesToApply[index].max, // Added
        target: templatesToApply[index].target, // Added
      }))

      setParameters([...parameters, ...newParameters])

      // Update used templates
      const newUsedTemplates = new Set([...usedTemplates, ...templatesToApply.map((t) => t.id)])
      setUsedTemplates(newUsedTemplates)

      // Clear selection
      setSelectedTemplates(new Set())

      toast({
        title: t("kpi.templates_applied", "Templates Applied"),
        description: t(
          "kpi.templates_applied_description",
          `Successfully applied ${templatesToApply.length} template${templatesToApply.length > 1 ? "s" : ""} to your practice`,
        ),
      })

      setIsBrowseGlobalOpen(false)
    } catch (error) {
      console.error("[v0] Error applying templates:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.apply_templates_failed", "Failed to apply some templates"),
        variant: "destructive",
      })
    }
  }

  const handleDeleteGlobalParameter = async (parameterId: string) => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      setDeleteGlobalParameterId(null)
      return
    }

    try {
      const globalTemplate = globalParameters.find((p) => p.id === parameterId)

      if (!globalTemplate) {
        throw new Error(t("kpi.template_not_found", "Template not found"))
      }

      // Find all applied parameters that match this global template by name
      // This is a heuristic; ideally, the API would return a list of practice parameter IDs linked to this templateId.
      const appliedParameters = parameters.filter((p) => p.isGlobal && p.name === globalTemplate.name)

      // Delete all applied parameters from database
      if (appliedParameters.length > 0) {
        await Promise.all(
          appliedParameters.map(async (param) => {
            const response = await fetch(`/api/practices/${currentPractice.id}/parameters/${param.id}`, {
              method: "DELETE",
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || "Failed to remove template from practice")
            }
          }),
        )
      }

      // Delete usage tracking for this specific template ID
      await fetch(`/api/practices/${currentPractice.id}/template-usage?templateId=${parameterId}`, {
        method: "DELETE",
      })

      // Refetch data to ensure UI is in sync with database
      const [paramsResponse, usageResponse] = await Promise.all([
        fetch(`/api/practices/${currentPractice.id}/parameters`),
        fetch(`/api/practices/${currentPractice.id}/template-usage`),
      ])

      if (paramsResponse.ok) {
        const paramsData = await paramsResponse.json()
        const transformedParameters: Parameter[] = (paramsData.parameters || []).map((param: any) => ({
          id: param.id,
          name: param.name,
          description: param.description || "",
          type: param.data_type,
          category: param.category,
          unit: param.unit,
          interval: param.interval, // Include interval here
          isActive: true,
          createdAt: param.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          updatedAt: param.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          isGlobal: param.is_global || false,
          templateId: param.template_id,
          dataCollectionStart: param.data_collection_start, // Added
          min: param.min, // Added
          max: param.max, // Added
          target: param.target, // Added
        }))
        setParameters(transformedParameters)
      } else {
        console.error("[v0] Failed to refetch parameters after template removal.")
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        const usedTemplateIds = new Set(usageData.usedTemplates?.map((usage: any) => usage.template_id) || [])
        setUsedTemplates(usedTemplateIds)
      } else {
        console.error("[v0] Failed to refetch usage data after template removal.")
      }

      toast({
        title: t("kpi.template_removed", "Template Removed"),
        description: t(
          "kpi.template_removed_description",
          `Template has been removed from your practice${appliedParameters.length > 1 ? ` (${appliedParameters.length} instances removed)` : ""} and can be applied again`,
        ),
      })
    } catch (error) {
      console.error("[v0] Error removing template:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error
            ? error.message
            : t("kpi.remove_template_failed", "Failed to remove template from practice"),
        variant: "destructive",
      })
    } finally {
      setDeleteGlobalParameterId(null)
    }
  }

  const handleRemoveAllTemplates = async () => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    try {
      // Find all applied parameters (isGlobal: true)
      const appliedParameters = parameters.filter((p) => p.isGlobal)

      if (appliedParameters.length === 0) {
        toast({
          title: t("kpi.no_templates_to_remove", "No Templates to Remove"),
          description: t("kpi.no_templates_to_remove_description", "There are no applied templates in your practice"),
        })
        return
      }

      // Delete all applied parameters from database
      await Promise.all(
        appliedParameters.map(async (param) => {
          const response = await fetch(`/api/practices/${currentPractice.id}/parameters/${param.id}`, {
            method: "DELETE",
          })
          if (!response.ok) {
            console.error(`[v0] Failed to delete parameter ${param.id} during bulk removal.`)
            // Optionally, throw an error or handle partial failures
          }
        }),
      )

      // Delete all usage tracking entries
      await Promise.all(
        Array.from(usedTemplates).map(async (templateId) => {
          const response = await fetch(`/api/practices/${currentPractice.id}/template-usage?templateId=${templateId}`, {
            method: "DELETE",
          })
          if (!response.ok) {
            console.error(`[v0] Failed to delete usage tracking for template ${templateId} during bulk removal.`)
            // Optionally, throw an error or handle partial failures
          }
        }),
      )

      // Refetch data to ensure UI is in sync with database
      const [paramsResponse, usageResponse] = await Promise.all([
        fetch(`/api/practices/${currentPractice.id}/parameters`),
        fetch(`/api/practices/${currentPractice.id}/template-usage`),
      ])

      if (paramsResponse.ok) {
        const paramsData = await paramsResponse.json()
        const transformedParameters: Parameter[] = (paramsData.parameters || []).map((param: any) => ({
          id: param.id,
          name: param.name,
          description: param.description || "",
          type: param.data_type,
          category: param.category,
          unit: param.unit,
          interval: param.interval, // Include interval here
          isActive: true,
          createdAt: param.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          updatedAt: param.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          isGlobal: param.is_global || false,
          templateId: param.template_id,
          dataCollectionStart: param.data_collection_start, // Added
          min: param.min, // Added
          max: param.max, // Added
          target: param.target, // Added
        }))
        setParameters(transformedParameters)
      }

      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        const usedTemplateIds = new Set(usageData.usedTemplates?.map((usage: any) => usage.template_id) || [])
        setUsedTemplates(usedTemplateIds)
      }

      toast({
        title: t("kpi.all_templates_removed", "All Templates Removed"),
        description: t(
          "kpi.all_templates_removed_description",
          `Successfully removed ${appliedParameters.length} template${appliedParameters.length > 1 ? "s" : ""} from your practice`,
        ),
      })
    } catch (error) {
      console.error("[v0] Error removing all templates:", error)
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.remove_all_templates_failed", "Failed to remove all templates"),
        variant: "destructive",
      })
    }
  }

  const fetchGlobalCategories = async () => {
    try {
      setIsLoadingGlobalCategories(true)
      console.log("[v0] Component: Starting to fetch global categories...")
      const response = await fetch("/api/global-parameter-groups")
      console.log("[v0] Component: Response status:", response.status)
      console.log("[v0] Component: Response ok:", response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Component: API error response:", errorData)
        throw new Error(`Failed to fetch global categories: ${errorData.details || errorData.error}`)
      }

      const data = await response.json()

      console.log("[v0] Component: Received categories from API:", data.categories?.length || 0)
      console.log(
        "[v0] Component: Categories before filter:",
        data.categories?.map((c: any) => ({ id: c.id, name: c.name, is_active: c.is_active })),
      )

      // Transform the API response to match our ParameterGroup interface
      const transformedCategories: ParameterGroup[] = (data.categories || [])
        .filter((cat: any) => cat.is_active === true) // Only show active categories
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || "",
          parameters: [], // Parameters are not relevant when importing category structure
          color: cat.color || "bg-blue-500",
          isActive: cat.is_active ?? true,
          createdAt: cat.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
        }))

      console.log("[v0] Component: Categories after active filter:", transformedCategories.length)
      console.log(
        "[v0] Component: Final categories:",
        transformedCategories.map((c) => ({ id: c.id, name: c.name, isActive: c.isActive })),
      )

      setGlobalCategories(transformedCategories)
    } catch (error) {
      console.error("[v0] Error fetching global categories:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
      setGlobalCategories([])
    } finally {
      setIsLoadingGlobalCategories(false)
    }
  }

  const handleImportCategories = async () => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    try {
      const categoriesToImport = globalCategories.filter((cat) => selectedCategoriesToImport.includes(cat.id))

      for (const category of categoriesToImport) {
        const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: category.name,
            description: category.description,
            color: category.color,
            parameters: [], // When importing categories, they start without parameters
            isActive: true,
            templateId: category.id, // Track that this was imported from a global template
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to import category")
        }

        const data = await response.json()

        const newCategory: ParameterGroup = {
          id: data.category.id,
          name: data.category.name,
          description: data.category.description,
          parameters: data.category.parameters,
          color: data.category.color,
          isActive: data.category.is_active,
          createdAt: data.category.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
          practiceId: data.category.practice_id,
          templateId: data.category.template_id,
        }

        setGroups((prev) => [...prev, newCategory])
      }

      setSelectedCategoriesToImport([])
      setIsImportCategoriesOpen(false)

      toast({
        title: t("kpi.categories_imported", "Categories Imported"),
        description: t(
          "kpi.categories_imported_description",
          `Successfully imported ${categoriesToImport.length} ${categoriesToImport.length === 1 ? "category" : "categories"}`,
        ),
      })
    } catch (error) {
      console.error("[v0] Error importing categories:", error)
      toast({
        title: t("common.error", "Error"),
        description:
          error instanceof Error ? error.message : t("kpi.import_categories_failed", "Failed to import categories"),
        variant: "destructive",
      })
    }
  }

  const fetchGlobalTemplates = async () => {
    try {
      setIsLoadingTemplates(true)
      const response = await fetch("/api/global-parameters")
      if (!response.ok) throw new Error(t("kpi.fetch_templates_failed", "Failed to fetch global templates"))
      const data = await response.json()
      // Ensure globalTemplates can be of type GlobalParameter[]
      setGlobalTemplates(data.parameters || [])
    } catch (error) {
      console.error("[v0] Error fetching global templates:", error)
      setGlobalTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleImportTemplates = async () => {
    if (!currentPractice) {
      toast({
        title: t("common.error", "Error"),
        description: t("kpi.select_practice_first", "Please select a practice first"),
        variant: "destructive",
      })
      return
    }

    try {
      // Ensure globalTemplates are properly typed if needed, or proceed with caution.
      const templatesToImport = (globalTemplates as GlobalParameter[]).filter((t) =>
        selectedTemplatesForImport.includes(t.id),
      )

      for (const template of templatesToImport) {
        // Check if parameter already exists in practice (by name, excluding global ones)
        const existingParameter = parameters.find((p) => p.name === template.name && !p.isGlobal)
        if (existingParameter) {
          toast({
            title: t("kpi.parameter_exists", "Parameter Exists"),
            description: t(
              "kpi.parameter_exists_description",
              `Parameter "${template.name}" already exists in your practice. Skipping import.`,
            ),
            variant: "warning",
          })
          continue // Skip this template and move to the next
        }

        const response = await fetch(`/api/practices/${practiceId}/parameters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            description: template.description,
            dataType: template.type, // API expects 'dataType'
            category: template.category,
            unit: template.unit,
            interval: template.interval,
            defaultValue: template.defaultValue,
            options: template.options,
            formula: template.formula,
            dependencies: template.dependencies,
            isActive: template.isActive,
            dataCollectionStart: template.dataCollectionStart, // Added
            isGlobal: true, // Mark as practice parameter derived from a global template
            templateId: template.id, // Link to the global template ID
            min: template.type === "numeric" ? template.min : undefined, // Added
            max: template.type === "numeric" ? template.max : undefined, // Added
            target: template.type === "numeric" ? template.target : undefined, // Added
          }),
        })

        if (!response.ok) {
          let errorMessage = `Failed to import "${template.name}".`
          try {
            const contentType = response.headers.get("content-type")
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } else {
              const errorText = await response.text()
              console.error("[v0] Non-JSON error response during template import:", errorText)
              errorMessage = `Server error (${response.status})`
            }
          } catch (parseError) {
            console.error("[v0] Error parsing error response during template import:", parseError)
            errorMessage = `Server error (${response.status})`
          }

          console.error(`[v0] Failed to import template: ${template.name} - ${errorMessage}`)
          toast({
            title: t("kpi.import_failed", "Import Failed"),
            description: errorMessage,
            variant: "destructive",
          })
        } else {
          try {
            const contentType = response.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error(t("kpi.expected_json_response", "Expected JSON response but got: ") + contentType)
            }

            const data = await response.json()
            const newParameter: Parameter = {
              id: data.parameter.id, // Use the ID from the response
              name: template.name,
              description: template.description,
              type: template.type,
              category: template.category,
              unit: template.unit,
              interval: template.interval,
              defaultValue: template.defaultValue,
              options: template.options,
              formula: template.formula,
              dependencies: template.dependencies,
              isActive: template.isActive, // Use template's active status
              createdAt: new Date().toISOString().split("T")[0], // Set current date
              updatedAt: new Date().toISOString().split("T")[0], // Set current date
              isGlobal: true, // Mark as imported from global
              templateId: template.id, // Link to the global template ID
              dataCollectionStart: template.dataCollectionStart, // Added
              min: template.min, // Added
              max: template.max, // Added
              target: template.target, // Added
            }
            setParameters((prev) => [...prev, newParameter])
          } catch (parseError) {
            console.error("[v0] Error parsing success response during template import:", parseError)
            toast({
              title: t("kpi.import_warning", "Import Warning"),
              description: t(
                "kpi.import_warning_description",
                `Imported "${template.name}" but failed to process response details. Please verify in parameters list.`,
              ),
              variant: "warning",
            })
          }
        }
      }

      // After attempting to import all selected templates, refresh the parameters list
      // to ensure UI reflects the actual state of the database and any new IDs.
      fetchParameters()
      // Also refresh used templates if the API supports it or update the set manually
      // For simplicity, we update the set based on what we attempted to import and assume success for now.
      const successfullyImportedIds = templatesToImport
        .filter((template) => !parameters.some((p) => p.templateId === template.id && p.isGlobal)) // Basic check
        .map((t) => t.id)
      setUsedTemplates((prev) => new Set([...prev, ...successfullyImportedIds]))

      setSelectedTemplatesForImport([])
      setIsImportFromLibraryOpen(false)

      toast({
        title: t("kpi.templates_imported", "Templates Imported"),
        description: t(
          "kpi.templates_imported_description",
          `Attempted to import ${templatesToImport.length} template(s) from the library.`,
        ),
      })
    } catch (error) {
      console.error("[v0] Error importing templates:", error)
      toast({
        title: t("kpi.import_error", "Import Error"),
        description:
          error instanceof Error
            ? error.message
            : t("kpi.import_error_description", "An unexpected error occurred during template import."),
        variant: "destructive",
      })
    }
  }

  const filteredGlobalTemplates = useMemo(() => {
    // Ensure globalTemplates is an array of GlobalParameter
    const typedGlobalTemplates = globalTemplates as GlobalParameter[]
    return typedGlobalTemplates.filter(
      (template) =>
        template.name.toLowerCase().includes(importSearchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(importSearchTerm.toLowerCase()) ||
        template.category.toLowerCase().includes(importSearchTerm.toLowerCase()),
    )
  }, [globalTemplates, importSearchTerm])

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parameters" className="gap-2">
            <Database className="h-4 w-4" />
            {t("kpi.tabs.parameters", "Parameters")}
          </TabsTrigger>
          <TabsTrigger value="calculations" className="gap-2">
            <Calculator className="h-4 w-4" />
            {t("kpi.tabs.calculations", "Calculations")}
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("kpi.tabs.categories", "Categories")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("kpi.parameters.title", "Practice Parameters")}</CardTitle>
                  <CardDescription>
                    {t("kpi.parameters.description", "Manage parameters for analysis and reporting")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isImportFromLibraryOpen} onOpenChange={setIsImportFromLibraryOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-transparent" onClick={() => fetchGlobalTemplates()}>
                        <Download className="h-4 w-4" />
                        {t("kpi.import_from_library", "Import from Library")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t("kpi.import_templates", "Import Templates from Library")}</DialogTitle>
                        <DialogDescription>
                          {t(
                            "kpi.import_templates_description",
                            "Select templates from the library to import into your practice",
                          )}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t("kpi.search_templates", "Search templates...")}
                            value={importSearchTerm}
                            onChange={(e) => setImportSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {filteredGlobalTemplates.length > 0 && (
                          <div className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allTemplateIds = filteredGlobalTemplates.map((t) => t.id)
                                const allSelected = allTemplateIds.every((id) =>
                                  selectedTemplatesForImport.includes(id),
                                )
                                if (allSelected) {
                                  // Deselect all
                                  setSelectedTemplatesForImport([])
                                } else {
                                  // Select all
                                  setSelectedTemplatesForImport(allTemplateIds)
                                }
                              }}
                            >
                              {filteredGlobalTemplates.every((t) => selectedTemplatesForImport.includes(t.id))
                                ? "Alle abwählen"
                                : "Alle auswählen"}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {selectedTemplatesForImport.length} / {filteredGlobalTemplates.length} ausgewählt
                            </span>
                          </div>
                        )}
                        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                          {isLoadingTemplates ? (
                            <div className="flex items-center justify-center p-8">
                              <div className="text-sm text-muted-foreground">Loading templates...</div>
                            </div>
                          ) : filteredGlobalTemplates.length === 0 ? (
                            <div className="flex items-center justify-center p-8">
                              <div className="text-sm text-muted-foreground">No templates found</div>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {filteredGlobalTemplates.map((template) => (
                                <div
                                  key={template.id}
                                  className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                                  onClick={() => {
                                    setSelectedTemplatesForImport((prev) =>
                                      prev.includes(template.id)
                                        ? prev.filter((id) => id !== template.id)
                                        : [...prev, template.id],
                                    )
                                  }}
                                >
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                      selectedTemplatesForImport.includes(template.id)
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground/30"
                                    }`}
                                  >
                                    {selectedTemplatesForImport.includes(template.id) && (
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
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                                      <h4 className="font-medium text-sm">{template.name}</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {template.type}
                                      </Badge>
                                      {template.category && (
                                        <Badge variant="outline" className="text-xs">
                                          {template.category}
                                        </Badge>
                                      )}
                                      {template.unit && (
                                        <Badge variant="outline" className="text-xs">
                                          {template.unit}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{selectedTemplatesForImport.length} template(s) selected</span>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportFromLibraryOpen(false)}>
                          {t("common.cancel", "Cancel")}
                        </Button>
                        <Button onClick={handleImportTemplates} disabled={selectedTemplatesForImport.length === 0}>
                          {t("kpi.import", "Import")}{" "}
                          {selectedTemplatesForImport.length > 0 && `(${selectedTemplatesForImport.length})`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isCreateParameterOpen} onOpenChange={setIsCreateParameterOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("kpi.create_parameter", "Create Parameter")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t("kpi.create_new_parameter", "Create New Parameter")}</DialogTitle>
                        <DialogDescription>
                          {t("kpi.create_parameter_description", "Create a new parameter for analysis dashboards")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="param-name">{t("kpi.parameter_name", "Parameter Name")}</Label>
                            <Input
                              id="param-name"
                              value={newParameter.name || ""}
                              onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                              placeholder={t("kpi.parameter_name_placeholder", "z.B. Teamgröße")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="parameter-category">{t("kpi.category", "Category")}</Label>
                            <Select
                              value={newParameter.category || ""}
                              onValueChange={(value) => setNewParameter({ ...newParameter, category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("kpi.select_category", "Select category")} />
                              </SelectTrigger>
                              <SelectContent>
                                {categoryNames.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    {t(
                                      "kpi.no_categories",
                                      "No categories available. Create categories in KPI settings first.",
                                    )}
                                  </SelectItem>
                                ) : (
                                  categoryNames
                                    .filter((cat) => cat && cat.trim() !== "")
                                    .map((category, index) => (
                                      <SelectItem key={`category-${index}-${category}`} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              {t("kpi.or_type_category", "Or type a new category name in the field below")}
                            </p>
                            <Input
                              className="mt-2"
                              placeholder={t("kpi.new_category_placeholder", "Or enter new category name")}
                              value={newParameter.category || ""}
                              onChange={(e) => setNewParameter({ ...newParameter, category: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="param-description">{t("kpi.description", "Description")}</Label>
                          <Textarea
                            id="param-description"
                            value={newParameter.description || ""}
                            onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                            placeholder={t("kpi.description_placeholder", "Parameter description...")}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="param-unit">{t("kpi.unit_optional", "Unit (optional)")}</Label>
                            <Input
                              id="param-unit"
                              value={newParameter.unit || ""}
                              onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })}
                              placeholder={t("kpi.unit_placeholder", "z.B. Personen, Stunden, %, €")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="param-interval">{t("kpi.interval", "Reporting Interval")}</Label>
                            <Select
                              value={newParameter.interval || "monthly"}
                              onValueChange={(value: "weekly" | "monthly" | "quarterly" | "yearly") =>
                                setNewParameter({ ...newParameter, interval: value })
                              }
                            >
                              <SelectTrigger id="param-interval">
                                <SelectValue placeholder={t("kpi.select_interval", "Select interval")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">{t("kpi.interval_weekly", "Weekly")}</SelectItem>
                                <SelectItem value="monthly">{t("kpi.interval_monthly", "Monthly")}</SelectItem>
                                <SelectItem value="quarterly">{t("kpi.interval_quarterly", "Quarterly")}</SelectItem>
                                <SelectItem value="yearly">{t("kpi.interval_yearly", "Yearly")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Added fields for numeric parameters */}
                        {newParameter.type === "numeric" && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="param-min">{t("kpi.min_value", "Min Value")}</Label>
                                <Input
                                  id="param-min"
                                  type="number"
                                  value={newParameter.min ?? ""}
                                  onChange={(e) =>
                                    setNewParameter({ ...newParameter, min: Number.parseFloat(e.target.value) })
                                  }
                                  placeholder={t("kpi.enter_min_value", "e.g. 0")}
                                />
                              </div>
                              <div>
                                <Label htmlFor="param-max">{t("kpi.max_value", "Max Value")}</Label>
                                <Input
                                  id="param-max"
                                  type="number"
                                  value={newParameter.max ?? ""}
                                  onChange={(e) =>
                                    setNewParameter({ ...newParameter, max: Number.parseFloat(e.target.value) })
                                  }
                                  placeholder={t("kpi.enter_max_value", "e.g. 100")}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="param-target">{t("kpi.target_value", "Target Value")}</Label>
                              <Input
                                id="param-target"
                                type="number"
                                value={newParameter.target ?? ""}
                                onChange={(e) =>
                                  setNewParameter({ ...newParameter, target: Number.parseFloat(e.target.value) })
                                }
                                placeholder={t("kpi.enter_target_value", "e.g. 50")}
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <Label htmlFor="param-data-collection-start">
                            {t("kpi.data_collection_start", "Beginn der Datensammlung")}
                          </Label>
                          <Input
                            id="param-data-collection-start"
                            type="date"
                            value={newParameter.dataCollectionStart || ""}
                            onChange={(e) => setNewParameter({ ...newParameter, dataCollectionStart: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="param-active"
                            checked={newParameter.isActive}
                            onCheckedChange={(checked) => setNewParameter({ ...newParameter, isActive: checked })}
                          />
                          <Label htmlFor="param-active">{t("kpi.active", "Active")}</Label>
                        </div>
                        {newParameter.type === "calculated" && (
                          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <div>
                              <Label htmlFor="param-formula">Formula</Label>
                              <Input
                                id="param-formula"
                                value={newParameter.formula || ""}
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
                          {t("common.cancel", "Cancel")}
                        </Button>
                        <Button onClick={handleCreateParameter}>{t("kpi.create_parameter", "Create Parameter")}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("kpi.search_parameters", "Search parameters...")}
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
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoadingPractice ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("kpi.loading_parameters", "Loading practice parameters...")}
                </div>
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
                                {parameter.templateId && (
                                  <Badge variant="secondary" className="text-xs">
                                    {t("kpi.from_library", "From Library")}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{parameter.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{parameter.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {parameter.interval === "weekly" && (
                            <Badge
                              variant="default"
                              style={{
                                backgroundColor: intervalBadgeColors.weekly,
                                color: "#ffffff",
                              }}
                            >
                              {t("kpi.interval_weekly", "Weekly")}
                            </Badge>
                          )}
                          {parameter.interval === "monthly" && (
                            <Badge
                              variant="default"
                              style={{
                                backgroundColor: intervalBadgeColors.monthly,
                                color: "#ffffff",
                              }}
                            >
                              {t("kpi.interval_monthly", "Monthly")}
                            </Badge>
                          )}
                          {parameter.interval === "quarterly" && (
                            <Badge
                              variant="default"
                              style={{
                                backgroundColor: intervalBadgeColors.quarterly,
                                color: "#ffffff",
                              }}
                            >
                              {t("kpi.interval_quarterly", "Quarterly")}
                            </Badge>
                          )}
                          {parameter.interval === "yearly" && (
                            <Badge
                              variant="default"
                              style={{
                                backgroundColor: intervalBadgeColors.yearly,
                                color: "#ffffff",
                              }}
                            >
                              {t("kpi.interval_yearly", "Yearly")}
                            </Badge>
                          )}
                          {!parameter.interval && (
                            <Badge
                              variant="default"
                              style={{
                                backgroundColor: intervalBadgeColors.monthly,
                                color: "#ffffff",
                              }}
                            >
                              {t("kpi.interval_monthly", "Monthly")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={parameter.isActive ? "default" : "secondary"}>
                            {parameter.isActive ? t("kpi.active", "Active") : t("kpi.inactive", "Inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!parameter.isGlobal ? ( // Only show actions for non-global parameters
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t("kpi.actions", "Actions")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditParameter(parameter as Parameter)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t("kpi.edit", "Edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteParameterId(parameter.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("kpi.delete", "Delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            // For global parameters (templates), show a 'Template' badge
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="mr-1 h-3 w-3" />
                              {t("kpi.template", "Template")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("kpi.calculations.title", "Calculation Parameters")}</CardTitle>
                  <CardDescription>
                    {t(
                      "kpi.calculations.description",
                      "Manage calculated parameters that derive values from other parameters",
                    )}
                  </CardDescription>
                </div>
                <Button
                  className="gap-2"
                  onClick={() => {
                    setNewParameter({ ...newParameter, type: "calculated" }) // Set type to calculated
                    setIsCreateParameterOpen(true)
                  }}
                >
                  <Calculator className="h-4 w-4" />
                  {t("kpi.create_calculation", "Create Calculation")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {parameters
                  .filter((p) => p.type === "calculated")
                  .map((parameter) => (
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
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t("kpi.actions", "Actions")}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditParameter(parameter as Parameter)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("kpi.edit_formula", "Edit Formula")}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calculator className="mr-2 h-4 w-4" />
                                {t("kpi.test_calculation", "Test Calculation")}
                              </DropdownMenuItem>
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
                          <span className="text-muted-foreground">
                            {t("kpi.unit", "Unit")}: {parameter.unit || t("common.none", "None")}
                          </span>
                          <Badge variant={parameter.isActive ? "default" : "secondary"}>
                            {parameter.isActive ? t("kpi.active", "Active") : t("kpi.inactive", "Inactive")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {parameters.filter((p) => p.type === "calculated").length === 0 && (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {t("kpi.no_calculations", "No Calculated Parameters")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t(
                        "kpi.no_calculations_description",
                        "Create calculated parameters to derive values from existing parameters",
                      )}
                    </p>
                    <Button
                      onClick={() => {
                        setNewParameter({ ...newParameter, type: "calculated" })
                        setIsCreateParameterOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("kpi.create_first_calculation", "Create First Calculation")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("kpi.categories.title", "KPI Categories")}</CardTitle>
                  <CardDescription>
                    {t("kpi.categories.description", "Create categories of parameters for dashboard visualizations")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isImportCategoriesOpen} onOpenChange={setIsImportCategoriesOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent"
                        onClick={() => {
                          fetchGlobalCategories()
                        }}
                      >
                        <Download className="h-4 w-4" />
                        {t("kpi.import_from_template", "Import from Template")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t("kpi.import_categories", "Import Categories from Template")}</DialogTitle>
                        <DialogDescription>
                          {t(
                            "kpi.import_categories_description",
                            "Select categories from the Super Admin global templates to import into your practice",
                          )}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        {isLoadingGlobalCategories ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-muted-foreground">Loading global categories...</div>
                          </div>
                        ) : globalCategories.length === 0 ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-sm text-muted-foreground">
                              {t("kpi.no_global_categories", "No global categories available to import")}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-end mb-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (selectedCategoriesToImport.length === globalCategories.length) {
                                    // Deselect all
                                    setSelectedCategoriesToImport([])
                                  } else {
                                    // Select all
                                    setSelectedCategoriesToImport(globalCategories.map((cat) => cat.id))
                                  }
                                }}
                              >
                                {selectedCategoriesToImport.length === globalCategories.length
                                  ? t("kpi.deselect_all", "Deselect All")
                                  : t("kpi.select_all", "Select All")}
                              </Button>
                            </div>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {globalCategories.map((category) => (
                                <div
                                  key={category.id}
                                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                  onClick={() => {
                                    setSelectedCategoriesToImport((prev) =>
                                      prev.includes(category.id)
                                        ? prev.filter((id) => id !== category.id)
                                        : [...prev, category.id],
                                    )
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedCategoriesToImport.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedCategoriesToImport((prev) =>
                                        checked ? [...prev, category.id] : prev.filter((id) => id !== category.id),
                                      )
                                    }}
                                    onClick={(e) => e.stopPropagation()} // Stop propagation to parent div
                                  />
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
                        <Button variant="outline" onClick={() => setIsImportCategoriesOpen(false)}>
                          {t("common.cancel", "Cancel")}
                        </Button>
                        <Button onClick={handleImportCategories} disabled={selectedCategoriesToImport.length === 0}>
                          {t("kpi.import", "Import")}{" "}
                          {selectedCategoriesToImport.length > 0 && `(${selectedCategoriesToImport.length})`}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("kpi.create_category", "Create Category")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{t("kpi.create_new_category", "Create New KPI Category")}</DialogTitle>
                        <DialogDescription>
                          {t("kpi.create_category_description", "Category parameters for shared dashboard views")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label htmlFor="group-name">{t("kpi.category_name", "Category Name")}</Label>
                          <Input
                            id="group-name"
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                            placeholder={t("kpi.category_name_placeholder", "e.g. Daily Practice Metrics")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="group-description">{t("kpi.description", "Description")}</Label>
                          <Textarea
                            id="group-description"
                            value={newGroup.description}
                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                            placeholder={t("kpi.description_placeholder", "Description of the KPI category...")}
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="group-color">{t("kpi.color", "Color")}</Label>
                            <Select
                              value={newGroup.color}
                              onValueChange={(value) => setNewGroup({ ...newGroup, color: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bg-blue-500">{t("common.colors.blue", "Blue")}</SelectItem>
                                <SelectItem value="bg-green-500">{t("common.colors.green", "Green")}</SelectItem>
                                <SelectItem value="bg-purple-500">{t("common.colors.purple", "Purple")}</SelectItem>
                                <SelectItem value="bg-orange-500">{t("common.colors.orange", "Orange")}</SelectItem>
                                <SelectItem value="bg-red-500">{t("common.colors.red", "Red")}</SelectItem>
                                <SelectItem value="bg-pink-500">{t("common.colors.pink", "Pink")}</SelectItem>
                                <SelectItem value="bg-yellow-500">{t("common.colors.yellow", "Yellow")}</SelectItem>
                                <SelectItem value="bg-indigo-500">{t("common.colors.indigo", "Indigo")}</SelectItem>
                                <SelectItem value="bg-teal-500">{t("common.colors.teal", "Teal")}</SelectItem>
                                <SelectItem value="bg-cyan-500">{t("common.colors.cyan", "Cyan")}</SelectItem>
                                <SelectItem value="bg-lime-500">{t("common.colors.lime", "Lime")}</SelectItem>
                                <SelectItem value="bg-amber-500">{t("common.colors.amber", "Amber")}</SelectItem>
                                <SelectItem value="bg-rose-500">{t("common.colors.rose", "Rose")}</SelectItem>
                                <SelectItem value="bg-violet-500">{t("common.colors.violet", "Violet")}</SelectItem>
                                <SelectItem value="bg-emerald-500">{t("common.colors.emerald", "Emerald")}</SelectItem>
                                <SelectItem value="bg-gray-500">{t("common.colors.gray", "Gray")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                            <Switch
                              id="group-active"
                              checked={newGroup.isActive}
                              onCheckedChange={(checked) => setNewGroup({ ...newGroup, isActive: checked })}
                            />
                            <Label htmlFor="group-active">{t("kpi.active", "Active")}</Label>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                          {t("common.cancel", "Cancel")}
                        </Button>
                        <Button onClick={handleCreateGroup}>{t("kpi.create_category", "Create Category")}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t("kpi.actions", "Actions")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t("kpi.edit", "Edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              {t("kpi.manage_parameters", "Manage Parameters")}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteGroupId(group.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("kpi.delete", "Delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      <CardDescription className="text-sm">{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {group.parameters.length} {t("kpi.parameters_count", "parameters")}
                        </span>
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
        </TabsContent>
      </Tabs>

      {/* Edit Parameter Dialog */}
      <Dialog open={isEditParameterOpen} onOpenChange={setIsEditParameterOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("kpi.edit_parameter", "Edit Parameter")}</DialogTitle>
            <DialogDescription>
              {t("kpi.edit_parameter_description", "Update parameter settings and configuration")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-param-name">{t("kpi.parameter_name", "Parameter Name")}</Label>
                <Input
                  id="edit-param-name"
                  value={newParameter.name || ""}
                  onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                  placeholder={t("kpi.parameter_name_placeholder", "z.B. Teamgröße")}
                />
              </div>
              <div>
                <Label htmlFor="parameter-category">{t("kpi.category", "Category")}</Label>
                <Select
                  value={newParameter.category || ""}
                  onValueChange={(value) => setNewParameter({ ...newParameter, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("kpi.select_category", "Select category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryNames.length === 0 ? (
                      <SelectItem value="none" disabled>
                        {t("kpi.no_categories", "No categories available. Create categories in KPI settings first.")}
                      </SelectItem>
                    ) : (
                      categoryNames
                        .filter((cat) => cat && cat.trim() !== "")
                        .map((category, index) => (
                          <SelectItem key={`edit-category-${index}-${category}`} value={category}>
                            {category}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("kpi.or_type_category", "Or type a new category name in the field below")}
                </p>
                <Input
                  className="mt-2"
                  placeholder={t("kpi.new_category_placeholder", "Or enter new category name")}
                  value={newParameter.category || ""}
                  onChange={(e) => setNewParameter({ ...newParameter, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-param-description">{t("kpi.description", "Description")}</Label>
              <Textarea
                id="edit-param-description"
                value={newParameter.description || ""}
                onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                placeholder={t("kpi.description_placeholder", "Parameter description...")}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-param-unit">{t("kpi.unit_optional", "Unit (optional)")}</Label>
                <Input
                  id="edit-param-unit"
                  value={newParameter.unit || ""}
                  onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })}
                  placeholder={t("kpi.unit_placeholder", "z.B. Personen, Stunden, %, €")}
                />
              </div>
              <div>
                <Label htmlFor="edit-param-interval">{t("kpi.interval", "Reporting Interval")}</Label>
                <Select
                  value={newParameter.interval || "monthly"}
                  onValueChange={(value: "weekly" | "monthly" | "quarterly" | "yearly") =>
                    setNewParameter({ ...newParameter, interval: value })
                  }
                >
                  <SelectTrigger id="edit-param-interval">
                    <SelectValue placeholder={t("kpi.select_interval", "Select interval")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t("kpi.interval_weekly", "Weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("kpi.interval_monthly", "Monthly")}</SelectItem>
                    <SelectItem value="quarterly">{t("kpi.interval_quarterly", "Quarterly")}</SelectItem>
                    <SelectItem value="yearly">{t("kpi.interval_yearly", "Yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Added fields for numeric parameters */}
              {newParameter.type === "numeric" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-param-min">{t("kpi.min_value", "Min Value")}</Label>
                      <Input
                        id="edit-param-min"
                        type="number"
                        value={newParameter.min ?? ""}
                        onChange={(e) => setNewParameter({ ...newParameter, min: Number.parseFloat(e.target.value) })}
                        placeholder={t("kpi.enter_min_value", "e.g. 0")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-param-max">{t("kpi.max_value", "Max Value")}</Label>
                      <Input
                        id="edit-param-max"
                        type="number"
                        value={newParameter.max ?? ""}
                        onChange={(e) => setNewParameter({ ...newParameter, max: Number.parseFloat(e.target.value) })}
                        placeholder={t("kpi.enter_max_value", "e.g. 100")}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-param-target">{t("kpi.target_value", "Target Value")}</Label>
                    <Input
                      id="edit-param-target"
                      type="number"
                      value={newParameter.target ?? ""}
                      onChange={(e) => setNewParameter({ ...newParameter, target: Number.parseFloat(e.target.value) })}
                      placeholder={t("kpi.enter_target_value", "e.g. 50")}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="edit-param-data-collection-start">
                  {t("kpi.data_collection_start", "Beginn der Datensammlung")}
                </Label>
                <Input
                  id="edit-param-data-collection-start"
                  type="date"
                  value={newParameter.dataCollectionStart || ""}
                  onChange={(e) => setNewParameter({ ...newParameter, dataCollectionStart: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-param-active"
                  checked={newParameter.isActive}
                  onCheckedChange={(checked) => setNewParameter({ ...newParameter, isActive: checked })}
                />
                <Label htmlFor="edit-param-active">{t("kpi.active", "Active")}</Label>
              </div>
            </div>
            {newParameter.type === "calculated" && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="edit-param-formula">Formula</Label>
                  <Input
                    id="edit-param-formula"
                    value={newParameter.formula || ""}
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
            <Button variant="outline" onClick={() => setIsEditParameterOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleUpdateParameter}>{t("kpi.update_parameter", "Update Parameter")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("kpi.edit_category", "Edit KPI Category")}</DialogTitle>
            <DialogDescription>{t("kpi.edit_category_description", "Update category settings")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="edit-group-name">{t("kpi.category_name", "Category Name")}</Label>
              <Input
                id="edit-group-name"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder={t("kpi.category_name_placeholder", "e.g. Daily Practice Metrics")}
              />
            </div>
            <div>
              <Label htmlFor="edit-group-description">{t("kpi.description", "Description")}</Label>
              <Textarea
                id="edit-group-description"
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder={t("kpi.description_placeholder", "Description of the KPI category...")}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-group-color">{t("kpi.color", "Color")}</Label>
                <Select value={newGroup.color} onValueChange={(value) => setNewGroup({ ...newGroup, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-blue-500">{t("common.colors.blue", "Blue")}</SelectItem>
                    <SelectItem value="bg-green-500">{t("common.colors.green", "Green")}</SelectItem>
                    <SelectItem value="bg-purple-500">{t("common.colors.purple", "Purple")}</SelectItem>
                    <SelectItem value="bg-orange-500">{t("common.colors.orange", "Orange")}</SelectItem>
                    <SelectItem value="bg-red-500">{t("common.colors.red", "Red")}</SelectItem>
                    <SelectItem value="bg-pink-500">{t("common.colors.pink", "Pink")}</SelectItem>
                    <SelectItem value="bg-yellow-500">{t("common.colors.yellow", "Yellow")}</SelectItem>
                    <SelectItem value="bg-indigo-500">{t("common.colors.indigo", "Indigo")}</SelectItem>
                    <SelectItem value="bg-teal-500">{t("common.colors.teal", "Teal")}</SelectItem>
                    <SelectItem value="bg-cyan-500">{t("common.colors.cyan", "Cyan")}</SelectItem>
                    <SelectItem value="bg-lime-500">{t("common.colors.lime", "Lime")}</SelectItem>
                    <SelectItem value="bg-amber-500">{t("common.colors.amber", "Amber")}</SelectItem>
                    <SelectItem value="bg-rose-500">{t("common.colors.rose", "Rose")}</SelectItem>
                    <SelectItem value="bg-violet-500">{t("common.colors.violet", "Violet")}</SelectItem>
                    <SelectItem value="bg-emerald-500">{t("common.colors.emerald", "Emerald")}</SelectItem>
                    <SelectItem value="bg-gray-500">{t("common.colors.gray", "Gray")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="edit-group-active"
                  checked={newGroup.isActive}
                  onCheckedChange={(checked) => setNewGroup({ ...newGroup, isActive: checked })}
                />
                <Label htmlFor="edit-group-active">{t("kpi.active", "Active")}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleUpdateGroup}>{t("kpi.update_category", "Update Category")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Parameter Confirmation Dialog */}
      <AlertDialog open={!!deleteParameterId} onOpenChange={() => setDeleteParameterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kpi.delete_parameter", "Delete Parameter")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "kpi.delete_parameter_confirmation",
                "Are you sure you want to delete this parameter? This action cannot be undone and will remove the parameter from all groups.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteParameterId && handleDeleteParameter(deleteParameterId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("kpi.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kpi.delete_category", "Delete KPI Category")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "kpi.delete_category_confirmation",
                "Are you sure you want to delete this KPI category? This action cannot be undone.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteGroupId && handleDeleteGroup(deleteGroupId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("kpi.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBrowseGlobalOpen} onOpenChange={setIsBrowseGlobalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("kpi.browse_global_library", "Browse Global KPI Library")}</DialogTitle>
            <DialogDescription>
              {t(
                "kpi.browse_global_library_description",
                "Select multiple global KPIs from the admin library to add to your practice templates. Already applied templates cannot be selected again.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingGlobal ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("kpi.loading_global_kpis", "Loading global KPIs...")}
              </div>
            ) : globalError ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">{t("kpi.load_global_failed", "Failed to load global KPIs")}</p>
                <p className="text-sm text-muted-foreground">{globalError}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {(globalParameters as GlobalParameter[]).map((globalParam) => {
                  const isUsed = usedTemplates.has(globalParam.id)
                  const isSelected = selectedTemplates.has(globalParam.id)

                  return (
                    <div
                      key={globalParam.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : isUsed
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900 opacity-60"
                            : "hover:bg-accent/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isUsed}
                        onCheckedChange={(checked) => {
                          if (isUsed) return // Cannot select if already used

                          const newSelected = new Set(selectedTemplates)
                          if (checked) {
                            newSelected.add(globalParam.id)
                          } else {
                            newSelected.delete(globalParam.id)
                          }
                          setSelectedTemplates(newSelected)
                        }}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <Globe className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {globalParam.name}
                            {isUsed && (
                              <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                                <Check className="h-3 w-3 mr-1" />
                                {t("kpi.applied", "Applied")}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{globalParam.description}</div>
                        </div>
                        <Badge variant="outline">{globalParam.category}</Badge>
                        <Badge variant="secondary">{globalParam.type}</Badge>
                        {globalParam.unit && <Badge variant="outline">{globalParam.unit}</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTemplates.size > 0 &&
                `${selectedTemplates.size} template${selectedTemplates.size > 1 ? "s" : ""} selected`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplates(new Set()) // Clear selection
                  setIsBrowseGlobalOpen(false)
                }}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button onClick={handleApplySelectedTemplates} disabled={selectedTemplates.size === 0} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("kpi.apply_selected", "Apply Selected")} ({selectedTemplates.size})
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog to remove a single global template */}
      <AlertDialog open={!!deleteGlobalParameterId} onOpenChange={() => setDeleteGlobalParameterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kpi.remove_global_template", "Remove Global KPI Template")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "kpi.remove_global_template_confirmation",
                "Are you sure you want to remove this global KPI template? This action cannot be undone and will remove the template from your practice.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteGlobalParameterId) {
                  await handleDeleteGlobalParameter(deleteGlobalParameterId)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("kpi.remove_template", "Remove Template")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// </CHANGE> Add default export
export default ParameterManagement
