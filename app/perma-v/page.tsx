import type { Metadata } from "next"
import PermaVPageClient from "./page-client"

export const metadata: Metadata = {
  title: "PERMA-V Modell | Effizienz Praxis",
  description: "Implementieren, überwachen und managen Sie das PERMA-V Wohlbefindensmodell für Ihr Team",
}

export default function PermaVPage() {
  return <PermaVPageClient />
}
