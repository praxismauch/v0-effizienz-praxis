import { Suspense } from "react"
import ErrorLogsPageClient from "./page-client"

export const dynamic = "force-dynamic"

export default function ErrorLogsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64">Laden...</div>}>
      <ErrorLogsPageClient />
    </Suspense>
  )
}
