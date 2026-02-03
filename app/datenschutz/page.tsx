"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LandingPageHeader } from "@/components/landing-page-header"
import { LandingPageFooter } from "@/components/landing-page-footer"
import { useEffect } from "react"
import { Shield, Eye, Lock, FileText, Mail, Database, UserCheck, ArrowRight } from "lucide-react"

export default function DatenschutzPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Zurück zur Startseite
            </Link>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Datenschutzerklärung</h1>
              <p className="text-xl text-muted-foreground">
                Ihre Daten sind bei uns sicher. Hier erfahren Sie, wie wir mit Ihren personenbezogenen Daten umgehen.
              </p>
              <p className="text-sm text-muted-foreground">Stand: Januar 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Section 1: Datenschutz auf einen Blick */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold">Datenschutz auf einen Blick</h2>

                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Allgemeine Hinweise</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
                      Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen
                      Sie persönlich identifiziert werden können.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-2">Datenerfassung auf dieser Website</h3>
                    <h4 className="text-lg font-medium mb-2 text-primary">
                      Wer ist verantwortlich für die Datenerfassung?
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten
                      können Sie dem Impressum dieser Website entnehmen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Hosting */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold">Hosting</h2>

                <div className="rounded-lg border bg-card p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
                  </p>
                  <div className="mt-4 p-4 rounded-md bg-muted/50">
                    <p className="font-medium">Vercel Inc.</p>
                    <p className="text-sm text-muted-foreground">
                      440 N Barranca Ave #4133
                      <br />
                      Covina, CA 91723
                      <br />
                      USA
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      <span className="font-medium">Server Standort:</span> Frankfurt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Allgemeine Hinweise */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold">Allgemeine Hinweise und Pflichtinformationen</h2>

                <div className="space-y-6">
                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h3 className="text-xl font-semibold">Datenschutz</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln
                      Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften
                      sowie dieser Datenschutzerklärung.
                    </p>
                  </div>

                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h3 className="text-xl font-semibold">Hinweis zur verantwortlichen Stelle</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
                    </p>
                    <div className="p-4 rounded-md bg-muted/50">
                      <p className="font-medium">Dr. Daniel Mauch</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Allgäuerstr. 106
                        <br />
                        87600 Kaufbeuren
                        <br />
                        Deutschland
                      </p>
                      <p className="text-sm text-muted-foreground mt-3">
                        <span className="font-medium">E-Mail:</span> datenschutz@effizienz-praxis.de
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Datenerfassung */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold">Datenerfassung auf dieser Website</h2>

                <div className="space-y-6">
                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h3 className="text-xl font-semibold">Cookies</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Datenpakete und richten
                      auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend für die Dauer einer
                      Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
                    </p>
                  </div>

                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h3 className="text-xl font-semibold">Server-Log-Dateien</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
                      Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                    </p>
                    <ul className="space-y-2 ml-4">
                      {[
                        "Browsertyp und Browserversion",
                        "verwendetes Betriebssystem",
                        "Referrer URL",
                        "Hostname des zugreifenden Rechners",
                        "Uhrzeit der Serveranfrage",
                        "IP-Adresse",
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <h3 className="text-xl font-semibold">Kontaktformular</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
                      Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der
                      Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Ihre Rechte */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UserCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold">Ihre Rechte</h2>

                <div className="rounded-lg border bg-card p-6 space-y-4">
                  <p className="text-muted-foreground leading-relaxed">Sie haben jederzeit das Recht:</p>
                  <div className="grid gap-3">
                    {[
                      "Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten",
                      "Berichtigung unrichtiger personenbezogener Daten zu verlangen",
                      "Löschung Ihrer bei uns gespeicherten personenbezogenen Daten zu verlangen",
                      "Einschränkung der Datenverarbeitung zu verlangen",
                      "Widerspruch gegen die Verarbeitung einzulegen",
                      "Datenübertragbarkeit zu fordern",
                    ].map((right, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <p className="text-muted-foreground flex-1">{right}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Analyse-Tools */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-bold">Analyse-Tools und Tools von Drittanbietern</h2>

                <div className="rounded-lg border bg-card p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor
                    allem mit sogenannten Analyseprogrammen. Detaillierte Informationen zu diesen Analyseprogrammen
                    finden Sie in der folgenden Datenschutzerklärung.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold">Fragen zum Datenschutz?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Wenn Sie Fragen zu unserer Datenschutzerklärung haben oder Ihre Rechte ausüben möchten, kontaktieren Sie
              uns gerne.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/kontakt">
                <Button size="lg" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Kontakt aufnehmen
                </Button>
              </Link>
              <Link href="/impressum">
                <Button size="lg" variant="outline">
                  Zum Impressum
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingPageFooter />
    </div>
  )
}
