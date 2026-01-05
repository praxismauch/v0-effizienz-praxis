import { Suspense } from "react"
import AppLayout from "@/components/app-layout"
import TimeReportsPageClient from "./page-client"

export const metadata = {
  title: "Monatsberichte | Zeiterfassung",
  description: "Monatliche Zeiterfassungs-Berichte und Auswertungen",
}

export default function TimeReportsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Laden...</div>}>
        <TimeReportsPageClient />
      </Suspense>
    </AppLayout>
  )
}
