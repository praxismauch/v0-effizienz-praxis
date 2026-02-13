"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/contexts/translation-context"
import Logger from "@/lib/logger"
import type { Parameter, ParameterGroup, GlobalParameter } from "../types"
import { DEFAULT_PARAMETER, DEFAULT_GROUP, DEFAULT_INTERVAL_COLORS } from "../types"

function transformApiParameter(param: any): Parameter {
  return {
    id: param.id,
    name: param.name,
    description: param.description || "",
    type: param.data_type || param.type,
    category: param.category,
    unit: param.unit,
    interval: param.interval,
    isActive: true,
    createdAt: param.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    updatedAt: param.updated_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    isGlobal: param.is_global || false,
    templateId: param.template_id,
    dataCollectionStart: param.data_collection_start,
    min: param.min,
    max: param.max,
    target: param.target,
  }
}

function transformApiCategory(cat: any): ParameterGroup {
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description || "",
    parameters: cat.parameters || [],
    color: cat.color || "bg-blue-500",
    isActive: cat.is_active ?? true,
    createdAt: cat.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    practiceId: cat.practice_id,
    templateId: cat.template_id,
  }
}

function transformApiGlobalParameter(param: any): GlobalParameter {
  return {
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
    min: param.min,
    max: param.max,
    target: param.target,
    dataCollectionStart: param.data_collection_start,
  }
}

