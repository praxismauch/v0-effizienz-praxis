"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Eye, MapPin, Briefcase, Heart, User, Pencil } from "lucide-react"
import { ViewWunschpatientDialog } from "./view-wunschpatient-dialog"
import { useAuth } from "@/contexts/auth-context"
import { DeleteIconButton } from "@/components/delete-icon-button"
import { toast } from "sonner"
import { usePractice } from "@/contexts/practice-context"

interface WunschpatientProfile {
  id: string
  name: string
  age_range: string
  gender: string
  occupation: string
  family_status: string
  archetype: string
  health_concerns: string[]
  lifestyle_factors: string[]
  values: string[]
  expectations: string[]
  health_consciousness: string
  prevention_vs_acute: string
  communication_preference: string
  financial_willingness: string
  location_area: string
  transport_method: string
  services_interested: string[]
  persona_description: string
  marketing_strategy: string
  communication_tips: string
  service_recommendations: string[]
  ai_generated_image_url: string
  is_active: boolean
  created_at: string
}

interface WunschpatientCardProps {
  profile: WunschpatientProfile
  onDeleted: (id: string) => void
  onUpdated: () => void
  onViewProfile?: (profile: WunschpatientProfile) => void
}

const archetypeConfig: Record<string, { label: string; color: string }> = {
  prevention: { label: "Präventionsorientiert", color: "bg-green-500" },
  chronic: { label: "Chronischer Patient", color: "bg-blue-500" },
  performance: { label: "Leistungsorientiert", color: "bg-purple-500" },
  acute: { label: "Akut-Patient", color: "bg-orange-500" },
  relationship: { label: "Beziehungstyp", color: "bg-pink-500" },
}

export function WunschpatientCard({ profile, onDeleted, onUpdated, onViewProfile }: WunschpatientCardProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { user } = useAuth()
  const { currentPractice } = usePractice()
  const practiceId = user?.practice_id || currentPractice?.id

  const handleDelete = async () => {
    if (!profile.id) {
      console.error("Cannot delete: profile.id is missing")
      toast.error("Fehler: Profil-ID fehlt")
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/wunschpatient/${profile.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          practiceId: practiceId,
        }),
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        toast.success("Wunschpatient erfolgreich gelöscht")
        onDeleted(profile.id)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Delete failed:", errorData)
        toast.error(`Löschen fehlgeschlagen: ${errorData.error || "Unbekannter Fehler"}`)
      }
    } catch (error) {
      console.error("Error deleting profile:", error)
      toast.error("Fehler beim Löschen des Profils")
    } finally {
      setDeleting(false)
    }
  }

  const archetypeBadge = useMemo(() => {
    const config = archetypeConfig[profile.archetype] || { label: profile.archetype, color: "bg-gray-500" }
    return <Badge className={config.color}>{config.label}</Badge>
  }, [profile.archetype])

  const imageUrl = useMemo(() => {
    if (profile.ai_generated_image_url && !imageError) {
      return profile.ai_generated_image_url
    }
    const gender = profile.gender === "female" ? "Frau" : "Mann"
    const age = profile.age_range || "35-45"
    const occupation = profile.occupation || "Person"
    const query = `professionelles Portrait ${gender} ${age} Jahre ${occupation} freundlich lächelnd Arztpraxis Patient`
    return `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(query)}`
  }, [profile.ai_generated_image_url, profile.gender, profile.age_range, profile.occupation, imageError])

  const truncatedValues = useMemo(() => {
    if (profile.values && profile.values.length > 0) {
      return profile.values.slice(0, 2).join(", ")
    }
    return null
  }, [profile.values])

  const genderDisplay = profile.gender === "female" ? "weiblich" : "männlich"

  return (
    <>
      <Card
        className="overflow-hidden hover:shadow-lg transition-shadow group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={`Wunschpatient: ${profile.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              if (!imageError) {
                setImageError(true)
              }
            }}
          />

          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-primary"
              onClick={() => setViewDialogOpen(true)}
              title="Bearbeiten"
            >
              <Pencil className="h-5 w-5" />
            </Button>
            <DeleteIconButton
              onDelete={handleDelete}
              tooltip="Löschen"
              confirmTitle="Wunschpatient löschen?"
              confirmDescription={`Möchten Sie das Profil "${profile.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
              disabled={deleting}
              className="h-10 w-10 rounded-full bg-white/90 hover:bg-white"
            />
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{profile.name}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {archetypeBadge}
            {profile.is_active && <Badge variant="outline">Aktiv</Badge>}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              {profile.age_range} Jahre, {genderDisplay}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>{profile.occupation}</span>
          </div>

          {profile.location_area && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{profile.location_area}</span>
            </div>
          )}

          {truncatedValues && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="truncate">{truncatedValues}</span>
            </div>
          )}

          <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={() => onViewProfile ? onViewProfile(profile) : setViewDialogOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Vollständiges Profil
          </Button>
        </CardContent>
      </Card>

      {viewDialogOpen && (
        <ViewWunschpatientDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} profile={profile} />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wunschpatient löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Profil "{profile.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
