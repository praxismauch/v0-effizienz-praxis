"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Trophy, LogIn, UserPlus, GraduationCap, Award } from "lucide-react"
import Link from "next/link"
import type { UserStats } from "../types"

interface AcademyHeaderProps {
  isAuthenticated: boolean
  displayStats: UserStats
}

export function AcademyHeader({ isAuthenticated, displayStats }: AcademyHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Effizienz-Academy</h1>
          <p className="text-muted-foreground">Weiterbildung für Ihr Praxisteam</p>
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-lg">
              <Flame className="h-5 w-5" />
              <span className="font-semibold">{displayStats.current_streak_days} Tage Streak</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-lg">
              <Trophy className="h-5 w-5" />
              <span className="font-semibold">Level {displayStats.current_level}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/auth/login">
                <LogIn className="h-4 w-4 mr-2" />
                Anmelden
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/sign-up">
                <UserPlus className="h-4 w-4 mr-2" />
                Kostenlos registrieren
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Public CTA Banner */}
      {!isAuthenticated && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Starten Sie Ihre Lernreise</h3>
                  <p className="text-muted-foreground">
                    Registrieren Sie sich kostenlos, um Fortschritte zu speichern, Abzeichen zu verdienen und auf der
                    Rangliste zu erscheinen.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span>XP sammeln</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-500" />
                  <span>Abzeichen verdienen</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span>Streak aufbauen</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
