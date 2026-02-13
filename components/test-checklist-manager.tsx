"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Play, CheckCircle2, Sparkles, Loader2, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Navigation, LayoutGrid, ChevronDown, FileText, CheckCircle } from "lucide-react"
import type { ChecklistTemplate } from "./test-checklist/types"
import { useChecklistData } from "./test-checklist/use-checklist-data"
import { TemplateDialog } from "./test-checklist/template-dialog"
import { ChecklistExecutionDialog } from "./test-checklist/checklist-execution-dialog"
import { AiSuggestionsDialog } from "./test-checklist/ai-suggestions-dialog"

function TestChecklistManager() {
  const [activeTab, setActiveTab] = useState<"templates" | "checklists">("templates")
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null)
  const [templateFormData, setTemplateFormData] = useState({ title: "", description: "", category_id: "" })
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false)
  const [isAiSuggesting, setIsAiSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")
  const [showPromptInput, setShowPromptInput] = useState(false)
  const [isGeneratingSidebar, setIsGeneratingSidebar] = useState(false)

  const {
    categories,
    templates,
    checklists,
    isLoading,
    checklistItems,
    loadChecklistItems,
    setSelectedChecklist,
    handleSubmitTemplate,
    handleDeleteTemplate,
    handleGenerateChecklist,
    handleToggleItem,
    handleUpdateNotes,
    handleGenerateSidebarTemplates,
    handleAiSuggestItems,
    handleAddAiSuggestions,
  } = useChecklistData()

  const resetTemplateForm = () => {
    setEditingTemplate(null)
    setTemplateFormData({ title: "", description: "", category_id: "" })
  }

  const onSubmitTemplate = async () => {
    const success = await handleSubmitTemplate(templateFormData, editingTemplate?.id)
    if (success) {
      setIsTemplateDialogOpen(false)
      resetTemplateForm()
    }
  }

  const openEditTemplate = (template: ChecklistTemplate) => {
    setEditingTemplate(template)
    setTemplateFormData({
      title: template.title,
      description: template.description || "",
      category_id: template.category_id || "",
    })
    setIsTemplateDialogOpen(true)
  }

  const openChecklist = (checklistId: string) => {
    setSelectedChecklist(checklistId)
    loadChecklistItems(checklistId)
    setIsChecklistDialogOpen(true)
  }

  const onGenerateChecklist = async () => {
    const id = await handleGenerateChecklist()
    if (id) setIsChecklistDialogOpen(true)
  }

  const onGenerateSidebar = async (includeAdminOnly: boolean) => {
    setIsGeneratingSidebar(true)
    await handleGenerateSidebarTemplates(includeAdminOnly)
    setIsGeneratingSidebar(false)
  }

  const onAiSuggest = async () => {
    setIsAiSuggesting(true)
    const suggestions = await handleAiSuggestItems(customPrompt)
    if (suggestions) {
      setAiSuggestions(suggestions)
      setIsAiDialogOpen(true)
      setShowPromptInput(false)
      setCustomPrompt("")
    }
    setIsAiSuggesting(false)
  }

  if (isLoading) {
    return <div className="text-center py-8">Laden...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "templates" | "checklists")}>
        <div className="flex items-center justify-between mb-4 gap-4">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Vorlagen
            </TabsTrigger>
            <TabsTrigger value="checklists" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Checklisten
            </TabsTrigger>
          </TabsList>

          {activeTab === "templates" && (
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent" disabled={isGeneratingSidebar}>
                    <LayoutGrid className="h-4 w-4" />
                    Vorlage generieren
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => onGenerateSidebar(true)} className="gap-2">
                    <Navigation className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Sidebar-Navigation (Alle)</span>
                      <span className="text-xs text-muted-foreground">Inkl. Admin-Menüpunkte</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateSidebar(false)} className="gap-2">
                    <Navigation className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Sidebar-Navigation (Standard)</span>
                      <span className="text-xs text-muted-foreground">Ohne Admin-Menüpunkte</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAiDialogOpen(true)} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>KI-Vorschläge</span>
                      <span className="text-xs text-muted-foreground">Intelligente Testvorschläge</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => {
                  resetTemplateForm()
                  setIsTemplateDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Neue Vorlage
              </Button>
            </div>
          )}

          {activeTab === "checklists" && (
            <Button onClick={onGenerateChecklist} className="gap-2">
              <Play className="h-4 w-4" />
              Neue Checkliste generieren
            </Button>
          )}
        </div>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {templates.length} Vorlage{templates.length !== 1 ? "n" : ""}
            </p>
            <div className="flex gap-2">
              <div className="relative">
                {!showPromptInput ? (
                  <Button
                    onClick={() => setShowPromptInput(true)}
                    disabled={isAiSuggesting}
                    className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isAiSuggesting ? "KI arbeitet..." : "KI-Vorschläge"}
                  </Button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Was soll die KI vorschlagen? (Optional)"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-[300px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onAiSuggest()
                        else if (e.key === "Escape") {
                          setShowPromptInput(false)
                          setCustomPrompt("")
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={onAiSuggest}
                      disabled={isAiSuggesting}
                      className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg"
                    >
                      {isAiSuggesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generiere...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generieren
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowPromptInput(false)
                        setCustomPrompt("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {templates.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{template.title}</h4>
                      {template.testing_categories && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${template.testing_categories.color}20`,
                            color: template.testing_categories.color,
                            borderColor: template.testing_categories.color,
                          }}
                        >
                          {template.testing_categories.name}
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditTemplate(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {checklists.length} Checkliste{checklists.length !== 1 ? "n" : ""}
            </p>
            <Button onClick={onGenerateChecklist}>
              <Play className="h-4 w-4 mr-2" />
              Neue Checkliste generieren
            </Button>
          </div>

          {checklists.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <p>Noch keine Checklisten vorhanden.</p>
              <p className="text-xs mt-1">
                Klicken Sie auf &quot;Neue Checkliste generieren&quot;, um eine Checkliste aus Ihren Vorlagen zu erstellen.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {checklists.map((checklist) => (
                <Card
                  key={checklist.id}
                  className="p-4 cursor-pointer hover:bg-accent"
                  onClick={() => openChecklist(checklist.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{checklist.title}</h4>
                        {checklist.status === "completed" ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Abgeschlossen
                          </Badge>
                        ) : checklist.status === "in_progress" ? (
                          <Badge variant="secondary">In Bearbeitung</Badge>
                        ) : (
                          <Badge variant="outline">Offen</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Erstellt: {new Date(checklist.created_at).toLocaleDateString("de-DE")}</span>
                        {checklist.total_items > 0 && (
                          <span>
                            {checklist.completed_items}/{checklist.total_items} Items ({checklist.progress}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TemplateDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        formData={templateFormData}
        onFormDataChange={setTemplateFormData}
        categories={categories}
        isEditing={!!editingTemplate}
        onSubmit={onSubmitTemplate}
        onCancel={() => {
          setIsTemplateDialogOpen(false)
          resetTemplateForm()
        }}
      />

      <ChecklistExecutionDialog
        open={isChecklistDialogOpen}
        onOpenChange={setIsChecklistDialogOpen}
        items={checklistItems}
        onToggleItem={handleToggleItem}
        onUpdateNotes={handleUpdateNotes}
      />

      {aiSuggestions.length > 0 && (
        <AiSuggestionsDialog
          open={isAiDialogOpen}
          onOpenChange={setIsAiDialogOpen}
          suggestions={aiSuggestions}
          categories={categories}
          onAddSuggestions={handleAddAiSuggestions}
        />
      )}
    </div>
  )
}

export default TestChecklistManager
