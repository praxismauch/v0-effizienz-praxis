import { Suspense } from "react"
import WellbeingPageClient from "./page-client"

export const metadata = {
  title: "Mitarbeiter-Wellbeing | Effizienz Praxis",
  description: "Burnout-Prävention, anonyme Stimmungsumfragen und Peer-Recognition für Ihr Praxis-Team",
}

export default function WellbeingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <WellbeingPageClient />
    </Suspense>
  )
}
