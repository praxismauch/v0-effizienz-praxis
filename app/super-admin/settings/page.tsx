import { Suspense } from "react"
import SuperAdminSettings from "./page-client"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Einstellungen - Super Admin",
  description: "Super Admin Systemeinstellungen",
}

export default function SuperAdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuperAdminSettings />
    </Suspense>
  )
}
