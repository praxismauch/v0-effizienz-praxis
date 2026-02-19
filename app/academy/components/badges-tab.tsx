"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Award,
  BookOpen,
  Lock,
  LogIn,
  UserPlus,
  Zap,
  Trophy,
  Flame,
  Target,
  Star,
  Users,
  GraduationCap,
  Medal,
  Crown,
  Sparkles,
  RotateCcw,
} from "lucide-react"

const RARITY_LABELS: Record<string, string> = {
  common: "Gewöhnlich",
  uncommon: "Ungewöhnlich",
  rare: "Selten",
  epic: "Episch",
  legendary: "Legendär",
}
import Link from "next/link"
import type { UserBadge } from "../types"

interface BadgesTabProps {
  isAuthenticated: boolean
  userBadges: UserBadge[]
  onSwitchTab: (tab: string) => void
}

function LoginPrompt({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-8 text-center border-dashed border-2">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button asChild>
            <Link href="/auth/login">
              <LogIn className="h-4 w-4 mr-2" />
              Anmelden
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/sign-up">
              <UserPlus className="h-4 w-4 mr-2" />
              Registrieren
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    award: Award,
    zap: Zap,
    trophy: Trophy,
    flame: Flame,
    target: Target,
    star: Star,
    users: Users,
    "graduation-cap": GraduationCap,
    medal: Medal,
    crown: Crown,
    sparkles: Sparkles,
  }
  return icons[iconName] || Award
}

export function BadgesTab({ isAuthenticated, userBadges, onSwitchTab }: BadgesTabProps) {
  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Anmelden für Abzeichen"
        description="Melden Sie sich an, um Abzeichen zu verdienen und Ihre Erfolge zu sammeln."
      />
    )
  }

  if (userBadges.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Award className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Noch keine Abzeichen</h3>
            <p className="text-muted-foreground mt-1">
              Schließen Sie Kurse ab und erreichen Sie Meilensteine, um Abzeichen zu verdienen!
            </p>
          </div>
          <Button onClick={() => onSwitchTab("courses")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Kurse entdecken
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {userBadges.map((userBadge) => {
        const IconComponent = getIconComponent(userBadge.badge?.icon_name || "award")
        return (
          <Card key={userBadge.id} className="group relative text-center p-6">
            <button
              className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
              title="Erneut anzeigen"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div
              className="h-16 w-16 rounded-full mx-auto flex items-center justify-center mb-4"
              style={{ backgroundColor: `${userBadge.badge?.color}20` }}
            >
              <IconComponent className="h-8 w-8" style={{ color: userBadge.badge?.color }} />
            </div>
            <h3 className="font-semibold">{userBadge.badge?.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{userBadge.badge?.description}</p>
            <Badge variant="outline" className="mt-3">
              {RARITY_LABELS[userBadge.badge?.rarity || "common"] || userBadge.badge?.rarity}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Verdient am {new Date(userBadge.earned_at).toLocaleDateString("de-DE")}
            </p>
          </Card>
        )
      })}
    </div>
  )
}
