"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Crown, Medal, Lock, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"
import type { LeaderboardEntry } from "../types"

interface LeaderboardTabProps {
  isAuthenticated: boolean
  leaderboard: LeaderboardEntry[]
  currentUserId?: string
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

export function LeaderboardTab({ isAuthenticated, leaderboard, currentUserId }: LeaderboardTabProps) {
  if (!isAuthenticated) {
    return (
      <LoginPrompt
        title="Anmelden für Rangliste"
        description="Melden Sie sich an, um Ihre Platzierung in der Rangliste zu sehen und mit anderen zu konkurrieren."
      />
    )
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Trophy className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Rangliste noch leer</h3>
            <p className="text-muted-foreground mt-1">
              Seien Sie der Erste, der Kurse abschließt und XP sammelt!
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Praxis-Rangliste
        </CardTitle>
        <CardDescription>Top-Lernende in Ihrer Praxis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                entry.user_id === currentUserId ? "bg-primary/5 border border-primary/20" : "bg-muted/50"
              }`}
            >
              <div className="w-8 text-center font-bold">
                {index === 0 ? (
                  <Crown className="h-6 w-6 text-amber-500 mx-auto" />
                ) : index === 1 ? (
                  <Medal className="h-6 w-6 text-gray-400 mx-auto" />
                ) : index === 2 ? (
                  <Medal className="h-6 w-6 text-amber-700 mx-auto" />
                ) : (
                  <span className="text-muted-foreground">{entry.rank}</span>
                )}
              </div>
              <Avatar>
                <AvatarImage src={entry.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>{entry.user_name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {entry.user_name}
                  {entry.user_id === currentUserId && (
                    <Badge variant="outline" className="ml-2">
                      Sie
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{entry.courses_completed} Kurse abgeschlossen</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{entry.xp_earned.toLocaleString()} XP</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
