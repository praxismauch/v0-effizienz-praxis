"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Rocket, Mail, Phone, Building2, MessageSquare, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LandingPageHeader } from "@/components/landing-page-header"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"

export default function ComingSoonPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [practiceName, setPracticeName] = useState("")
  const [practiceType, setPracticeType] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [practiceTypes, setPracticeTypes] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const loadPracticeTypes = async () => {
      const defaultTypes = [
        { id: "1", name: "Familienmedizin" },
        { id: "2", name: "Innere Medizin" },
        { id: "3", name: "Pädiatrie" },
        { id: "4", name: "Kardiologie" },
        { id: "5", name: "Dermatologie" },
        { id: "6", name: "Orthopädie" },
      ]

      try {
        const response = await fetchWithRetry("/api/practice-types")
        if (response.ok) {
          const data = await safeJsonParse<Array<{ id: string; name: string }>>(response, defaultTypes)
          setPracticeTypes(data.length > 0 ? data : defaultTypes)
        } else {
          setPracticeTypes(defaultTypes)
        }
      } catch (error) {
        console.error("[v0] Error loading practice types:", error)
        setPracticeTypes(defaultTypes)
      }
    }
    loadPracticeTypes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: name || null,
          practice_name: practiceName || null,
          practice_type: practiceType || null,
          phone: phone || null,
          message: message || null,
          source: "coming_soon_page",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setError(
            data.error ||
              "Diese E-Mail-Adresse ist bereits auf unserer Warteliste. Sie werden benachrichtigt, sobald wir starten.",
          )
        } else {
          setError(data.error || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
        }
      } else {
        setIsSubmitted(true)
      }
    } catch (err) {
      console.error("[v0] Waitlist registration error:", err)
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <LandingPageHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Vielen Dank für Ihr Interesse!</CardTitle>
              <CardDescription className="text-base">
                Wir haben Ihre Registrierung erhalten und werden Sie benachrichtigen, sobald Effizienz Praxis verfügbar
                ist.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Sie erhalten in Kürze eine Bestätigungs-E-Mail an <strong>{email}</strong>
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full bg-transparent">
                  Zurück zur Startseite
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <LandingPageFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingPageHeader />

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-2">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Startseite
              </Button>
            </Link>
          </div>

          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Rocket className="h-4 w-4" />
              <span>Bald verfügbar</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Effizienz Praxis startet bald
            </h1>
            <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
              Registrieren Sie sich jetzt für unsere Warteliste und erhalten Sie exklusiven Early-Access sowie
              Sonderkonditionen zum Launch.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start">
            {/* Registration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Jetzt registrieren</CardTitle>
                <CardDescription>Tragen Sie sich ein und wir informieren Sie, sobald wir live gehen</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-Mail-Adresse <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="ihre.email@praxis.de"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Ihr Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Dr. Max Mustermann"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceName">Praxisname</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="practiceName"
                        type="text"
                        placeholder="Praxis Dr. Mustermann"
                        value={practiceName}
                        onChange={(e) => setPracticeName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practiceType">Fachbereich</Label>
                    <Select value={practiceType} onValueChange={setPracticeType}>
                      <SelectTrigger id="practiceType">
                        <SelectValue placeholder="Wählen Sie einen Fachbereich" />
                      </SelectTrigger>
                      <SelectContent>
                        {practiceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer (optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+49 172 62 77 371"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nachricht (optional)</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="message"
                        placeholder="Teilen Sie uns Ihre spezifischen Anforderungen mit..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="pl-9 min-h-[100px]"
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert className="bg-red-50 border-2 border-red-500 text-red-900">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <AlertTitle className="text-red-900 font-bold">Fehler</AlertTitle>
                      <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Wird gesendet..." : "Jetzt registrieren"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Mit der Registrierung stimmen Sie unserer Datenschutzerklärung zu
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Was Sie erwartet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: CheckCircle2,
                      title: "Early Access",
                      description: "Exklusiver Zugang vor dem offiziellen Launch",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Sonderkonditionen",
                      description: "Spezielle Preisvorteile für Early Birds",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Persönliche Beratung",
                      description: "Individuelle Einrichtung und Support",
                    },
                    {
                      icon: CheckCircle2,
                      title: "Mitgestaltung",
                      description: "Ihr Feedback fließt in die Entwicklung ein",
                    },
                  ].map((benefit, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="mt-0.5">
                        <benefit.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{benefit.title}</p>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardHeader>
                  <CardTitle className="text-xl">Launch geplant für Q1 2026</CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    Wir arbeiten mit Hochdruck daran, Ihnen die beste Praxismanagement-Lösung zu bieten
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <LandingPageFooter />
    </div>
  )
}
