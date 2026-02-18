import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum der Effizienz Praxis GmbH. Angaben gemäß § 5 TMG, Kontaktdaten, Handelsregister und rechtliche Hinweise.",
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: true },
}

export default function ImpressumLayout({ children }: { children: React.ReactNode }) {
  return children
}
