"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Building2, ChevronDown, Plus, Settings, Shield, Check, ExternalLink } from "lucide-react"
import { CreatePracticeDialog } from "./create-practice-dialog"

export function PracticeSelector() {
  const { practices, currentPractice, setCurrentPractice, getAllPracticesForSuperAdmin } = usePractice()
  const { isSuperAdmin } = useUser()
  const router = useRouter()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const availablePractices = isSuperAdmin ? getAllPracticesForSuperAdmin() : practices

  const handleManageClick = () => {
    if (isSuperAdmin) {
      router.push("/super-admin")
    } else {
      router.push("/settings")
    }
  }

  const handlePracticeDetailsClick = (e: React.MouseEvent, practiceId: string) => {
    e.stopPropagation()
    router.push(`/practice/${practiceId}`)
  }

  const currentPracticeColor = currentPractice?.color || "#3B82F6"

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between gap-2 px-3 py-2 h-auto relative overflow-hidden"
            style={{
              borderLeft: `4px solid ${currentPracticeColor}`,
              backgroundColor: `${currentPracticeColor}15`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: currentPracticeColor }}
              >
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentPractice?.name || "Praxis auswählen"}
                </span>
                <span className="text-xs text-sidebar-foreground/60 truncate">
                  {isSuperAdmin
                    ? `Super Admin • ${availablePractices.length} ${availablePractices.length === 1 ? "Praxis" : "Praxen"}`
                    : currentPractice?.type || "Keine Praxis ausgewählt"}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-sidebar-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-72 z-[99999]"
          sideOffset={8}
          alignOffset={0}
          side="bottom"
          avoidCollisions={true}
        >
          <DropdownMenuLabel className="flex items-center gap-2">
            {isSuperAdmin && <Shield className="h-4 w-4" />}
            {isSuperAdmin ? "Alle Praxen" : "Ihre Praxen"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availablePractices.map((practice) => {
            const isCurrent = practice.id === currentPractice?.id
            const practiceColor = practice.color || "#3B82F6"
            return (
              <DropdownMenuItem
                key={practice.id}
                onClick={() => setCurrentPractice(practice)}
                className={`flex flex-col items-start gap-1 p-3 ${isCurrent ? "bg-primary/10" : ""}`}
                style={{
                  borderLeft: `4px solid ${practiceColor}`,
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: practiceColor }} />
                    {isCurrent && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                    <button
                      onClick={(e) => handlePracticeDetailsClick(e, practice.id)}
                      className={`${isCurrent ? "font-bold" : "font-medium"} hover:text-primary hover:underline text-left`}
                    >
                      {practice.name}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handlePracticeDetailsClick(e, practice.id)}
                      className="p-1 hover:bg-muted rounded-sm"
                      title="Praxis-Details anzeigen"
                    >
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </button>
                    {isSuperAdmin && !practice.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inaktiv
                      </Badge>
                    )}
                    {isCurrent && <Badge className="text-xs bg-primary text-primary-foreground">Aktuell</Badge>}
                  </div>
                </div>
                <div className="flex items-center justify-between w-full pl-5">
                  <span className="text-xs text-muted-foreground">{practice.type}</span>
                  {isSuperAdmin && (
                    <span className="text-xs text-muted-foreground">
                      {practice.memberCount} {practice.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          {currentPractice && (
            <DropdownMenuItem onClick={(e) => handlePracticeDetailsClick(e, currentPractice.id)}>
              <Building2 className="mr-2 h-4 w-4" />
              Praxis-Details anzeigen
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Praxis hinzufügen
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleManageClick}>
            <Settings className="mr-2 h-4 w-4" />
            {isSuperAdmin ? "Systemeinstellungen" : "Praxen verwalten"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePracticeDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </>
  )
}

export default PracticeSelector
