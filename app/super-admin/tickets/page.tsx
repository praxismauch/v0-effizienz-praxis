import { Suspense } from "react"
import SuperAdminTicketManager from "./page-client"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default function SuperAdminTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuperAdminTicketManager />
    </Suspense>
  )
}
