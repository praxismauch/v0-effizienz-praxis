import { Suspense } from "react"
import TestingPageClient from "./page-client"
import { Loader2 } from "lucide-react"

export const metadata = {
  title: "Testing | Super Admin",
  description: "Test-Management und Qualitätssicherung",
}

export default function TestingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <TestingPageClient />
    </Suspense>
  )
}
