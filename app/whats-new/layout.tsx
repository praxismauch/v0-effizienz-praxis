import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Changelog & Neue Funktionen | Was gibt es Neues?",
  description:
    "Alle Updates, neue Funktionen & Verbesserungen der Effizienz Praxis Software auf einen Blick. Erfahren Sie, was sich in der aktuellen Version geändert hat.",
  alternates: { canonical: "/whats-new" },
  openGraph: {
    title: "Changelog & Neue Funktionen | Effizienz Praxis",
    description: "Alle Updates & neue Funktionen der Effizienz Praxis Software auf einen Blick.",
    url: "/whats-new",
  },
}

export default function WhatsNewLayout({ children }: { children: React.ReactNode }) {
  return children
}
