"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Play, Lock, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"
import type { Enrollment } from "../types"

interface MyLearningTabProps {
  isAuthenticated: boolean
  enrollments: Enrollment[]
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

export function MyLearningTab({ isAuthenticated, enrollments, onSwitchTab }: MyLearningTabProps) {
  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Anmelden für Lernfortschritt"
        description="Melden Sie sich an, um Ihre eingeschriebenen Kurse zu sehen und Ihren Fortschritt zu verfolgen."
      />
    )
  }

  if (enrollments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Noch keine Kurse begonnen</h3>
            <p className="text-muted-foreground mt-1">
              Starten Sie Ihren ersten Kurs und beginnen Sie Ihre Lernreise!
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
    <div className="grid gap-4">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <img
                src={enrollment.course?.thumbnail_url || "/placeholder.svg?height=80&width=120&query=course"}
                alt={enrollment.course?.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{enrollment.course?.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Zuletzt gelernt:{" "}
                  {enrollment.last_accessed_at
                    ? new Date(enrollment.last_accessed_at).toLocaleDateString("de-DE")
                    : "Noch nicht gestartet"}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fortschritt</span>
                    <span>{enrollment.progress_percentage}%</span>
                  </div>
                  <Progress value={enrollment.progress_percentage} className="h-2" />
                </div>
              </div>
              <Button asChild>
                <Link href={`/academy/courses/${enrollment.course_id}`}>
                  <Play className="h-4 w-4 mr-2" />
                  Fortsetzen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
