"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Target, Lightbulb, TrendingUp, CheckCircle } from "lucide-react"

interface PageClientProps {
  practiceId?: string
}

export default function PageClient({ practiceId }: PageClientProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Strategie-Reise</h1>
          <p className="text-muted-foreground">
            Entwickeln Sie die strategische Ausrichtung Ihrer Praxis Schritt für Schritt
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Definieren Sie Ihre langfristige Vision für die Praxis</CardDescription>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Starten
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Ideen</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Sammeln und bewerten Sie strategische Ideen</CardDescription>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Entdecken
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Wachstum</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Planen Sie Wachstumsstrategien und Meilensteine</CardDescription>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Planen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-100">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Umsetzung</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>Verfolgen Sie die Umsetzung Ihrer Strategien</CardDescription>
              <Button variant="outline" className="mt-4 w-full bg-transparent">
                Verfolgen
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Willkommen zur Strategie-Reise</CardTitle>
            <CardDescription>
              Die Strategie-Reise hilft Ihnen dabei, eine klare strategische Ausrichtung für Ihre Praxis zu entwickeln.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Beginnen Sie mit der Definition Ihrer Vision und arbeiten Sie sich durch die verschiedenen Bereiche, um
              eine umfassende Strategie zu entwickeln. Jeder Schritt baut auf dem vorherigen auf und führt Sie zu einer
              klaren Roadmap für die Zukunft Ihrer Praxis.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
