import { redirect } from "next/navigation"
import { getCurrentUserProfile } from "@/lib/auth"
import WartlistePageClient from "./page-client"

export const metadata = {
  title: "Warteliste | Super Admin",
  description: "Verwalten Sie die Warteliste für neue Interessenten",
}

export default async function WartlisteAdminPage() {
  const user = await getCurrentUserProfile()

  if (!user || user.role !== "super_admin") {
    redirect("/dashboard")
  }

  return <WartlistePageClient />
}
