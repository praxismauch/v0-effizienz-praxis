"use client"

import { Search, Filter, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TeamMember {
  id: string
  first_name: string
  last_name: string
}

interface ResponsibilityFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  teamMemberFilter: string
  onTeamMemberFilterChange: (value: string) => void
  categoryFilter: string
  onCategoryFilterChange: (value: string) => void
  teamMembers: TeamMember[]
  categories: string[]
}

export function ResponsibilityFilters({
  searchTerm,
  onSearchChange,
  teamMemberFilter,
  onTeamMemberFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  teamMembers,
  categories,
}: ResponsibilityFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4 flex-1 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Namen oder Beschreibung..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Team Member Filter Dropdown */}
        <Select value={teamMemberFilter} onValueChange={onTeamMemberFilterChange}>
          <SelectTrigger className="w-[200px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Alle Mitarbeiter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Mitarbeiter</SelectItem>
            <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.first_name} {member.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter Dropdown */}
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
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
  )
}
