import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import SystemClient from "./page-client"

export const dynamic = "force-dynamic"

export default function SystemPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SystemClient />
    </Suspense>
  )
}
