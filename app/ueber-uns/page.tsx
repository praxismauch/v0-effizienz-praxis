"use client"

import { useEffect } from "react"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { Target, Users, Heart, Zap } from "lucide-react"

export default function UeberUnsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <LandingPageLayout>
      {/* Hero */}
      <section className="container py-12 md:py-20">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Über uns</div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
            Wir machen Praxismanagement einfach
          </h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
            Effizienz Praxis wurde mit der Mission gegründet, medizinischen Praxen modernste Tools für ein effizientes
            Management bereitzustellen.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="container pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Target,
              title: "Unsere Mission",
              description: "Praxen dabei zu helfen, ihre Zeit optimal zu nutzen und bessere Entscheidungen zu treffen",
            },
            {
              icon: Users,
              title: "Unser Team",
              description: "Experten aus Medizin und Technologie arbeiten zusammen für Ihre Praxis",
            },
            {
              icon: Heart,
              title: "Unsere Werte",
              description: "Qualität, Zuverlässigkeit und erstklassiger Support stehen im Mittelpunkt",
            },
            {
              icon: Zap,
              title: "Innovation",
              description: "Wir entwickeln kontinuierlich neue Features basierend auf Ihrem Feedback",
            },
          ].map((item, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">Unsere Geschichte</h2>
            <p className="text-lg text-muted-foreground">
              Effizienz Praxis entstand aus der Erkenntnis, dass viele medizinische Praxen mit veralteten Systemen und
              zeitraubenden manuellen Prozessen arbeiten. Unsere Gründer, selbst aus dem Gesundheitswesen kommend,
              wollten dies ändern.
            </p>
            <p className="text-lg text-muted-foreground">
              Heute unterstützen wir Praxen dabei, ihre Abläufe zu optimieren, datenbasierte Entscheidungen zu treffen
              und mehr Zeit für das Wesentliche zu haben: die Patientenversorgung.
            </p>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
