"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { LandingPageFooter } from "@/components/landing-page-footer" // Import LandingPageFooter
import { useEffect } from "react"

export default function KontaktPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <LandingPageLayout>
      {/* Hero */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Startseite
              </Button>
            </Link>

            <div className="text-center space-y-6">
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Kontakt</div>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
                Wir sind für Sie da
              </h1>
              <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
                Haben Sie Fragen? Unser Team hilft Ihnen gerne weiter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="container pb-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Kontaktinformationen</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">E-Mail</p>
                    <p className="text-muted-foreground">info@effizienz-praxis.de</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Telefon</p>
                    <p className="text-muted-foreground">+49 (0) 172 62 77 371</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Adresse</p>
                    <p className="text-muted-foreground">
                      Allgäuerstr. 106
                      <br />
                      87600 Kaufbeuren
                      <br />
                      Deutschland
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-primary p-6 text-primary-foreground">
              <h3 className="text-xl font-bold mb-2">Support & Beratung</h3>
              <p className="mb-4 text-primary-foreground/90">
                Unser Support-Team steht Ihnen Mo-Fr von 9:00 bis 18:00 Uhr zur Verfügung.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border bg-background p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Nachricht senden</h2>
            <form className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input id="firstName" placeholder="Max" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input id="lastName" placeholder="Mustermann" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input id="email" type="email" placeholder="max@praxis.de" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Betreff *</Label>
                <Input id="subject" placeholder="Ihre Anfrage" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Nachricht *</Label>
                <textarea
                  id="message"
                  required
                  className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Wie können wir Ihnen helfen?"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Nachricht senden
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingPageFooter />
    </LandingPageLayout>
  )
}
