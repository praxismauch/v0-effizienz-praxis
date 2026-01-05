import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LandingPageLayout } from "@/components/landing-page-layout"

export const metadata = {
  title: "Cookie-Richtlinie - Effizienz Praxis",
  description: "Informationen über die Verwendung von Cookies auf der Effizienz Praxis Website.",
}

export default function CookiesPage() {
  return (
    <LandingPageLayout>
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">Cookie-Richtlinie</h1>
          <p className="text-muted-foreground mb-8">Stand: Dezember 2024</p>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">1. Was sind Cookies?</h2>
              <p className="text-muted-foreground mb-4">
                Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie unsere Website
                besuchen. Sie helfen uns, Ihre Präferenzen zu speichern und die Nutzung unserer Website zu analysieren.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">2. Welche Cookies verwenden wir?</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Notwendige Cookies</h3>
                  <p className="text-muted-foreground">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert
                    werden.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Analyse-Cookies</h3>
                  <p className="text-muted-foreground">
                    Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website nutzen.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Funktionale Cookies</h3>
                  <p className="text-muted-foreground">
                    Diese Cookies ermöglichen erweiterte Funktionalitäten und Personalisierung.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">3. Cookie-Einstellungen</h2>
              <p className="text-muted-foreground mb-4">
                Sie können Ihre Cookie-Einstellungen jederzeit über unseren Cookie-Banner oder in Ihren
                Browsereinstellungen anpassen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Kontakt</h2>
              <p className="text-muted-foreground">
                Bei Fragen zu unserer Cookie-Richtlinie kontaktieren Sie uns unter{" "}
                <a href="mailto:datenschutz@effizienz-praxis.de" className="text-primary hover:underline">
                  datenschutz@effizienz-praxis.de
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </LandingPageLayout>
  )
}
