"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { useToast } from "@/hooks/use-toast"
import { LandingPageHeader } from "@/components/landing-page-header"

// Client component that handles all interactivity
function ContactPageClient() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    toast({
      title: "Nachricht gesendet",
      description: "Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen.",
    })

    setIsSubmitting(false)
    ;(e.target as HTMLFormElement).reset()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <LandingPageHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">Kontaktieren Sie uns</h1>
            <p className="text-xl text-muted-foreground text-balance max-w-3xl">
              Haben Sie Fragen zu Effizienz Praxis? Unser Team steht Ihnen gerne zur Verfügung.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Schreiben Sie uns</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" name="phone" type="tel" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="practice">Praxisname</Label>
                    <Input id="practice" name="practice" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Ihre Nachricht *</Label>
                    <Textarea id="message" name="message" rows={6} required />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Wird gesendet..."
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Nachricht senden
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Mit dem Absenden stimmen Sie unserer{" "}
                    <Link href="/datenschutz" className="underline hover:text-foreground">
                      Datenschutzerklärung
                    </Link>{" "}
                    zu.
                  </p>
                </form>
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Kontaktinformationen</h2>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg h-fit">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">E-Mail</h3>
                      <a
                        href="mailto:info@effizienz-praxis.de"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        info@effizienz-praxis.de
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">Wir antworten innerhalb von 24 Stunden</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg h-fit">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Telefon</h3>
                      <a
                        href="tel:+491726277371"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        +49 (0) 172 62 77 371
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">Mo-Fr: 9:00 - 18:00 Uhr</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg h-fit">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Adresse</h3>
                      <address className="not-italic text-muted-foreground">
                        Allgäuerstraße 106
                        <br />
                        87600 Kaufbeuren
                        <br />
                        Deutschland
                      </address>
                    </div>
                  </div>

                  <div className="p-6 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Für technische Fragen und Support nutzen Sie bitte unser Support-Portal nach dem Login.
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/auth/login">Zum Support-Portal</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingPageFooter />
    </div>
  )
}

// Server component wrapper that doesn't use getCurrentUserProfile
// This allows the /contact route to be statically generated without DynamicServerError
export default function ContactPage() {
  // No getCurrentUserProfile() call here - this page doesn't need user data
  // This allows Next.js to prerender this route statically
  return <ContactPageClient />
}
