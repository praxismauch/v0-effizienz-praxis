import { Suspense } from "react"
import SuperAdminUsers from "./page-client"
import { Loader2 } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Benutzerverwaltung - Super Admin",
  description: "Alle Systembenutzer verwalten",
}

export default function SuperAdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SuperAdminUsers />
    </Suspense>
  )
}
