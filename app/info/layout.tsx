import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "System-Info & Status",
  description: "Systeminformationen und Verbindungsstatus der Effizienz Praxis Plattform. Überprüfen Sie Datenbankverbindung, API-Status und Konfiguration.",
  alternates: { canonical: "/info" },
  robots: { index: false, follow: false },
}

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return children
}
