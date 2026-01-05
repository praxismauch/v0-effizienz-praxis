import Link from "next/link"
import { ArrowLeft, Target, Users, Award, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingPageLayout } from "@/components/landing-page-layout"

export const metadata = {
  title: "Über uns - Effizienz Praxis",
  description:
    "Erfahren Sie mehr über Effizienz Praxis, unsere Mission und wie wir medizinische Praxen mit KI-gestützter Software transformieren.",
}

export default function AboutPage() {
  return (
    <LandingPageLayout>
      {/* Hero Section - Updated to use w-full with padding */}
      <section className="py-20 md:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">
              Wir transformieren <span className="text-primary">Arztpraxen</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 text-pretty">
              Effizienz Praxis wurde gegründet, um medizinischen Fachkräften zu helfen, sich auf das Wesentliche zu
              konzentrieren: ihre Patienten. Mit modernster KI-Technologie optimieren wir Praxisabläufe und schaffen
              mehr Zeit für das, was wirklich zählt.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section - Updated to use w-full with padding */}
      <section className="py-20 bg-muted/30">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Unsere Mission</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Wir glauben, dass Technologie Ärzte unterstützen sollte, nicht belasten. Deshalb entwickeln wir Software,
              die intuitiv, effizient und auf die Bedürfnisse moderner Praxen zugeschnitten ist.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Target,
                title: "Fokus",
                description: "Mehr Zeit für Patienten durch automatisierte Verwaltung",
              },
              {
                icon: Users,
                title: "Teamwork",
                description: "Bessere Zusammenarbeit durch transparente Prozesse",
              },
              {
                icon: Award,
                title: "Qualität",
                description: "Höhere Versorgungsqualität durch KI-Unterstützung",
              },
              {
                icon: Heart,
                title: "Zufriedenheit",
                description: "Glücklichere Teams und zufriedenere Patienten",
              },
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-background border">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Updated to use w-full with padding */}
      <section className="py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Bereit für den nächsten Schritt?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Erfahren Sie, wie Effizienz Praxis Ihre Praxis transformieren kann.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/demo">Kostenlose Demo buchen</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/preise">Preise ansehen</Link>
            </Button>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
