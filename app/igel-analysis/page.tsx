import type { Metadata } from "next"
import IgelAnalysisClientPage from "./client-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Selbstzahlerleistungen | Effizienz Praxis",
  description:
    "Analysieren Sie systematisch, welche Selbstzahlerleistungen sich für Ihre Praxis lohnen mit KI-gestützter Kostenanalyse und Rentabilitätsbewertung.",
}

export default function IgelAnalysisPage() {
  return <IgelAnalysisClientPage />
}
