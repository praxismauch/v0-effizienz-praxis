"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import LandingPageHeader from "@/components/landing-page-header"
import LandingPageFooter from "@/components/landing-page-footer"
import { useEffect } from "react"
import {
  FileText,
  CheckCircle,
  Users,
  Shield,
  Clock,
  CreditCard,
  FileCheck,
  Lock,
  AlertTriangle,
  BookOpen,
  ArrowRight,
} from "lucide-react"

export default function AGBPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Zurück zur Startseite
          </Link>

          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Allgemeine Geschäftsbedingungen</h1>
            <p className="text-lg text-muted-foreground">Stand: Januar 2025</p>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung unserer Praxismanagement-Plattform.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* § 1 Geltungsbereich */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 1 Geltungsbereich</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über die Nutzung der
                  Software-as-a-Service (SaaS) Plattform „Effizienz Praxis" zwischen Dr. Daniel Mauch (nachfolgend
                  „Anbieter") und dem Kunden.
                </p>
              </div>
            </div>
          </div>

          {/* § 2 Vertragsgegenstand */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 2 Vertragsgegenstand</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Anbieter stellt dem Kunden eine cloudbasierte Software zur Verwaltung und Optimierung von
                  Praxisabläufen zur Verfügung. Der Funktionsumfang ergibt sich aus der jeweils gewählten Preisstufe.
                </p>
              </div>
            </div>
          </div>

          {/* § 3 Vertragsschluss */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <FileCheck className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 3 Vertragsschluss</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Vertrag kommt durch die Registrierung des Kunden und die Auswahl eines Tarifs zustande. Der Kunde
                  erhält eine Bestätigungs-E-Mail mit den Vertragsdaten.
                </p>
              </div>
            </div>
          </div>

          {/* § 4 Nutzungsrechte */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 4 Nutzungsrechte</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Anbieter räumt dem Kunden ein nicht-exklusives, nicht übertragbares und zeitlich auf die
                  Vertragsdauer beschränktes Recht zur Nutzung der Software ein.
                </p>
              </div>
            </div>
          </div>

          {/* § 5 Pflichten des Kunden */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 5 Pflichten des Kunden</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">Der Kunde verpflichtet sich:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium">
                      1
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">
                      Die Software ausschließlich im Rahmen der geltenden Gesetze zu nutzen
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium">
                      2
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">Seine Zugangsdaten vertraulich zu behandeln</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium">
                      3
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">
                      Den Anbieter unverzüglich über unbefugte Zugriffe zu informieren
                    </p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium">
                      4
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">Regelmäßige Datensicherungen durchzuführen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* § 6 Verfügbarkeit */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10">
                <Clock className="h-5 w-5 text-cyan-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 6 Verfügbarkeit</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Anbieter stellt die Software mit einer Verfügbarkeit von <strong>99% im Jahresmittel</strong> zur
                  Verfügung. Ausgenommen sind Wartungsarbeiten und Zeiten, in denen die Software aufgrund von
                  technischen oder sonstigen Problemen nicht erreichbar ist.
                </p>
              </div>
            </div>
          </div>

          {/* § 7 Vergütung und Zahlungsbedingungen */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 7 Vergütung und Zahlungsbedingungen</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Die Vergütung richtet sich nach dem gewählten Tarif. Die Zahlung erfolgt monatlich oder jährlich im
                  Voraus. Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zu sperren.
                </p>
              </div>
            </div>
          </div>

          {/* § 8 Laufzeit und Kündigung */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 8 Laufzeit und Kündigung</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Vertrag wird auf unbestimmte Zeit geschlossen. Beide Parteien können den Vertrag mit einer Frist
                  von <strong>einem Monat zum Monatsende</strong> kündigen. Das Recht zur außerordentlichen Kündigung
                  bleibt unberührt.
                </p>
              </div>
            </div>
          </div>

          {/* § 9 Datenschutz */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                <Lock className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 9 Datenschutz</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Anbieter verarbeitet personenbezogene Daten ausschließlich im Rahmen der gesetzlichen
                  Bestimmungen. Die Details ergeben sich aus der{" "}
                  <Link href="/datenschutz" className="text-primary hover:underline font-medium">
                    Datenschutzerklärung
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* § 10 Haftung */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 10 Haftung</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit. Bei leichter Fahrlässigkeit
                  haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten. Die Haftung ist auf den
                  vorhersehbaren, vertragstypischen Schaden begrenzt.
                </p>
              </div>
            </div>
          </div>

          {/* § 11 Schlussbestimmungen */}
          <div className="rounded-lg border bg-card p-6 md:p-8 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-500/10">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-2xl font-semibold">§ 11 Schlussbestimmungen</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen dieser AGB unwirksam
                  sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="rounded-lg border bg-primary/5 p-8 text-center space-y-4 mt-12">
            <h3 className="text-2xl font-semibold">Fragen zu unseren AGB?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wenn Sie Fragen zu unseren Allgemeinen Geschäftsbedingungen haben, kontaktieren Sie uns gerne.
            </p>
            <Link href="/kontakt">
              <Button size="lg" className="mt-4">
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
