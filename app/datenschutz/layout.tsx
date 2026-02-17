import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Datenschutzerklärung der Effizienz Praxis GmbH. Informationen zur Verarbeitung personenbezogener Daten, Ihren Rechten und unseren Datenschutzmaßnahmen gemäß DSGVO.",
  alternates: { canonical: "/datenschutz" },
  robots: { index: true, follow: true },
}

export default function DatenschutzLayout({ children }: { children: React.ReactNode }) {
  return children
}
