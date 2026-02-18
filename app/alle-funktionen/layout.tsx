import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Alle Funktionen | Praxismanagement von A-Z",
  description:
    "Komplette Funktionsübersicht von Effizienz Praxis: KI-Mitarbeiterentwicklung, Team-Management, Dienstplanung, Aufgabenverwaltung, QM, Zeiterfassung, Analytics & mehr. 46+ Module für Ihre Praxis.",
  alternates: { canonical: "/alle-funktionen" },
  openGraph: {
    title: "Alle Funktionen | Effizienz Praxis",
    description: "46+ Module: KI-Mitarbeiterentwicklung, Team-Management, Dienstplanung, QM & mehr.",
    url: "/alle-funktionen",
  },
}

export default function AlleFunktionenLayout({ children }: { children: React.ReactNode }) {
  return children
}
