"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Search, ChevronRight, Loader2, User } from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import type { TeamMember } from "../types"
import { getRoleLabel } from "@/lib/roles"

interface MemberSelectionProps {
  teamMembers: TeamMember[]
  loadingMembers: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectMember: (member: TeamMember) => void
  onBack: () => void
}

export function MemberSelection({
  teamMembers,
  loadingMembers,
  searchQuery,
  onSearchChange,
  onSelectMember,
  onBack,
}: MemberSelectionProps) {
  // Ensure teamMembers is always an array
  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : []
  
  const filteredMembers = safeTeamMembers.filter(
    (member) =>
      member && (
        member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Neues Mitarbeitergespräch</h1>
              <p className="text-muted-foreground">Wählen Sie einen Mitarbeiter für das Gespräch aus</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Mitarbeiter suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Team Members Grid */}
        {loadingMembers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchQuery ? "Keine Mitarbeiter gefunden" : "Keine Teammitglieder vorhanden"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Versuchen Sie einen anderen Suchbegriff" : "Fügen Sie zuerst Teammitglieder hinzu"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembers.map((member) => (
              <Card
                key={member.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group"
                onClick={() => onSelectMember(member)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-muted group-hover:border-primary/30 transition-colors">
                      <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg font-medium bg-primary/10 text-primary">
                        {member.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base truncate">{member.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{getRoleLabel(member.role)}</p>
                      {member.department && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {member.department}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
