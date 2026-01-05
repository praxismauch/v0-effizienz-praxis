import { Suspense } from "react"
import QualitaetszirkelPageClient from "./page-client"
import AppLayout from "@/components/app-layout"

export const metadata = {
  title: "Qualitätszirkel | Effizienz Praxis",
  description: "Automatisierte Qualitätszirkel mit KI-gestützten Themenvorschlägen und Benchmarking",
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function QualitaetszirkelPage() {
  return (
    <AppLayout>
      <Suspense fallback={<LoadingFallback />}>
        <QualitaetszirkelPageClient />
      </Suspense>
    </AppLayout>
  )
}
