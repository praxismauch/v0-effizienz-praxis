import { Suspense } from "react"
import DienstplanPageClient from "./page-client"

export const metadata = {
  title: "Dienstplan | Effizienz Praxis",
  description: "KI-gestützte Dienstplanung für faire, rechtssichere und effiziente Schichtplanung",
}

export default function DienstplanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Laden...</div>}>
      <DienstplanPageClient />
    </Suspense>
  )
}
