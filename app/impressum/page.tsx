"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LandingPageHeader } from "@/components/landing-page-header"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { useEffect } from "react"
import { Building2, User, Mail, Phone, Globe, Scale, FileText, Shield, LinkIcon, ArrowRight } from "lucide-react"

export default function ImpressumPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="border-b bg-muted/50">
        <div className="container py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Zurück zur Startseite
            </Link>

            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Impressum</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Angaben gemäß § 5 TMG und weitere rechtliche Informationen zu Dr. Daniel Mauch
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Company Information */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-500/10 p-3 mt-1">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Angaben gemäß § 5 TMG</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="font-medium text-foreground">Dr. Daniel Mauch</p>
                  <p>Allgäuerstr. 106</p>
                  <p>87600 Kaufbeuren</p>
                  <p>Deutschland</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Representatives */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-purple-500/10 p-3 mt-1">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Vertreten durch</h2>
                <div className="grid gap-3">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Geschäftsführer</p>
                    <p className="text-foreground">Dr. Daniel Mauch</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Registergericht</p>
                    <p className="text-foreground">Amtsgericht Kaufbeuren</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Umsatzsteuer-ID</p>
                    <p className="text-foreground">DE123456789</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-500/10 p-3 mt-1">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Kontakt</h2>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                      <a href="tel:+4917262773710" className="text-foreground hover:text-primary transition-colors">
                        +49 (0) 172 62 77 371
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">E-Mail</p>
                      <a
                        href="mailto:info@effizienz-praxis.de"
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        info@effizienz-praxis.de
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-4">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <p className="text-foreground">www.effizienz-praxis.de</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Responsibility */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-500/10 p-3 mt-1">
                <User className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-foreground">Dr. Daniel Mauch</p>
                  <p className="text-muted-foreground">Allgäuerstr. 106</p>
                  <p className="text-muted-foreground">87600 Kaufbeuren</p>
                </div>
              </div>
            </div>
          </div>

          {/* EU Dispute Resolution */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-cyan-500/10 p-3 mt-1">
                <Scale className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">EU-Streitschlichtung</h2>
                <p className="text-muted-foreground">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                </p>
                <div className="bg-muted/50 rounded-lg p-4">
                  <a
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    https://ec.europa.eu/consumers/odr
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
              </div>
            </div>
          </div>

          {/* Consumer Dispute Resolution */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-500/10 p-3 mt-1">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
                <p className="text-muted-foreground">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </div>
          </div>

          {/* Liability for Content */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-indigo-500/10 p-3 mt-1">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Haftung für Inhalte</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
                  allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
                  verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
                  forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>
            </div>
          </div>

          {/* Liability for Links */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-pink-500/10 p-3 mt-1">
                <LinkIcon className="h-6 w-6 text-pink-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Haftung für Links</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
                  Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
                  verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-orange-500/10 p-3 mt-1">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-semibold">Urheberrecht</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
                  Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
                  Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw.
                  Erstellers.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="rounded-lg border bg-primary/5 p-6 md:p-8 text-center space-y-4">
            <h3 className="text-xl font-semibold">Haben Sie Fragen?</h3>
            <p className="text-muted-foreground">
              Bei rechtlichen Fragen oder Anliegen können Sie uns jederzeit kontaktieren.
            </p>
            <Link href="/kontakt">
              <Button size="lg" className="mt-2">
                Kontakt aufnehmen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingPageFooter />
    </div>
  )
}
