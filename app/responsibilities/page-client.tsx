"use client"

import {
  Plus,
  Sparkles,
  Search,
  Filter,
  Users,
  UsersRound,
  AlertCircle,
  Clock,
  User,
  Loader2,
  UserCheck,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import ResponsibilityFormDialog from "@/components/responsibility-form-dialog"
import { AIResponsibilityGeneratorDialog } from "@/components/responsibilities/ai-responsibility-generator-dialog"
import { CreateTodoFromResponsibilityDialog } from "@/components/create-todo-from-responsibility-dialog"
import { useTeam } from "@/contexts/team-context"
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
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { formatGermanNumber } from "@/lib/utils/number-format"

// Import refactored components and hook
import { useResponsibilities } from "./hooks/use-responsibilities"
import { ResponsibilityCard } from "./components/responsibility-card"
import { getCategoryColor } from "./types"

export default function ResponsibilitiesPageClient() {
  const {
    loading,
    error,
    formDialogOpen,
    setFormDialogOpen,
    aiDialogOpen,
    setAiDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    deleting,
    selectedResponsibility,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    teamMemberFilter,
    setTeamMemberFilter,
    teamGroupFilter,
    setTeamGroupFilter,
    createTodoDialogOpen,
    setCreateTodoDialogOpen,
    responsibilityForTodo,
    setResponsibilityForTodo,
    formData,
    setFormData,
    hoursDisplayValue,
    setHoursDisplayValue,
    filteredResponsibilities,
    groupedResponsibilities,
    categories,
    stats,
    totalHours,
    fetchResponsibilities,
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleDelete,
    handleSave,
    handleCreateTodo,
  } = useResponsibilities()

  const { teamMembers, teams } = useTeam()

  // Helper function to get the primary team color for a team member
  const getMemberTeamColor = (member: { teamIds?: string[] }) => {
    if (!member.teamIds || member.teamIds.length === 0) return null
    const primaryTeam = teams.find((t) => member.teamIds?.includes(t.id))
    return primaryTeam?.color || null
  }

  // Get the currently selected team member and their color
  const selectedMember = teamMembers.find((m) => m.id === teamMemberFilter)
  const selectedMemberColor = selectedMember ? getMemberTeamColor(selectedMember) : null

  const handlePrint = () => {
    window.print()
  }

  const getCategoryHours = (items: { suggested_hours_per_week?: number }[]) => {
    return items.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)
  }

  return (
    <AppLayout loading={loading} loadingMessage="Zuständigkeiten werden geladen...">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Zustaendigkeiten"
          subtitle="Verwalten Sie Aufgaben und Verantwortlichkeiten"
          actions={
            <>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Drucken
              </Button>
              <Button
                onClick={() => setAiDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
              >
                <Sparkles className="h-4 w-4" />
                Mit KI generieren
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Zustaendigkeit
              </Button>
            </>
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Gesamt" value={stats.total} icon={Users} {...statCardColors.primary} />
          <StatCard label="Zugewiesen" value={stats.assigned} icon={UserCheck} {...statCardColors.success} />
          <StatCard label="Offen" value={stats.unassigned} icon={AlertCircle} {...statCardColors.warning} />
          <StatCard
            label="Stunden/Woche"
            value={formatGermanNumber(stats.totalHours)}
            icon={Clock}
            {...statCardColors.info}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Namen oder Beschreibung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={teamMemberFilter} onValueChange={setTeamMemberFilter}>
              <SelectTrigger 
                className="w-[220px] transition-all duration-200"
                style={{
                  borderColor: selectedMemberColor || undefined,
                  backgroundColor: selectedMemberColor ? `${selectedMemberColor}15` : undefined,
                }}
              >
                {selectedMemberColor && (
                  <div 
                    className="h-3 w-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: selectedMemberColor }}
                  />
                )}
                {!selectedMemberColor && <User className="h-4 w-4 mr-2 flex-shrink-0" />}
                <SelectValue placeholder="Alle Mitarbeiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Alle Mitarbeiter</span>
                  </div>
                </SelectItem>
                <SelectItem value="unassigned">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted border border-dashed border-muted-foreground/50" />
                    <span>Nicht zugewiesen</span>
                  </div>
                </SelectItem>
                {teamMembers.map((member) => {
                  const memberId = member.user_id || member.id || member.team_member_id
                  if (!memberId) return null
                  const memberColor = getMemberTeamColor(member)
                  return (
                    <SelectItem key={memberId} value={memberId}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full flex-shrink-0" 
                          style={{ 
                            backgroundColor: memberColor || '#9CA3AF',
                            border: memberColor ? 'none' : '1px solid #D1D5DB'
                          }}
                        />
                        <span>{member.first_name} {member.last_name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Select value={teamGroupFilter} onValueChange={setTeamGroupFilter}>
              <SelectTrigger 
                className="w-[200px] transition-all duration-200"
                style={{
                  borderColor: teamGroupFilter !== "all" ? teams.find(t => t.id === teamGroupFilter)?.color : undefined,
                  backgroundColor: teamGroupFilter !== "all" ? `${teams.find(t => t.id === teamGroupFilter)?.color}15` : undefined,
                }}
              >
                {teamGroupFilter !== "all" && teams.find(t => t.id === teamGroupFilter)?.color ? (
                  <div 
                    className="h-3 w-3 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: teams.find(t => t.id === teamGroupFilter)?.color }}
                  />
                ) : (
                  <UsersRound className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <SelectValue placeholder="Alle Gruppen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-muted-foreground" />
                    <span>Alle Gruppen</span>
                  </div>
                </SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: team.color || '#9CA3AF' }}
                      />
                      <span>{team.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
              <Button onClick={fetchResponsibilities} variant="outline" className="mt-4 bg-transparent">
                Erneut versuchen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredResponsibilities.length === 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-4">
              <Users className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="font-semibold">Keine Zuständigkeiten gefunden</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || categoryFilter !== "all" || teamMemberFilter !== "all" || teamGroupFilter !== "all"
                    ? "Versuchen Sie andere Filteroptionen"
                    : "Erstellen Sie Ihre erste Zuständigkeit oder nutzen Sie die KI-Vorschläge"}
                </p>
              </div>
              {!searchTerm && categoryFilter === "all" && teamMemberFilter === "all" && teamGroupFilter === "all" && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setAiDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
                  >
                    <Sparkles className="h-4 w-4" />
                    KI-Vorschläge
                  </Button>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Responsibilities Grid */}
        {!loading && !error && Object.keys(groupedResponsibilities).length > 0 && (
          <div className="bg-muted/50 rounded-xl p-6 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="py-4 px-6">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Gesamt Zeitbedarf aller Zuständigkeiten</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">{formatGermanNumber(totalHours)}h</span>
                    <span className="text-sm text-muted-foreground ml-2">pro Woche</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.entries(groupedResponsibilities).map(([groupName, items]) => (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(groupName)}`} />
                    <h3 className="font-semibold text-lg">{groupName}</h3>
                    <span className="text-muted-foreground">({items.length})</span>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Gesamt: {formatGermanNumber(getCategoryHours(items))} Std./Woche
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((responsibility) => (
                    <ResponsibilityCard
                      key={responsibility.id}
                      responsibility={responsibility}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                      onCreateTodo={handleCreateTodo}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <ResponsibilityFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          formData={formData}
          setFormData={setFormData}
          hoursDisplayValue={hoursDisplayValue}
          setHoursDisplayValue={setHoursDisplayValue}
          onSave={handleSave}
          editing={!!selectedResponsibility}
        />

        <AIResponsibilityGeneratorDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          onResponsibilitiesGenerated={fetchResponsibilities}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Zuständigkeit löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie die Zuständigkeit &quot;{selectedResponsibility?.name}&quot; wirklich löschen? Diese Aktion
                kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Löschen...
                  </>
                ) : (
                  "Löschen"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {responsibilityForTodo && (
          <CreateTodoFromResponsibilityDialog
            open={createTodoDialogOpen}
            onOpenChange={setCreateTodoDialogOpen}
            responsibility={responsibilityForTodo}
            onSuccess={() => {
              setCreateTodoDialogOpen(false)
              setResponsibilityForTodo(null)
            }}
          />
        )}
      </div>
    </AppLayout>
  )
}
