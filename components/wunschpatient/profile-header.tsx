"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Briefcase, CheckCircle, X, ArrowLeft } from "lucide-react"
import { getArchetypeLabel, getArchetypeColor } from "./wunschpatient-labels"

interface ProfileHeaderProps {
  profile: {
    name: string
    age_range: string
    gender: string
    occupation: string
    archetype: string
    ai_generated_image_url: string
    is_active: boolean
  }
  onClose?: () => void
  onBack?: () => void
}

export function ProfileHeader({ profile, onClose, onBack }: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false)

  const placeholderQuery = encodeURIComponent(
    `professionelles Portrait ${profile.gender === "female" ? "Frau" : profile.gender === "diverse" || profile.gender === "any" ? "Person" : "Mann"} ${profile.age_range} Jahre ${profile.occupation || "Person"} freundlich lächelnd Fotostudio`,
  )

  const imageUrl = imageError
    ? `/placeholder.svg?height=400&width=400&query=${placeholderQuery}`
    : profile.ai_generated_image_url || `/placeholder.svg?height=400&width=400&query=${placeholderQuery}`

  return (
    <div
      className={`relative ${getArchetypeColor(profile.archetype)} bg-gradient-to-br from-primary/90 to-primary`}
    >
      {onBack ? (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 text-white hover:bg-white/20 z-10 gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Button>
      ) : onClose ? (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      ) : null}

      <div className={`px-8 pb-8 flex items-end gap-6 ${onBack ? "pt-16" : "pt-8"}`}>
        <div className="relative -mb-16 z-10">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-background">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={profile.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
          {profile.is_active && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 pb-2">
          <h2 className="text-3xl font-bold text-white mb-2">{profile.name}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {getArchetypeLabel(profile.archetype)}
            </Badge>
            <span className="text-white/80 text-sm flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {profile.age_range} Jahre, {profile.gender === "female" ? "weiblich" : profile.gender === "diverse" ? "divers" : profile.gender === "any" ? "beliebig" : "männlich"}
            </span>
            {profile.occupation && (
              <span className="text-white/80 text-sm flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {profile.occupation}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
