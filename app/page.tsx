import type { Metadata } from "next"
import LandingPageClient from "@/components/landing-page-client"
import { SchemaOrgMarkup } from "@/components/schema-org-markup"

export const metadata: Metadata = {
  title: "Praxismanagement Software für Arztpraxen & MVZ | Effizienz Praxis",
  description:
    "Effizienz Praxis: Die All-in-One Praxismanagement-Software mit KI-gestützter Mitarbeiterentwicklung, Team-Management, Dienstplanung & QM. Speziell für Arztpraxen, Zahnarztpraxen und MVZ. 14 Tage kostenlos testen.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Effizienz Praxis | Praxismanagement Software für Arztpraxen & MVZ",
    description:
      "All-in-One Praxismanagement mit KI: Mitarbeiterentwicklung, Team-Management, Dienstplanung & QM. DSGVO-konform. Jetzt 14 Tage kostenlos testen.",
    url: "/",
  },
}

export default function HomePage() {
  return (
    <>
      <SchemaOrgMarkup />
      <LandingPageClient />
    </>
  )
}
