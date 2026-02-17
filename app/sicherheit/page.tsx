import Link from "next/link"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { Shield, Lock, Eye, Database, FileCheck, Server, Key, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sicherheit & DSGVO-Datenschutz | Deutsche Server & Verschlüsselung",
  description:
    "Effizienz Praxis ist DSGVO-konform: Deutsche Server, Ende-zu-Ende-Verschlüsselung, AV-Vertrag & regelmäßige Sicherheitsaudits. Erfahren Sie, wie wir Ihre Praxisdaten schützen.",
  alternates: { canonical: "/sicherheit" },
  openGraph: {
    title: "Sicherheit & DSGVO-Datenschutz | Effizienz Praxis",
    description: "DSGVO-konform: Deutsche Server, E2E-Verschlüsselung & Sicherheitsaudits. So schützen wir Ihre Daten.",
    url: "/sicherheit",
  },
}

export default function SicherheitPage() {
  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="border-b bg-muted/30 py-12 lg:py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Button>
          </Link>

          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Shield className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold lg:text-5xl">Sicherheit & Datenschutz</h1>
            <p className="text-lg text-muted-foreground">
              Ihre Daten sind bei uns in sicheren Händen. Erfahren Sie mehr über unsere Sicherheitsmaßnahmen.
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "Ende-zu-Ende-Verschlüsselung",
                description: "Alle Daten werden mit modernsten Verschlüsselungsstandards geschützt.",
              },
              {
                icon: Database,
                title: "DSGVO-konform",
                description: "Vollständige Einhaltung der europäischen Datenschutz-Grundverordnung.",
              },
              {
                icon: Server,
                title: "Deutsche Server",
                description: "Alle Daten werden ausschließlich auf Servern in Deutschland gespeichert.",
              },
              {
                icon: Key,
                title: "Zwei-Faktor-Authentifizierung",
                description: "Zusätzliche Sicherheitsebene für den Zugang zu Ihrem Konto.",
              },
              {
                icon: Eye,
                title: "Zugriffsprotokollierung",
                description: "Lückenlose Protokollierung aller Datenzugriffe.",
              },
              {
                icon: FileCheck,
                title: "Regelmäßige Audits",
                description: "Unabhängige Sicherheitsprüfungen durch externe Experten.",
              },
            ].map((feature, index) => (
              <div key={index} className="rounded-lg border bg-background p-6">
                <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold">Haben Sie Fragen zur Sicherheit?</h2>
          <p className="mb-8 text-muted-foreground">
            Unser Team steht Ihnen gerne für alle Fragen rund um Datenschutz und Sicherheit zur Verfügung.
          </p>
          <Button asChild>
            <Link href="/kontakt">Kontakt aufnehmen</Link>
          </Button>
        </div>
      </section>
    </LandingPageLayout>
  )
}
