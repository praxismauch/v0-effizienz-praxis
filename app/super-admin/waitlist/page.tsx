import { Suspense } from "react"
import WaitlistPageClient from "./page-client"

export const metadata = {
  title: "Warteliste | Super Admin",
  description: "Verwalten Sie die Warteliste für Coming Soon Anmeldungen",
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <WaitlistPageClient />
    </Suspense>
  )
}
