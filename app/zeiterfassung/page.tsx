import { Suspense } from "react"
import ZeiterfassungPageClient from "./page-client"
import AppLayout from "@/components/app-layout"

export const metadata = {
  title: "Zeiterfassung | Effizienz Praxis",
  description: "Manipulationsarme Zeiterfassung mit KI-Plausibilitätsprüfung",
}

export default function ZeiterfassungPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Laden...</div>}>
      <AppLayout>
        <ZeiterfassungPageClient />
      </AppLayout>
    </Suspense>
  )
}
