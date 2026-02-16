"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { useTeam } from "@/contexts/team-context"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import { ContractsManager } from "@/components/team/contracts-manager"
import { TeamMemberVaccinationTab } from "@/components/team/team-member-vaccination-tab"
import { TeamMemberDocumentsTab } from "@/components/team/team-member-documents-tab"
import { ArrowLeft, Trash2, Syringe, FileText, Package } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import AppLayout from "@/components/app-layout"
import ArbeitsmittelAssignments from "@/components/team/arbeitsmittel-assignments"
import { useSWRConfig } from "swr"
import { SWR_KEYS } from "@/lib/swr-keys"
import { ProfileTab } from "./profile-tab"
import { PermissionsTab } from "./permissions-tab"
import type { TeamEditFormData } from "./constants"

interface EditTeamMemberPageProps {
  initialMember: any
  teams: any[]
  allTeamMembers: any[]
  practiceId: string
  currentUser: any
}

export default function EditTeamMemberPage({ initialMember }: EditTeamMemberPageProps) {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const { teamMembers, teams, updateTeamMember, removeTeamMember, assignMemberToTeam, removeMemberFromTeam, practiceId } =
    useTeam()
  const { currentUser, isAdmin, isSuperAdmin } = useUser()
  const { mutate } = useSWRConfig()

  const [formData, setFormData] = useState<TeamEditFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    permissions: [],
    teamIds: [],
    avatar: "",
    status: "active",
    dateOfBirth: "",
  })

  const [activeTab, setActiveTab] = useState("profile")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const member = initialMember || teamMembers.find((m) => m.id === memberId)

  if (!member) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Teammitglied nicht gefunden</h2>
            <p className="text-muted-foreground mb-4">Das gesuchte Teammitglied existiert nicht oder wurde geloscht.</p>
            <Button onClick={() => router.push("/team")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zuruck zum Team
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const canEditRole = isAdmin && member.role !== "admin"
  const canEditPermissions = isAdmin
  const canEditTeams = isAdmin
  const canDeleteMember = (isAdmin || isSuperAdmin) && currentUser?.id !== memberId

  useEffect(() => {
    if (member) {
      let firstName = member.first_name || ""
      let lastName = member.last_name || ""
      if (!firstName && !lastName && member.name) {
        const nameParts = member.name.split(" ")
        firstName = nameParts[0] || ""
        lastName = nameParts.slice(1).join(" ") || ""
      }
      setFormData({
        firstName,
        lastName,
        email: member.email || "",
        role: member.role || "user",
        permissions: member.permissions || [],
        teamIds: member.teamIds || [],
        avatar: member.avatar || "",
        status: member.isActive ? "active" : "inactive",
        dateOfBirth: member.date_of_birth || member.dateOfBirth || "",
      })
    }
  }, [member])

  const handleSave = async () => {
    if (!member) return
    setIsSubmitting(true)
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      await updateTeamMember(memberId, {
        name: fullName,
        email: formData.email,
        role: canEditRole ? formData.role : member.role,
        permissions: canEditPermissions ? formData.permissions : member.permissions,
        avatar: formData.avatar,
        isActive: formData.status === "active",
        date_of_birth: formData.dateOfBirth || null,
      })

      if (canEditTeams && member) {
        const currentTeamIds = member.teamIds || []
        const newTeamIds = formData.teamIds
        currentTeamIds.forEach((teamId: string) => {
          if (!newTeamIds.includes(teamId)) removeMemberFromTeam(memberId, teamId)
        })
        newTeamIds.forEach((teamId: string) => {
          if (!currentTeamIds.includes(teamId)) assignMemberToTeam(memberId, teamId)
        })
      }

      await mutate(SWR_KEYS.teamMembers(practiceId))
      toast.success("Anderungen gespeichert", {
        description: "Die Anderungen wurden erfolgreich gespeichert.",
      })
      router.refresh()
      router.push(`/team/${memberId}`)
    } catch (error) {
      console.error("Error updating team member profile:", error)
      toast.error("Fehler", {
        description: error instanceof Error ? error.message : "Die Anderungen konnten nicht gespeichert werden.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (!canEditPermissions) return
    let newPermissions = [...formData.permissions]
    if (permissionId === "all") {
      newPermissions = checked ? ["all"] : []
    } else {
      if (checked) {
        newPermissions = newPermissions.filter((p) => p !== "all")
        if (!newPermissions.includes(permissionId)) newPermissions.push(permissionId)
      } else {
        newPermissions = newPermissions.filter((p) => p !== permissionId)
      }
    }
    setFormData((prev) => ({ ...prev, permissions: newPermissions }))
  }

  const handleTeamChange = (teamId: string, checked: boolean) => {
    if (!canEditTeams) return
    let newTeamIds = [...formData.teamIds]
    if (checked) {
      if (!newTeamIds.includes(teamId)) newTeamIds.push(teamId)
    } else {
      newTeamIds = newTeamIds.filter((id) => id !== teamId)
    }
    setFormData((prev) => ({ ...prev, teamIds: newTeamIds }))
  }

  const handleDeleteMember = async () => {
    if (!member) return
    const effectivePracticeId = practiceId || "1"
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/practices/${effectivePracticeId}/team-members/${memberId}`, {
        method: "DELETE",
      })
      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.error || "Fehler beim Loschen")
      removeTeamMember(memberId)
      toast.success(`${member.name || `${formData.firstName} ${formData.lastName}`} wurde deaktiviert`)
      router.push("/team")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Loschen des Teammitglieds")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/team")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Team
          </Button>
          <div className="flex gap-2">
            {canDeleteMember && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Wird geloscht..." : "Mitglied loschen"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Teammitglied loschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {"Sind Sie sicher, dass Sie "}
                      <span className="font-semibold">
                        {formData.firstName} {formData.lastName}
                      </span>
                      {" loschen mochten? Das Mitglied wird deaktiviert und kann sich nicht mehr anmelden."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteMember()
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Wird geloscht..." : "Loschen"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" onClick={() => router.push("/team")}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Wird gespeichert..." : "Anderungen speichern"}
            </Button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {formData.avatar && <AvatarImage src={formData.avatar} alt={`${formData.firstName} ${formData.lastName}`} />}
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold">
              {formData.firstName?.[0]?.toUpperCase() || ""}
              {formData.lastName?.[0]?.toUpperCase() || ""}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">
              {formData.firstName} {formData.lastName}
            </h1>
            <p className="text-muted-foreground">Profil bearbeiten</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            {canEditPermissions && <TabsTrigger value="permissions">Berechtigungen</TabsTrigger>}
            <TabsTrigger value="contracts">Vertrage</TabsTrigger>
            <TabsTrigger value="documents" className="gap-1">
              <FileText className="h-3 w-3" />
              Dokumente
            </TabsTrigger>
            <TabsTrigger value="arbeitsmittel">Arbeitsmittel</TabsTrigger>
            <TabsTrigger value="vaccinations" className="gap-1">
              <Syringe className="h-3 w-3" />
              Impfstatus
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileTab
              formData={formData}
              setFormData={setFormData}
              member={member}
              teams={teams}
              canEditRole={canEditRole}
              canEditTeams={canEditTeams}
              onTeamChange={handleTeamChange}
            />
          </TabsContent>

          {canEditPermissions && (
            <TabsContent value="permissions" className="space-y-4">
              <PermissionsTab formData={formData} onPermissionChange={handlePermissionChange} />
            </TabsContent>
          )}

          <TabsContent value="contracts" className="space-y-4">
            {member ? (
              <ContractsManager memberId={memberId} memberName={member.name} practiceId={member.practice_id || ""} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="arbeitsmittel" className="space-y-4">
            {member ? (
              <ArbeitsmittelAssignments teamMemberId={memberId} practiceId={member.practice_id || ""} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vaccinations" className="space-y-4">
            {member ? (
              <TeamMemberVaccinationTab teamMemberId={memberId} practiceId={Number(member.practice_id) || 1} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Syringe className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {member ? (
              <TeamMemberDocumentsTab
                teamMemberId={memberId}
                practiceId={member.practice_id || "1"}
                isAdmin={isAdmin}
                currentUserId={currentUser?.id}
                memberUserId={member.user_id}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Mitarbeiterdaten werden geladen...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
