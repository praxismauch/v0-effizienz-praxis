import type { Metadata } from "next"
import { AcademyPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Effizienz-Academy | Kurse & Weiterbildung",
  description: "Lernen Sie Schritt für Schritt, wie Sie Ihre Praxis effizienter gestalten können.",
}

export default function AcademyPage() {
  return <AcademyPageClient />
}
