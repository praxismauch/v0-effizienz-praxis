import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Erklärung zur Barrierefreiheit | Effizienz Praxis",
  description: "Erklärung zur Barrierefreiheit gemäß BITV 2.0 für Effizienz Praxis",
}

export default function BarrierefreiheitPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Erklärung zur Barrierefreiheit</h1>
          <p className="text-muted-foreground text-lg">Stand: Januar 2026</p>
        </header>

        {/* Introduction */}
        <section className="mb-10">
          <p className="text-foreground leading-relaxed mb-4">
            Diese Erklärung zur Barrierefreiheit gilt für die Webanwendung <strong>Effizienz Praxis</strong>{" "}
            (effizienz-praxis.de), betrieben von der Effizienz Praxis GmbH.
          </p>
          <p className="text-foreground leading-relaxed">
            Als Anbieter einer digitalen Praxismanagement-Lösung sind wir bestrebt, unsere Webanwendung im Einklang mit
            den nationalen Rechtsvorschriften zur Umsetzung der Richtlinie (EU) 2016/2102 des Europäischen Parlaments
            und des Rates barrierefrei zugänglich zu machen.
          </p>
        </section>

        {/* Conformity Status */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Stand der Vereinbarkeit mit den Anforderungen</h2>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-4">
            <p className="text-foreground leading-relaxed">
              Diese Webanwendung ist <strong>teilweise konform</strong> mit der
              Barrierefreie-Informationstechnik-Verordnung (BITV 2.0), die auf Grundlage der Web Content Accessibility
              Guidelines (WCAG) 2.1 Level AA erstellt wurde.
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            Die Konformität wurde durch eine Selbstbewertung im Dezember 2025 ermittelt.
          </p>
        </section>

        {/* Accessible Features */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Barrierefreie Funktionen</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Folgende Maßnahmen wurden umgesetzt, um die Barrierefreiheit zu gewährleisten:
          </p>
          <ul className="space-y-3">
            {[
              "Vollständige Tastaturbedienbarkeit aller interaktiven Elemente",
              "Semantische HTML-Struktur mit korrekten Überschriftenhierarchien",
              "Ausreichende Farbkontraste (mindestens 4,5:1 für Text)",
              "Alternative Texte für alle informativen Bilder",
              "Konsistente Navigation und Seitenstruktur",
              "Fokusindikatoren für alle interaktiven Elemente",
              "Responsive Design für verschiedene Bildschirmgrößen",
              "Unterstützung von Dark Mode für reduzierte Blendung",
              "ARIA-Labels und -Rollen für Screenreader-Kompatibilität",
              "Skip-Links zum Überspringen von Navigationsbereichen",
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 text-green-600 flex items-center justify-center text-sm font-medium">
                  ✓
                </span>
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Known Limitations */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Bekannte Einschränkungen</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Trotz unserer Bemühungen können einige Inhalte noch nicht vollständig barrierefrei sein. Die folgenden
            Bereiche werden derzeit überarbeitet:
          </p>
          <div className="space-y-4">
            {[
              {
                title: "PDF-Dokumente",
                description:
                  "Einige ältere PDF-Dokumente sind möglicherweise nicht vollständig mit Screenreadern kompatibel. Wir arbeiten an der Umstellung auf barrierefreie Formate.",
                timeline: "Geplante Behebung: Q2 2026",
              },
              {
                title: "Komplexe Diagramme",
                description:
                  "Einige analytische Diagramme verfügen noch nicht über vollständige Textbeschreibungen. Alternative Datentabellen sind in Planung.",
                timeline: "Geplante Behebung: Q1 2026",
              },
              {
                title: "Drag-and-Drop-Funktionen",
                description:
                  "Bestimmte Funktionen wie die Aufgabenpriorisierung per Drag-and-Drop haben eingeschränkte Tastaturalternativen.",
                timeline: "Geplante Behebung: Q2 2026",
              },
            ].map((item, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-5">
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                <span className="text-xs text-primary font-medium">{item.timeline}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Technologies Used */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Verwendete Technologien</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Die Barrierefreiheit dieser Webanwendung basiert auf folgenden Technologien:
          </p>
          <div className="flex flex-wrap gap-2">
            {["HTML5", "CSS3", "JavaScript (ES6+)", "WAI-ARIA 1.2", "React 19", "Next.js 16", "Tailwind CSS 4"].map(
              (tech) => (
                <span key={tech} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {tech}
                </span>
              ),
            )}
          </div>
        </section>

        {/* Testing Methods */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Prüfmethoden</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Die Barrierefreiheit wurde mit folgenden Methoden getestet:
          </p>
          <ul className="space-y-2 text-foreground">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Automatisierte Tests mit axe DevTools und Lighthouse
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Manuelle Tastaturnavigationstests
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Screenreader-Tests mit NVDA und VoiceOver
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Farbkontrastprüfungen mit WebAIM Contrast Checker
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Tests auf verschiedenen Geräten und Browsern
            </li>
          </ul>
        </section>

        {/* Feedback and Contact */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Feedback und Kontakt</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Wir sind bestrebt, die Barrierefreiheit unserer Webanwendung kontinuierlich zu verbessern. Wenn Sie Probleme
            feststellen oder Verbesserungsvorschläge haben, kontaktieren Sie uns bitte:
          </p>
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground w-20">E-Mail:</span>
              <a href="mailto:barrierefreiheit@effizienz-praxis.de" className="text-primary hover:underline">
                barrierefreiheit@effizienz-praxis.de
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground w-20">Telefon:</span>
              <a href="tel:+4930123456789" className="text-primary hover:underline">
                +49 30 123 456 789
              </a>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-medium text-foreground w-20">Adresse:</span>
              <span className="text-foreground">
                Effizienz Praxis GmbH
                <br />
                Musterstraße 123
                <br />
                10115 Berlin
              </span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-4">
            Wir bemühen uns, Ihre Anfrage innerhalb von 14 Tagen zu beantworten.
          </p>
        </section>

        {/* Enforcement */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Durchsetzungsverfahren</h2>
          <p className="text-foreground leading-relaxed mb-4">
            Sollten Sie der Ansicht sein, dass wir Ihre Anfrage nicht zufriedenstellend bearbeitet haben, können Sie
            sich an die zuständige Schlichtungsstelle wenden:
          </p>
          <div className="bg-muted/50 rounded-lg p-6">
            <p className="font-semibold text-foreground mb-2">Schlichtungsstelle nach § 16 BGG</p>
            <p className="text-muted-foreground text-sm mb-3">
              bei dem Beauftragten der Bundesregierung für die Belange von Menschen mit Behinderungen
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-foreground">Mauerstraße 53, 10117 Berlin</p>
              <p className="text-foreground">Telefon: +49 30 18 527 2805</p>
              <p className="text-foreground">
                E-Mail:{" "}
                <a href="mailto:info@schlichtungsstelle-bgg.de" className="text-primary hover:underline">
                  info@schlichtungsstelle-bgg.de
                </a>
              </p>
              <p className="text-foreground">
                Website:{" "}
                <a
                  href="https://www.schlichtungsstelle-bgg.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.schlichtungsstelle-bgg.de
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Legal Basis */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Rechtsgrundlagen</h2>
          <p className="text-foreground leading-relaxed">
            Diese Erklärung wurde gemäß den Anforderungen der folgenden Vorschriften erstellt:
          </p>
          <ul className="mt-4 space-y-2 text-foreground">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
              <span>Richtlinie (EU) 2016/2102 über den barrierefreien Zugang zu Websites und mobilen Anwendungen</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
              <span>Barrierefreie-Informationstechnik-Verordnung (BITV 2.0)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
              <span>Behindertengleichstellungsgesetz (BGG)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-primary rounded-full mt-2"></span>
              <span>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</span>
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 mt-12">
          <p className="text-muted-foreground text-sm text-center">
            Diese Erklärung wurde zuletzt am 7. Januar 2026 aktualisiert.
          </p>
          <div className="flex justify-center mt-4">
            <a href="/" className="text-primary hover:underline text-sm">
              ← Zurück zur Startseite
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
