import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LandingPageLayout } from "@/components/landing-page-layout"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kostenlose Demo buchen | Praxismanagement live erleben",
  description:
    "Buchen Sie Ihre persönliche Demo der Effizienz Praxis Software. Erleben Sie live, wie KI-gestütztes Praxismanagement Ihre Abläufe optimiert. Unverbindlich & kostenlos in 30 Minuten.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Kostenlose Demo buchen | Effizienz Praxis",
    description: "Persönliche Live-Demo: Erleben Sie modernes Praxismanagement mit KI. Unverbindlich in 30 Minuten.",
    url: "/demo",
  },
}

export default function DemoPage() {
  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="container py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </Link>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Kostenlose Demo</div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
            Erleben Sie Effizienz Praxis in Aktion
          </h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
            Buchen Sie eine persönliche Demo und entdecken Sie, wie unsere Plattform Ihre Praxisabläufe optimiert.
          </p>
        </div>
      </section>

      {/* Demo Form Section */}
      <section className="container py-12">
        <div className="max-w-xl mx-auto">
          <div className="rounded-xl border bg-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Demo-Termin buchen</h2>
            </div>

            <form className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" placeholder="Max" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" placeholder="Mustermann" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" placeholder="max@beispiel.de" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practice">Praxisname</Label>
                <Input id="practice" placeholder="Musterpraxis" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon (optional)</Label>
                <Input id="phone" type="tel" placeholder="+49 123 456789" />
              </div>

              <Button type="submit" className="w-full">
                Demo anfordern
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Wir melden uns innerhalb von 24 Stunden bei Ihnen.
            </p>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
