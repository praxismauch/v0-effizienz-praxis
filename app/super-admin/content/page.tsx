import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import ContentClient from "./page-client"

export const dynamic = "force-dynamic"

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContentClient />
    </Suspense>
  )
}
