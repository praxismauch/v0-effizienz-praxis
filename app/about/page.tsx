import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Target, Users, Heart, Zap, CheckCircle, XCircle, Lightbulb } from "lucide-react"
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
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Link>
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Über uns</div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
              Warum Effizienz-Praxis entstanden ist
            </h1>
            <p className="text-lg text-muted-foreground text-pretty max-w-[700px] mx-auto">
              Die medizinische Versorgung scheitert immer seltener am medizinischen Wissen – sondern immer häufiger an
              Zeitmangel, ineffizienten Abläufen und unnötiger Bürokratie.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="pb-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-64 h-80 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/dr.jpg"
                    alt="Dr. Daniel Mauch - Gründer von Effizienz-Praxis"
                    fill
                    sizes="256px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">Dr. med. Daniel Mauch</h3>
                  <p className="text-muted-foreground text-sm">Facharzt für Allgemeinmedizin & Gründer</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Als niedergelassener Arzt habe ich über Jahre hinweg erlebt, wie viel Energie, Motivation und
                  wertvolle Arzt-Patienten-Zeit im Praxisalltag verloren gehen – nicht wegen fehlenden Engagements,
                  sondern wegen historisch gewachsener Strukturen, Medienbrüche und unklarer Prozesse.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Neben meiner Tätigkeit bei Effizienz-Praxis bin ich weiterhin als{" "}
                  <strong className="text-foreground">Facharzt für Allgemeinmedizin</strong> in meiner eigenen{" "}
                  <strong className="text-foreground">Hausarztpraxis</strong> tätig. Diese Doppelrolle ist kein Zufall –
                  sie ist der Kern meiner Arbeit. Denn nur wer täglich selbst in der Praxis steht, versteht wirklich,
                  welche Herausforderungen Praxisteams bewältigen müssen.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Jede Idee, jeder Prozess und jedes Tool, das bei Effizienz-Praxis entsteht, wird zuerst in meiner
                  eigenen Hausarztpraxis entwickelt und erprobt. So stelle ich sicher, dass unsere Lösungen nicht nur
                  theoretisch funktionieren, sondern{" "}
                  <strong className="text-foreground">im echten Praxisalltag bestehen</strong>.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Gleichzeitig wurde mir klar:{" "}
                  <strong className="text-foreground">
                    Viele Praxen kämpfen mit denselben Problemen – lösen sie aber alle für sich allein.
                  </strong>
                </p>

                <div className="bg-muted/50 border rounded-xl p-6 space-y-3 mt-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Warum das wichtig ist
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Praxiserprobte Lösungen statt Theorie",
                      "Echtes Verständnis für den Arbeitsalltag",
                      "Kontinuierliche Weiterentwicklung aus der Praxis heraus",
                      "Direkte Rückmeldung von Patienten und Team",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Idea Section */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8">Die Idee hinter Effizienz-Praxis</h2>
            <p className="text-lg text-muted-foreground text-center">
              Effizienz-Praxis ist nicht als klassische Beratungsfirma entstanden, sondern als{" "}
              <strong className="text-foreground">praxisnahe Antwort aus der Praxis für die Praxis</strong>.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {[
                "Weniger Chaos",
                "Klare Strukturen",
                "Funktionierende Prozesse",
                "Digitale Werkzeuge, die helfen",
                "Mehr Zeit für Medizin",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-background rounded-lg px-4 py-3 shadow-sm whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-6">
              Statt theoretischer Konzepte basiert Effizienz-Praxis auf{" "}
              <strong className="text-foreground">real erprobten Lösungen</strong>, die im laufenden Praxisbetrieb
              entwickelt, getestet und optimiert wurden.
            </p>
          </div>
        </div>
      </section>

      {/* Efficiency Understanding Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Unser Verständnis von Effizienz</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-destructive">
                <XCircle className="h-6 w-6" />
                Effizienz bedeutet für uns nicht:
              </h3>
              <ul className="space-y-3">
                {[
                  "Schneller arbeiten um jeden Preis",
                  "Mehr Patienten in weniger Zeit",
                  "Maximalen wirtschaftlichen Druck",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-destructive mt-1">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-primary">
                <CheckCircle className="h-6 w-6" />
                Effizienz bedeutet:
              </h3>
              <ul className="space-y-3">
                {[
                  "Klare Zuständigkeiten",
                  "Transparente Abläufe",
                  "Weniger Unterbrechungen",
                  "Digitale Prozesse, die entlasten",
                  "Ein Team, das weiß, was zu tun ist",
                  "Eine Praxis, die steuerbar wird",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary mt-1 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-center text-lg">
              Denn nur eine gut organisierte Praxis kann:{" "}
              <strong className="text-foreground">medizinisch hochwertig arbeiten</strong>,{" "}
              <strong className="text-foreground">Mitarbeitende langfristig binden</strong>,{" "}
              <strong className="text-foreground">wirtschaftlich stabil bleiben</strong> – und gleichzeitig{" "}
              <strong className="text-foreground">menschlich bleiben</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Target Groups Section */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Für wen Effizienz-Praxis da ist</h2>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Target,
                title: "Hausarztpraxen",
                description: "Optimierte Abläufe für den Praxisalltag",
              },
              {
                icon: Users,
                title: "Facharztpraxen",
                description: "Spezialisierte Lösungen für Ihre Fachrichtung",
              },
              {
                icon: Heart,
                title: "Praxisinhaber:innen",
                description: "Die Verantwortung tragen und gestalten wollen",
              },
              {
                icon: Zap,
                title: "Praxisteams",
                description: "Die Klarheit und Struktur schätzen",
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
          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            Egal ob Einzelpraxis oder größeres Team: Unser Anspruch ist immer derselbe –{" "}
            <strong className="text-foreground">spürbare Entlastung im Alltag</strong>.
          </p>
        </div>
      </section>

      {/* Drive Section */}
      <section className="container py-20">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center mb-8">Unser Antrieb</h2>
          <p className="text-lg text-muted-foreground text-center">
            Effizienz-Praxis wurde nicht gegründet, um noch ein weiteres Tool oder Konzept anzubieten.
          </p>
          <p className="text-xl font-semibold text-center text-primary">
            Sondern um eine echte Lücke zu schließen: zwischen medizinischem Anspruch und organisatorischer Realität.
          </p>
          <div className="mt-8 p-6 bg-muted rounded-xl">
            <p className="text-center text-muted-foreground mb-4">Wenn am Ende des Tages:</p>
            <ul className="space-y-2 max-w-md mx-auto">
              {[
                "das Team entspannter arbeitet",
                "Entscheidungen klarer sind",
                "Prozesse laufen, ohne ständig erklärt zu werden",
                "wieder mehr Zeit für das Wesentliche bleibt",
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-center font-semibold mt-6">...dann hat Effizienz-Praxis seinen Zweck erfüllt.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/50">
        <div className="container text-center">
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
