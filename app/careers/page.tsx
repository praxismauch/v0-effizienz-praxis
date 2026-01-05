import Link from "next/link"
import { ArrowLeft, MapPin, Clock, Briefcase, Heart, Zap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingPageLayout } from "@/components/landing-page-layout"

export const metadata = {
  title: "Karriere - Effizienz Praxis",
  description:
    "Werde Teil von Effizienz Praxis und gestalte die Zukunft des digitalen Gesundheitswesens mit. Offene Stellen und Benefits.",
}

export default function CareersPage() {
  const openPositions = [
    {
      title: "Senior Full-Stack Entwickler (m/w/d)",
      location: "Kaufbeuren / Remote",
      type: "Vollzeit",
      department: "Engineering",
    },
    {
      title: "Product Manager Gesundheitswesen (m/w/d)",
      location: "Kaufbeuren / Hybrid",
      type: "Vollzeit",
      department: "Product",
    },
    {
      title: "Customer Success Manager (m/w/d)",
      location: "Remote",
      type: "Vollzeit",
      department: "Customer Success",
    },
  ]

  const benefits = [
    {
      icon: Heart,
      title: "Work-Life-Balance",
      description: "Flexible Arbeitszeiten und Remote-Möglichkeiten für eine ausgewogene Work-Life-Balance.",
    },
    {
      icon: Zap,
      title: "Moderne Technologie",
      description: "Arbeite mit modernsten Technologien und Tools. Wir investieren in die besten Entwicklerwerkzeuge.",
    },
    {
      icon: Users,
      title: "Tolles Team",
      description: "Ein motiviertes, erfahrenes Team mit flachen Hierarchien und offener Kommunikation.",
    },
    {
      icon: Briefcase,
      title: "Weiterbildung",
      description: "Persönliches Weiterbildungsbudget und Zeit für Konferenzen, Kurse und Zertifizierungen.",
    },
  ]

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
            Gestalte die Zukunft des Gesundheitswesens
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-8">
            Wir suchen talentierte Menschen, die mit uns die digitale Transformation medizinischer Praxen vorantreiben
            möchten.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">Warum Effizienz Praxis?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Offene Stellen</h2>
          <div className="space-y-4">
            {openPositions.map((position) => (
              <div
                key={position.title}
                className="p-6 border rounded-lg hover:border-primary transition-colors bg-background"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">{position.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {position.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {position.department}
                      </span>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/kontakt">Jetzt bewerben</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-muted rounded-lg text-center">
            <h3 className="text-xl font-semibold mb-3">Keine passende Stelle gefunden?</h3>
            <p className="text-muted-foreground mb-6">
              Wir sind immer auf der Suche nach talentierten Menschen. Sende uns eine Initiativbewerbung!
            </p>
            <Button asChild variant="outline">
              <Link href="/kontakt">Initiativbewerbung senden</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Unsere Kultur</h2>
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              Bei Effizienz Praxis arbeiten wir an der Schnittstelle von Technologie und Gesundheitswesen – einem
              Bereich mit enormem gesellschaftlichem Impact. Unser Team besteht aus erfahrenen Entwicklern,
              Produktmanagern und Gesundheitsexperten, die alle das gemeinsame Ziel verfolgen, das deutsche
              Gesundheitswesen zu digitalisieren.
            </p>
            <p>
              Wir leben eine Kultur der Offenheit, des Lernens und der kontinuierlichen Verbesserung. Flache
              Hierarchien, kurze Entscheidungswege und viel Eigenverantwortung prägen unseren Alltag. Remote-Arbeit ist
              bei uns selbstverständlich, regelmäßige Team-Events sorgen für den persönlichen Austausch.
            </p>
            <p>
              Als wachsendes Unternehmen bieten wir dir die Möglichkeit, echten Einfluss zu nehmen und die
              Produktrichtung aktiv mitzugestalten. Deine Ideen sind gefragt – wir hören zu und setzen sie um.
            </p>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
