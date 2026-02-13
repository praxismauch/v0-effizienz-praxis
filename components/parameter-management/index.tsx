"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, Calculator, BarChart3 } from "lucide-react"
import { useParameters } from "./hooks/use-parameters"
import { ParametersTab } from "./parameters-tab"
import { CalculationsTab } from "./calculations-tab"
import { CategoriesTab } from "./categories-tab"
import {
  CreateParameterDialog, EditParameterDialog,
  CreateGroupDialog, EditGroupDialog,
  DeleteParameterDialog, DeleteGroupDialog, DeleteGlobalTemplateDialog,
  BrowseGlobalDialog, ImportCategoriesDialog,
} from "./parameter-dialogs"
import { DEFAULT_PARAMETER } from "./types"

export function ParameterManagement({ practiceId }: { practiceId: string }) {
  const hook = useParameters(practiceId)

  return (
    <div className="space-y-6">
      <Tabs value={hook.activeTab} onValueChange={hook.setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="parameters" className="gap-2">
            <Database className="h-4 w-4" />
            {hook.t("kpi.tabs.parameters", "Parameters")}
          </TabsTrigger>
          <TabsTrigger value="calculations" className="gap-2">
            <Calculator className="h-4 w-4" />
            {hook.t("kpi.tabs.calculations", "Calculations")}
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            {hook.t("kpi.tabs.categories", "Categories")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="space-y-6">
          <ParametersTab
            hook={hook}
            onOpenCreateDialog={() => hook.setIsCreateParameterOpen(true)}
            onOpenImportLibraryDialog={() => hook.setIsImportFromLibraryOpen(true)}
          />
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6">
          <CalculationsTab
            parameters={hook.parameters}
            onEdit={hook.handleEditParameter}
            onCreateCalculation={() => {
              hook.setNewParameter({ ...hook.newParameter, type: "calculated" })
              hook.setIsCreateParameterOpen(true)
            }}
            t={hook.t}
          />
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <CategoriesTab
            groups={hook.groups}
            onEdit={hook.handleEditGroup}
            onDelete={(id) => hook.setDeleteGroupId(id)}
            onOpenCreateDialog={() => hook.setIsCreateGroupOpen(true)}
            onOpenImportDialog={() => {
              hook.fetchGlobalCategories()
              hook.setIsImportCategoriesOpen(true)
            }}
            t={hook.t}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateParameterDialog
        open={hook.isCreateParameterOpen} onOpenChange={hook.setIsCreateParameterOpen}
        newParameter={hook.newParameter} setNewParameter={hook.setNewParameter}
        categoryNames={hook.categoryNames} parameters={hook.parameters}
        onSubmit={hook.handleCreateParameter} t={hook.t}
      />
      <EditParameterDialog
        open={hook.isEditParameterOpen} onOpenChange={hook.setIsEditParameterOpen}
        newParameter={hook.newParameter} setNewParameter={hook.setNewParameter}
        categoryNames={hook.categoryNames} parameters={hook.parameters}
        onSubmit={hook.handleUpdateParameter} t={hook.t}
      />
      <CreateGroupDialog
        open={hook.isCreateGroupOpen} onOpenChange={hook.setIsCreateGroupOpen}
        newGroup={hook.newGroup} setNewGroup={hook.setNewGroup}
        onSubmit={hook.handleCreateGroup} t={hook.t}
      />
      <EditGroupDialog
        open={hook.isEditGroupOpen} onOpenChange={hook.setIsEditGroupOpen}
        newGroup={hook.newGroup} setNewGroup={hook.setNewGroup}
        onSubmit={hook.handleUpdateGroup} t={hook.t}
      />
      <DeleteParameterDialog
        open={!!hook.deleteParameterId} onClose={() => hook.setDeleteParameterId(null)}
        onConfirm={() => hook.deleteParameterId && hook.handleDeleteParameter(hook.deleteParameterId)} t={hook.t}
      />
      <DeleteGroupDialog
        open={!!hook.deleteGroupId} onClose={() => hook.setDeleteGroupId(null)}
        onConfirm={() => hook.deleteGroupId && hook.handleDeleteGroup(hook.deleteGroupId)} t={hook.t}
      />
      <DeleteGlobalTemplateDialog
        open={!!hook.deleteGlobalParameterId} onClose={() => hook.setDeleteGlobalParameterId(null)}
        onConfirm={async () => { if (hook.deleteGlobalParameterId) await hook.handleDeleteGlobalParameter(hook.deleteGlobalParameterId) }} t={hook.t}
      />
      <BrowseGlobalDialog
        open={hook.isBrowseGlobalOpen} onOpenChange={hook.setIsBrowseGlobalOpen}
        globalParameters={hook.globalParameters} usedTemplates={hook.usedTemplates}
        selectedTemplates={hook.selectedTemplates} setSelectedTemplates={hook.setSelectedTemplates}
        isLoading={hook.isLoadingGlobal} error={hook.globalError}
        onApply={hook.handleApplySelectedTemplates} t={hook.t}
      />
      <ImportCategoriesDialog
        open={hook.isImportCategoriesOpen} onOpenChange={hook.setIsImportCategoriesOpen}
        globalCategories={hook.globalCategories}
        selectedIds={hook.selectedCategoriesToImport} setSelectedIds={hook.setSelectedCategoriesToImport}
        isLoading={hook.isLoadingGlobalCategories} onImport={hook.handleImportCategories} t={hook.t}
      />
    </div>
  )
}

export default ParameterManagement
