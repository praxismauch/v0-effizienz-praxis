"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GraduationCap, Sparkles, Trophy, Target, Rocket, Brain, Mail, CheckCircle2 } from "lucide-react"
import { useState } from "react"

export function AcademyComingSoon() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/academy-waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ein Fehler ist aufgetreten")
      }

      setSubscribed(true)
      setEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-purple-50/50 to-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Bald verfügbar</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              Willkommen in der{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Effizienz-Academy
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Lernen Sie Schritt für Schritt, wie Sie Ihre Praxis effizienter gestalten, Ihr Team besser führen und mehr
              Zeit für das Wesentliche gewinnen.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 space-y-3 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Strukturierte Kurse</h3>
              <p className="text-sm text-muted-foreground">
                Professionell aufbereitete Inhalte mit praktischen Übungen und direkt anwendbarem Wissen
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">KI-gestützt</h3>
              <p className="text-sm text-muted-foreground">
                Intelligente Lernempfehlungen und personalisierte Lernpfade basierend auf Ihren Bedürfnissen
              </p>
            </Card>

            <Card className="p-6 space-y-3 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-lg">Gamification</h3>
              <p className="text-sm text-muted-foreground">
                Sammeln Sie XP-Punkte, schalten Sie Achievements frei und verfolgen Sie Ihren Fortschritt
              </p>
            </Card>
          </div>

          {/* Coming Soon Table */}
          <Card className="mt-16 p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-3">
                <Rocket className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">In Vorbereitung</h2>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                {[
                  { title: "Praxis-Effizienz Grundlagen", category: "Effizienz", lessons: "12 Lektionen" },
                  { title: "Zeitmanagement für Praxisinhaber", category: "Führung", lessons: "8 Lektionen" },
                  { title: "Teamführung & Motivation", category: "Leadership", lessons: "15 Lektionen" },
                  { title: "Digitalisierung in der Praxis", category: "Technologie", lessons: "10 Lektionen" },
                  { title: "Patientenkommunikation optimieren", category: "Kommunikation", lessons: "9 Lektionen" },
                  { title: "Workflow-Automatisierung", category: "Prozesse", lessons: "11 Lektionen" },
                ].map((course, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.lessons}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {course.category}
                    </span>
                  </div>
                ))}
              </div>

              {/* Email Subscribe */}
              <div className="pt-8 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Seien Sie unter den Ersten, die benachrichtigt werden, wenn die Academy startet!
                </p>

                {subscribed ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Vielen Dank! Wir melden uns bald.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Ihre E-Mail-Adresse"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="pl-10"
                        />
                      </div>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Wird gesendet..." : "Benachrichtigen"}
                      </Button>
                    </form>
                    {error && (
                      <p className="text-sm text-destructive text-center">{error}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
