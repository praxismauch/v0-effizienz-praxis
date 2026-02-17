import { Button } from "@/components/ui/button"
import { Briefcase, MapPin, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LandingPageLayout } from "@/components/landing-page-layout"

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Karriere bei Effizienz Praxis | Offene Stellen im HealthTech",
  description:
    "Werde Teil von Effizienz Praxis und gestalte die Zukunft der digitalen Praxisverwaltung. Offene Stellen in Engineering, Design & Vertrieb. Remote-first Arbeitskultur.",
  alternates: { canonical: "/karriere" },
  openGraph: {
    title: "Karriere bei Effizienz Praxis | HealthTech Jobs",
    description: "Gestalte die Zukunft der digitalen Praxisverwaltung. Offene Stellen & Remote-first Kultur.",
    url: "/karriere",
  },
}

export default function KarrierePage() {
  const openings = [
    {
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Remote / Berlin",
      type: "Vollzeit",
      description: "Wir suchen einen erfahrenen Frontend Developer zur Verstärkung unseres Engineering Teams.",
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Berlin",
      type: "Vollzeit",
      description: "Als Product Manager gestaltest du die Zukunft unserer Praxismanagement-Plattform.",
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Vollzeit",
      description: "Unterstütze unsere Kunden dabei, das Maximum aus unserer Plattform herauszuholen.",
    },
  ]

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Button>
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Karriere bei Effizienz Praxis</h1>
          <p className="text-xl text-muted-foreground">
            Werde Teil unseres Teams und gestalte die Zukunft der digitalen Praxisverwaltung mit.
          </p>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold mb-8">Offene Stellen</h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <div key={index} className="p-6 rounded-lg border bg-background">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{job.description}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/kontakt">Bewerben</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Keine passende Stelle gefunden?</h2>
          <p className="text-muted-foreground mb-6">
            Wir freuen uns immer über Initiativbewerbungen von talentierten Menschen.
          </p>
          <Button asChild>
            <Link href="/kontakt">Initiativ bewerben</Link>
          </Button>
        </div>
      </section>
    </LandingPageLayout>
  )
}
