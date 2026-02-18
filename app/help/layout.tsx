import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hilfe & Support | Anleitungen, FAQ & Tutorials",
  description:
    "Hilfe-Center für Effizienz Praxis: Schritt-für-Schritt Anleitungen, Video-Tutorials, FAQ und persönlicher Support. Schnelle Antworten auf alle Fragen zur Praxismanagement-Software.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "Hilfe & Support | Effizienz Praxis",
    description: "Anleitungen, Video-Tutorials, FAQ und persönlicher Support für Effizienz Praxis.",
    url: "/help",
  },
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children
}