export function useParameters(practiceId: string) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const { t } = useTranslation()

  // Core state
  const [activeTab, setActiveTab] = useState("parameters")
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [groups, setGroups] = useState<ParameterGroup[]>([])
  const [globalParameters, setGlobalParameters] = useState<GlobalParameter[]>([])
  const [usedTemplates, setUsedTemplates] = useState<Set<string>>(new Set())

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedInterval, setSelectedInterval] = useState("all")

  // Dialog state
  const [isCreateParameterOpen, setIsCreateParameterOpen] = useState(false)
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isCalculationDialogOpen, setIsCalculationDialogOpen] = useState(false)
  const [isEditParameterOpen, setIsEditParameterOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [isBrowseGlobalOpen, setIsBrowseGlobalOpen] = useState(false)
  const [isImportCategoriesOpen, setIsImportCategoriesOpen] = useState(false)
  const [isImportFromLibraryOpen, setIsImportFromLibraryOpen] = useState(false)

  // Edit/delete state
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null)
  const [editingGroup, setEditingGroup] = useState<ParameterGroup | null>(null)
  const [deleteParameterId, setDeleteParameterId] = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [deleteGlobalParameterId, setDeleteGlobalParameterId] = useState<string | null>(null)
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())

  // Import state
  const [globalCategories, setGlobalCategories] = useState<ParameterGroup[]>([])
  const [selectedCategoriesToImport, setSelectedCategoriesToImport] = useState<string[]>([])
  const [globalTemplates, setGlobalTemplates] = useState<any[]>([])
  const [selectedTemplatesForImport, setSelectedTemplatesForImport] = useState<string[]>([])
  const [importSearchTerm, setImportSearchTerm] = useState("")

  // Loading state
  const [isLoadingPractice, setIsLoadingPractice] = useState(true)
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoadingUsedTemplates, setIsLoadingUsedTemplates] = useState(true)
  const [isLoadingGlobalCategories, setIsLoadingGlobalCategories] = useState(false)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [practiceError, setPracticeError] = useState<string | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Form state
  const [newParameter, setNewParameter] = useState<Partial<Parameter>>({ ...DEFAULT_PARAMETER })
  const [newGroup, setNewGroup] = useState<Partial<ParameterGroup>>({ ...DEFAULT_GROUP })
  const [intervalBadgeColors, setIntervalBadgeColors] = useState(DEFAULT_INTERVAL_COLORS)

  // --- Data Fetching ---

  const fetchParameters = useCallback(async () => {
    if (!currentPractice) { setIsLoadingPractice(false); return }
    try {
      setIsLoadingPractice(true)
      setPracticeError(null)
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
      const data = await response.json()
      setParameters((data.parameters || []).map(transformApiParameter))
    } catch (error) {
      Logger.error("api", "Error fetching practice parameters", error)
      setPracticeError(error instanceof Error ? error.message : "Failed to load practice parameters")
    } finally {
      setIsLoadingPractice(false)
    }
  }, [currentPractice])

  const fetchCategories = useCallback(async () => {
    if (!currentPractice) { setIsLoadingCategories(false); return }
    try {
      setIsLoadingCategories(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`)
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
      const data = await response.json()
      setGroups((data.categories || []).map(transformApiCategory))
    } catch (error) {
      Logger.error("api", "Error fetching practice categories", error)
      setGroups([])
    } finally {
      setIsLoadingCategories(false)
    }
  }, [currentPractice])

  useEffect(() => { fetchParameters() }, [fetchParameters])
  useEffect(() => { fetchCategories() }, [fetchCategories])

  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        setIsLoadingGlobal(true)
        setGlobalError(null)
        const response = await fetch("/api/global-parameters")
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
        const data = await response.json()
        setGlobalParameters((data.parameters || []).map(transformApiGlobalParameter))
      } catch (error) {
        Logger.error("api", "Error fetching global KPIs", error)
        setGlobalError(error instanceof Error ? error.message : "Failed to load global KPIs")
      } finally {
        setIsLoadingGlobal(false)
      }
    }
    fetchGlobal()
  }, [])

  useEffect(() => {
    const fetchUsed = async () => {
      if (!currentPractice) { setIsLoadingUsedTemplates(false); return }
      try {
        setIsLoadingUsedTemplates(true)
        const response = await fetch(`/api/practices/${currentPractice.id}/template-usage`)
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
        const data = await response.json()
        setUsedTemplates(new Set(data.usedTemplates?.map((u: any) => u.template_id) || []))
      } catch (error) {
        Logger.error("api", "Error fetching used templates", error)
        setUsedTemplates(new Set())
      } finally {
        setIsLoadingUsedTemplates(false)
      }
    }
    fetchUsed()
  }, [currentPractice])

  useEffect(() => {
    const loadDisplaySettings = async () => {
      if (!currentPractice?.id) return
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        const data = await response.json()
        if (data.settings?.display_settings?.intervalBadgeColors) {
          setIntervalBadgeColors(data.settings.display_settings.intervalBadgeColors)
        }
      } catch (error) {
        Logger.error("ui", "Failed to load display settings", error)
      }
    }
    loadDisplaySettings()
  }, [currentPractice?.id])

  // --- Derived data ---

  const practiceOnlyParameters = parameters.filter((p) => !p.isGlobal)
  const uniqueParameters = useMemo(() => {
    return practiceOnlyParameters.reduce((acc, param) => {
      if (!acc.find((p) => p.name === param.name)) acc.push(param)
      return acc
    }, [] as Parameter[])
  }, [practiceOnlyParameters])

  const categoryNames = useMemo(() => {
    return Array.from(new Set(groups.map((g) => g.name))).sort()
  }, [groups])

  const categories = useMemo(() => {
    const uniqueCats = new Set<string>()
    parameters.forEach((p) => { if (p.category?.trim()) uniqueCats.add(p.category) })
    return Array.from(uniqueCats).sort()
  }, [parameters])

  const filteredParameters = useMemo(() => {
    return uniqueParameters.filter((param) => {
      const matchesSearch = param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || param.category === selectedCategory
      const matchesInterval = selectedInterval === "all" || param.interval === selectedInterval
      return matchesSearch && matchesCategory && matchesInterval
    })
  }, [uniqueParameters, searchTerm, selectedCategory, selectedInterval])

  const getParameterName = useCallback((id: string) => {
    const allParams = [...parameters, ...globalParameters]
    return allParams.find((p) => p.id === id)?.name || `Parameter ${id}`
  }, [parameters, globalParameters])

  // --- CRUD Handlers ---

  const handleCreateParameter = async () => {
    if (!currentPractice) {
      toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" })
      return
    }
    if (!newParameter.name || !newParameter.category) {
      toast({ title: t("common.error", "Error"), description: t("kpi.name_category_required", "Name and category are required"), variant: "destructive" })
      return
    }
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParameter.name, description: newParameter.description, category: newParameter.category,
          dataType: newParameter.type || "number", unit: newParameter.unit, interval: newParameter.interval || "monthly",
          dataCollectionStart: newParameter.dataCollectionStart, isGlobal: false,
          min: newParameter.type === "numeric" ? newParameter.min : undefined,
          max: newParameter.type === "numeric" ? newParameter.max : undefined,
          target: newParameter.type === "numeric" ? newParameter.target : undefined,
        }),
      })
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Failed to create parameter") }
      const data = await response.json()
      const parameter: Parameter = {
        id: data.parameter.id, name: newParameter.name || "", description: newParameter.description || "",
        type: newParameter.type || "number", category: newParameter.category || "", unit: newParameter.unit || "",
        interval: newParameter.interval || "monthly", dataCollectionStart: newParameter.dataCollectionStart,
        isActive: true, createdAt: data.parameter.createdAt || new Date().toISOString().split("T")[0],
        updatedAt: data.parameter.updatedAt || new Date().toISOString().split("T")[0], isGlobal: false,
        min: newParameter.min, max: newParameter.max, target: newParameter.target,
      }
      setParameters((prev) => [...prev, parameter])
      setNewParameter({ ...DEFAULT_PARAMETER })
      setIsCreateParameterOpen(false)
      toast({ title: t("kpi.parameter_created", "Parameter Created"), description: t("kpi.parameter_created_description", "The parameter has been created successfully") })
    } catch (error) {
      Logger.error("api", "Error creating parameter", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.create_failed", "Failed to create parameter"), variant: "destructive" })
    }
  }

  const handleEditParameter = (parameter: Parameter) => {
    setEditingParameter(parameter)
    setNewParameter({
      name: parameter.name, description: parameter.description, type: parameter.type,
      category: parameter.category, unit: parameter.unit, interval: parameter.interval,
      defaultValue: parameter.defaultValue, options: parameter.options, formula: parameter.formula,
      dependencies: parameter.dependencies, isActive: parameter.isActive,
      dataCollectionStart: parameter.dataCollectionStart || new Date().toISOString().split("T")[0],
      min: parameter.min, max: parameter.max, target: parameter.target,
    })
    setIsEditParameterOpen(true)
  }

  const handleUpdateParameter = () => {
    if (!editingParameter) return
    if (editingParameter.isGlobal) {
      toast({ title: t("kpi.cannot_edit_global", "Cannot Edit Global KPI"), description: t("kpi.cannot_edit_global_description", "Global KPIs are templates and cannot be directly modified here."), variant: "destructive" })
      return
    }
    const updatedParameter = { ...editingParameter, ...newParameter, updatedAt: new Date().toISOString().split("T")[0] } as Parameter
    setParameters((prev) => prev.map((p) => (p.id === editingParameter.id ? updatedParameter : p)))
    setEditingParameter(null)
    setNewParameter({ ...DEFAULT_PARAMETER })
    setIsEditParameterOpen(false)
  }

  const handleDeleteParameter = async (parameterId: string, force = false) => {
    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter) return
    if (parameter.isGlobal) {
      toast({ title: t("kpi.cannot_delete_global", "Cannot Delete Global KPI"), description: t("kpi.cannot_delete_global_description", "Global KPIs are templates and cannot be deleted."), variant: "destructive" })
      setDeleteParameterId(null); return
    }
    if (!currentPractice) {
      toast({ title: t("common.error", "Error"), description: t("kpi.no_practice_selected", "No practice selected"), variant: "destructive" })
      setDeleteParameterId(null); return
    }
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters/${parameterId}?force=${force}`, { method: "DELETE" })
      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const errorData = await response.json()
          if (errorData.hasValues && !force) {
            if (window.confirm(t("kpi.confirm_delete_with_data", `This parameter has ${errorData.valueCount || 0} data entries. Delete anyway?`))) {
              await handleDeleteParameter(parameterId, true); return
            } else { setDeleteParameterId(null); return }
          }
          throw new Error(errorData.error || "Failed to delete parameter")
        }
        throw new Error(await response.text() || "Failed to delete parameter")
      }
      setParameters((prev) => prev.filter((p) => p.id !== parameterId))
      setGroups((prev) => prev.map((g) => ({ ...g, parameters: g.parameters.filter((id) => id !== parameterId) })))
      toast({ title: t("kpi.parameter_deleted", "Parameter deleted"), description: t("kpi.parameter_deleted_description", "The parameter has been successfully deleted.") })
    } catch (error) {
      Logger.error("api", "Error deleting parameter", error, { parameterId })
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.delete_parameter_error", "Failed to delete parameter"), variant: "destructive" })
      setDeleteParameterId(null)
    }
  }

  const handleCreateGroup = async () => {
    if (!currentPractice) { toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" }); return }
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroup.name, description: newGroup.description, color: newGroup.color, parameters: newGroup.parameters, isActive: newGroup.isActive }),
      })
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Failed to create category") }
      const data = await response.json()
      const group: ParameterGroup = { id: data.category.id, name: data.category.name, description: data.category.description, parameters: data.category.parameters, color: data.category.color, isActive: data.category.is_active, createdAt: data.category.created_at?.split("T")[0] || new Date().toISOString().split("T")[0] }
      setGroups((prev) => [...prev, group])
      setNewGroup({ ...DEFAULT_GROUP })
      setIsCreateGroupOpen(false)
      toast({ title: t("kpi.category_created", "Category Created"), description: t("kpi.category_created_description", "KPI category has been created successfully") })
    } catch (error) {
      Logger.error("api", "Error creating category", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.create_category_failed", "Failed to create category"), variant: "destructive" })
    }
  }

  const handleEditGroup = (group: ParameterGroup) => {
    setEditingGroup(group)
    setNewGroup({ name: group.name || "", description: group.description || "", parameters: group.parameters, color: group.color, isActive: group.isActive })
    setIsEditGroupOpen(true)
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup || !currentPractice) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups/${editingGroup.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroup.name, description: newGroup.description, color: newGroup.color, isActive: newGroup.isActive }),
      })
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Failed to update category") }
      const data = await response.json()
      const updated: ParameterGroup = { id: data.category.id, name: data.category.name, description: data.category.description, parameters: data.category.parameters, color: data.category.color, isActive: data.category.is_active, createdAt: editingGroup.createdAt }
      setGroups((prev) => prev.map((g) => (g.id === editingGroup.id ? updated : g)))
      setEditingGroup(null)
      setNewGroup({ ...DEFAULT_GROUP })
      setIsEditGroupOpen(false)
      toast({ title: t("kpi.category_updated", "Category Updated"), description: t("kpi.category_updated_description", "KPI category has been updated successfully") })
    } catch (error) {
      Logger.error("api", "Error updating category", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.update_category_failed", "Failed to update category"), variant: "destructive" })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!currentPractice) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-groups?id=${groupId}`, { method: "DELETE" })
      if (!response.ok) {
        let msg = t("kpi.delete_category_failed", "Failed to delete category")
        try { const err = await response.json(); msg = err.error || msg } catch { msg = `${msg} (${response.status})` }
        throw new Error(msg)
      }
      await fetchCategories()
      setDeleteGroupId(null)
      toast({ title: t("common.success", "Success"), description: t("kpi.category_deleted_description", "Category deleted successfully") })
    } catch (error) {
      Logger.error("api", "Error deleting category", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.delete_category_failed", "Failed to delete category"), variant: "destructive" })
    }
  }

  const createParameterFromTemplate = async (globalParam: GlobalParameter) => {
    if (!currentPractice) { toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" }); return }
    if (usedTemplates.has(globalParam.id)) { toast({ title: t("kpi.template_already_applied", "Template Already Applied"), description: t("kpi.template_already_applied_description", "This template has already been applied to your practice"), variant: "destructive" }); return }
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: globalParam.name, description: globalParam.description, category: globalParam.category, dataType: globalParam.type, unit: globalParam.unit, interval: globalParam.interval, dataCollectionStart: globalParam.dataCollectionStart, isGlobal: true, templateId: globalParam.id, min: globalParam.type === "numeric" ? globalParam.min : undefined, max: globalParam.type === "numeric" ? globalParam.max : undefined, target: globalParam.type === "numeric" ? globalParam.target : undefined }),
      })
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Failed to create parameter from template") }
      const data = await response.json()
      const parameter: Parameter = { id: data.parameter.id, name: globalParam.name, description: globalParam.description, type: globalParam.type, category: globalParam.category, unit: globalParam.unit, interval: globalParam.interval, defaultValue: globalParam.defaultValue, options: globalParam.options, formula: globalParam.formula, dependencies: globalParam.dependencies, isActive: true, createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0], isGlobal: true, templateId: globalParam.id, dataCollectionStart: globalParam.dataCollectionStart, min: globalParam.min, max: globalParam.max, target: globalParam.target }
      setParameters((prev) => [...prev, parameter])
      setUsedTemplates((prev) => new Set([...prev, globalParam.id]))
      toast({ title: t("kpi.template_applied", "Template Applied"), description: t("kpi.template_applied_description", `Successfully added "${globalParam.name}" to your practice parameters`) })
    } catch (error) {
      Logger.error("api", "Error creating parameter from template", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.apply_template_failed", "Failed to apply template"), variant: "destructive" })
    }
  }

  const handleApplySelectedTemplates = async () => {
    if (!currentPractice) { toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" }); return }
    if (selectedTemplates.size === 0) { toast({ title: t("kpi.no_templates_selected", "No Templates Selected"), description: t("kpi.no_templates_selected_description", "Please select at least one template to apply"), variant: "destructive" }); return }
    const templatesToApply = globalParameters.filter((p) => selectedTemplates.has(p.id) && !usedTemplates.has(p.id))
    if (templatesToApply.length === 0) { toast({ title: t("kpi.templates_already_applied", "Templates Already Applied"), description: t("kpi.templates_already_applied_description", "All selected templates have already been applied"), variant: "destructive" }); setSelectedTemplates(new Set()); return }
    try {
      const results = await Promise.all(templatesToApply.map(async (gp) => {
        const resp = await fetch(`/api/practices/${currentPractice.id}/parameters`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: gp.name, description: gp.description, category: gp.category, dataType: gp.type, unit: gp.unit, interval: gp.interval, dataCollectionStart: gp.dataCollectionStart, isGlobal: true, templateId: gp.id, min: gp.type === "numeric" ? gp.min : undefined, max: gp.type === "numeric" ? gp.max : undefined, target: gp.type === "numeric" ? gp.target : undefined }) })
        if (!resp.ok) throw new Error(`Failed to apply ${gp.name}`)
        return resp.json()
      }))
      const newParams: Parameter[] = results.map((data, i) => ({ id: data.parameter.id, name: templatesToApply[i].name, description: templatesToApply[i].description, type: templatesToApply[i].type, category: templatesToApply[i].category, unit: templatesToApply[i].unit, interval: templatesToApply[i].interval, defaultValue: templatesToApply[i].defaultValue, options: templatesToApply[i].options, formula: templatesToApply[i].formula, dependencies: templatesToApply[i].dependencies, isActive: true, createdAt: new Date().toISOString().split("T")[0], updatedAt: new Date().toISOString().split("T")[0], isGlobal: true, templateId: templatesToApply[i].id, dataCollectionStart: templatesToApply[i].dataCollectionStart, min: templatesToApply[i].min, max: templatesToApply[i].max, target: templatesToApply[i].target }))
      setParameters((prev) => [...prev, ...newParams])
      setUsedTemplates((prev) => new Set([...prev, ...templatesToApply.map((t) => t.id)]))
      setSelectedTemplates(new Set())
      toast({ title: t("kpi.templates_applied", "Templates Applied"), description: t("kpi.templates_applied_description", `Successfully applied ${templatesToApply.length} templates`) })
      setIsBrowseGlobalOpen(false)
    } catch (error) {
      Logger.error("api", "Error applying templates", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.apply_templates_failed", "Failed to apply some templates"), variant: "destructive" })
    }
  }

  const handleDeleteGlobalParameter = async (parameterId: string) => {
    if (!currentPractice) { toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" }); setDeleteGlobalParameterId(null); return }
    try {
      const globalTemplate = globalParameters.find((p) => p.id === parameterId)
      if (!globalTemplate) throw new Error(t("kpi.template_not_found", "Template not found"))
      const appliedParams = parameters.filter((p) => p.isGlobal && p.name === globalTemplate.name)
      if (appliedParams.length > 0) {
        await Promise.all(appliedParams.map(async (param) => {
          const resp = await fetch(`/api/practices/${currentPractice.id}/parameters/${param.id}`, { method: "DELETE" })
          if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || "Failed to remove template from practice") }
        }))
      }
      await fetch(`/api/practices/${currentPractice.id}/template-usage?templateId=${parameterId}`, { method: "DELETE" })
      // Refetch
      const [paramsResp, usageResp] = await Promise.all([fetch(`/api/practices/${currentPractice.id}/parameters`), fetch(`/api/practices/${currentPractice.id}/template-usage`)])
      if (paramsResp.ok) { const d = await paramsResp.json(); setParameters((d.parameters || []).map(transformApiParameter)) }
      if (usageResp.ok) { const d = await usageResp.json(); setUsedTemplates(new Set(d.usedTemplates?.map((u: any) => u.template_id) || [])) }
      toast({ title: t("kpi.template_removed", "Template Removed"), description: t("kpi.template_removed_description", "Template has been removed from your practice") })
    } catch (error) {
      Logger.error("api", "Error removing template", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.remove_template_failed", "Failed to remove template from practice"), variant: "destructive" })
    } finally { setDeleteGlobalParameterId(null) }
  }

  const handleRemoveAllTemplates = async () => {
    if (!currentPractice) { toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" }); return }
    try {
      const appliedParams = parameters.filter((p) => p.isGlobal)
      if (appliedParams.length === 0) { toast({ title: t("kpi.no_templates_to_remove", "No Templates to Remove"), description: t("kpi.no_templates_to_remove_description", "There are no applied templates in your practice") }); return }
      await Promise.all(appliedParams.map(async (param) => { await fetch(`/api/practices/${currentPractice.id}/parameters/${param.id}`, { method: "DELETE" }) }))
      await Promise.all(Array.from(usedTemplates).map(async (tid) => { await fetch(`/api/practices/${currentPractice.id}/template-usage?templateId=${tid}`, { method: "DELETE" }) }))
      const [paramsResp, usageResp] = await Promise.all([fetch(`/api/practices/${currentPractice.id}/parameters`), fetch(`/api/practices/${currentPractice.id}/template-usage`)])
      if (paramsResp.ok) { const d = await paramsResp.json(); setParameters((d.parameters || []).map(transformApiParameter)) }
      if (usageResp.ok) { const d = await usageResp.json(); setUsedTemplates(new Set(d.usedTemplates?.map((u: any) => u.template_id) || [])) }
      toast({ title: t("kpi.all_templates_removed", "All Templates Removed"), description: t("kpi.all_templates_removed_description", `Successfully removed ${appliedParams.length} templates`) })
    } catch (error) {
      Logger.error("api", "Error removing all templates", error)
      toast({ title: t("common.error", "Error"), description: t("kpi.remove_all_templates_failed", "Failed to remove all templates"), variant: "destructive" })
    }
  }

  const fetchGlobalCategories = async () => {
    try {
      setIsLoadingGlobalCategories(true)
      const response = await fetch("/api/global-parameter-groups")
      if (!response.ok) { const err = await response.json(); throw new Error(`Failed to fetch global categories: ${err.details || err.error}`) }
      const data = await response.json()
      setGlobalCategories((data.categories || []).filter((c: any) => c.is_active === true).map((cat: any) => ({ id: cat.id, name: cat.name, description: cat.description || "", parameters: [], color: cat.color || "bg-blue-500", isActive: cat.is_active ?? true, createdAt: cat.created_at?.split("T")[0] || new Date().toISOString().split("T")[0] })))
    } catch (error) {
      Logger.error("api", "Error fetching global categories", error)
      setGlobalCategories([])
    } finally { setIsLoadingGlobalCategories(false) }
  }

  const handleImportCategories = async () => {
    if (!currentPractice) { toast({ title: t("common.error", "Error"), description: t("kpi.select_practice_first", "Please select a practice first"), variant: "destructive" }); return }
    try {
      const cats = globalCategories.filter((c) => selectedCategoriesToImport.includes(c.id))
      for (const category of cats) {
        const resp = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: category.name, description: category.description, color: category.color, parameters: [], isActive: true, templateId: category.id }) })
        if (!resp.ok) Logger.warn("api", `Failed to import category: ${category.name}`)
      }
      await fetchCategories()
      setSelectedCategoriesToImport([])
      setIsImportCategoriesOpen(false)
      toast({ title: t("kpi.categories_imported", "Categories Imported"), description: t("kpi.categories_imported_description", `Successfully imported ${cats.length} categories`) })
    } catch (error) {
      Logger.error("api", "Error importing categories", error)
      toast({ title: t("common.error", "Error"), description: error instanceof Error ? error.message : t("kpi.import_categories_failed", "Failed to import categories"), variant: "destructive" })
    }
  }

  return {
    // State
    activeTab, setActiveTab,
    parameters, groups, globalParameters, usedTemplates,
    searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, selectedInterval, setSelectedInterval,
    // Dialogs
    isCreateParameterOpen, setIsCreateParameterOpen, isCreateGroupOpen, setIsCreateGroupOpen,
    isCalculationDialogOpen, setIsCalculationDialogOpen,
    isEditParameterOpen, setIsEditParameterOpen, isEditGroupOpen, setIsEditGroupOpen,
    isBrowseGlobalOpen, setIsBrowseGlobalOpen,
    isImportCategoriesOpen, setIsImportCategoriesOpen, isImportFromLibraryOpen, setIsImportFromLibraryOpen,
    // Edit/delete
    editingParameter, editingGroup, deleteParameterId, setDeleteParameterId,
    deleteGroupId, setDeleteGroupId, deleteGlobalParameterId, setDeleteGlobalParameterId,
    selectedTemplates, setSelectedTemplates,
    // Import
    globalCategories, selectedCategoriesToImport, setSelectedCategoriesToImport,
    globalTemplates, setGlobalTemplates, selectedTemplatesForImport, setSelectedTemplatesForImport,
    importSearchTerm, setImportSearchTerm,
    // Loading
    isLoadingPractice, isLoadingGlobal, isLoadingCategories, isLoadingUsedTemplates,
    isLoadingGlobalCategories, isLoadingTemplates, setIsLoadingTemplates,
    practiceError, globalError,
    // Form
    newParameter, setNewParameter, newGroup, setNewGroup, intervalBadgeColors,
    // Derived
    filteredParameters, categoryNames, categories, getParameterName,
    // Handlers
    handleCreateParameter, handleEditParameter, handleUpdateParameter, handleDeleteParameter,
    handleCreateGroup, handleEditGroup, handleUpdateGroup, handleDeleteGroup,
    createParameterFromTemplate, handleApplySelectedTemplates,
    handleDeleteGlobalParameter, handleRemoveAllTemplates,
    fetchGlobalCategories, handleImportCategories,
    fetchParameters, fetchCategories,
    // Context
    currentPractice, currentUser, t,
  }
}
