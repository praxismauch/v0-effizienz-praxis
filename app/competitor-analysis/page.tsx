import type { Metadata } from "next"
import CompetitorAnalysisClientPage from "./client-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Konkurrenzanalyse | Effizienz Praxis",
  description:
    "Analysieren Sie Ihre Wettbewerber mit KI-gestützter Marktanalyse und entdecken Sie Chancen in Ihrer Region.",
}

export default function CompetitorAnalysisPage() {
  return <CompetitorAnalysisClientPage />
}
