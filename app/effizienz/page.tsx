import type { Metadata } from "next"
import { EffizienzPageClient } from "@/components/effizienz-page-client"

export const metadata: Metadata = {
  title: "Effizienz-Test für Ihre Arztpraxis | Optimierungspotenzial entdecken",
  description:
    "Machen Sie den kostenlosen Effizienz-Test für Ihre Arztpraxis. Erfahren Sie in 3 Minuten, wo Ihre Praxis Optimierungspotenzial hat und wie Sie bis zu 30% Zeit sparen. Jetzt starten.",
  alternates: { canonical: "/effizienz" },
  openGraph: {
    title: "Effizienz-Test: Wie effizient ist Ihre Praxis?",
    description: "Kostenloser Effizienz-Test: Entdecken Sie in 3 Minuten das Optimierungspotenzial Ihrer Arztpraxis.",
    url: "/effizienz",
  },
}

export default function EffizienzPage() {
  return <EffizienzPageClient />
}
