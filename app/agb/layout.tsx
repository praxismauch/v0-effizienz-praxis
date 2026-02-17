import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen (AGB)",
  description: "AGB der Effizienz Praxis GmbH. Allgemeine Geschäftsbedingungen für die Nutzung der Praxismanagement-Software.",
  alternates: { canonical: "/agb" },
  robots: { index: true, follow: true },
}

export default function AGBLayout({ children }: { children: React.ReactNode }) {
  return children
}
