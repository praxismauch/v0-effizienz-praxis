"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, SortAsc, Download, Settings, Users, Shield, Clock, Mail, Grid3x3, List } from "lucide-react"

interface TeamMenuBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedRoles: string[]
  onRoleFilterChange: (roles: string[]) => void
  selectedTeams: string[]
  onTeamFilterChange: (teams: string[]) => void
  sortBy: string
  onSortChange: (sort: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  onExport: () => void
  onBulkAction: (action: string) => void
  teams: Array<{ id: string; name: string; color: string }>
  isAdmin: boolean
}

function TeamMenuBar({
  searchQuery,
  onSearchChange,
  selectedRoles,
  onRoleFilterChange,
  selectedTeams,
  onTeamFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onExport,
  onBulkAction,
  teams,
  isAdmin,
}: TeamMenuBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const roles = [
    { value: "admin", label: "Admin", icon: Shield },
    { value: "doctor", label: "Arzt", icon: Users },
    { value: "nurse", label: "MFA/Pflege", icon: Users },
    { value: "receptionist", label: "Empfang", icon: Users },
  ]

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "role", label: "Rolle" },
    { value: "lastActive", label: "Zuletzt aktiv" },
    { value: "joinDate", label: "Beitrittsdatum" },
  ]

  const handleRoleToggle = (role: string) => {
    const newRoles = selectedRoles.includes(role) ? selectedRoles.filter((r) => r !== role) : [...selectedRoles, role]
    onRoleFilterChange(newRoles)
  }

  const handleTeamToggle = (teamId: string) => {
    const newTeams = selectedTeams.includes(teamId)
      ? selectedTeams.filter((t) => t !== teamId)
      : [...selectedTeams, teamId]
    onTeamFilterChange(newTeams)
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Main Menu Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Teammitglieder suchen..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtern
                  {(selectedRoles.length > 0 || selectedTeams.length > 0) && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {selectedRoles.length + selectedTeams.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Nach Rolle filtern</DropdownMenuLabel>
                {roles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role.value}
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  >
                    <role.icon className="mr-2 h-4 w-4" />
                    {role.label}
                  </DropdownMenuCheckboxItem>
                ))}

                {teams.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Nach Team filtern</DropdownMenuLabel>
                    {teams.map((team) => (
                      <DropdownMenuCheckboxItem
                        key={team.id}
                        checked={selectedTeams.includes(team.id)}
                        onCheckedChange={() => handleTeamToggle(team.id)}
                      >
                        <Badge className={`mr-2 ${team.color} text-xs`}>{team.name}</Badge>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}

                {(selectedRoles.length > 0 || selectedTeams.length > 0) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        onRoleFilterChange([])
                        onTeamFilterChange([])
                      }}
                    >
                      Alle Filter löschen
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-40">
                <SortAsc className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Menu */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex border rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onViewModeChange("list")
                    }}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Listenansicht</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      onViewModeChange("grid")
                    }}
                    className="rounded-l-none"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rasteransicht</TooltipContent>
              </Tooltip>
            </div>

            {/* Export Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Team-Daten exportieren</TooltipContent>
            </Tooltip>

            {/* Actions Menu */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Aktionen
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Team-Aktionen</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Team-Daten exportieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction("sync")}>
                    <Clock className="mr-2 h-4 w-4" />
                    Aktivitätsstatus synchronisieren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onBulkAction("resend-invites")}>
                    <Mail className="mr-2 h-4 w-4" />
                    Ausstehende Einladungen erneut senden
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onBulkAction("archive-inactive")}>
                    Inaktive Mitglieder archivieren
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedRoles.length > 0 || selectedTeams.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Aktive Filter:</span>
            {selectedRoles.map((role) => (
              <Badge key={role} variant="secondary" className="gap-1">
                {role}
                <button
                  onClick={() => handleRoleToggle(role)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            ))}
            {selectedTeams.map((teamId) => {
              const team = teams.find((t) => t.id === teamId)
              return team ? (
                <Badge key={teamId} className={`gap-1 ${team.color}`}>
                  {team.name}
                  <button
                    onClick={() => handleTeamToggle(teamId)}
                    className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              ) : null
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default TeamMenuBar
