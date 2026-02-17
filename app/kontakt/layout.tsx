import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kontakt | Beratung & Support für Ihre Praxis",
  description:
    "Kontaktieren Sie das Effizienz Praxis Team. Persönliche Beratung, technischer Support & individuelle Angebote für Ihre Arztpraxis oder MVZ. Antwort innerhalb von 24 Stunden.",
  alternates: { canonical: "/kontakt" },
  openGraph: {
    title: "Kontakt | Effizienz Praxis",
    description: "Persönliche Beratung & Support für Ihre Praxis. Antwort innerhalb von 24 Stunden.",
    url: "/kontakt",
  },
}

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return children
}
