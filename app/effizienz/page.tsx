import type { Metadata } from "next"
import { EffizienzPageClient } from "@/components/effizienz-page-client"

export const metadata: Metadata = {
  title: "Warum Effizienz entscheidend ist - Effizienz Praxis",
  description:
    "Erfahren Sie, warum Effizienz der Schlüssel zu einer erfolgreichen Praxis ist. Machen Sie den Effizienz-Test und entdecken Sie Ihr Optimierungspotenzial.",
}

export default function EffizienzPage() {
  return <EffizienzPageClient />
}
