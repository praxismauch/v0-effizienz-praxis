import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Preise & Tarife | Flexible Pläne für jede Praxisgröße",
  description:
    "Transparente Preise ab 49€/Monat. Starter, Professional & Enterprise Tarife für Einzelpraxen bis MVZ. Alle Funktionen inklusive. 14 Tage kostenlos testen. Jährlich 20% sparen.",
  alternates: { canonical: "/preise" },
  openGraph: {
    title: "Preise & Tarife | Effizienz Praxis",
    description: "Ab 49€/Monat: Transparente Preise für Einzelpraxen bis MVZ. Alle Funktionen inklusive. 14 Tage kostenlos.",
    url: "/preise",
  },
}

export default function PreiseLayout({ children }: { children: React.ReactNode }) {
  return children
}
