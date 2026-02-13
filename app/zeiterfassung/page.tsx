import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import ZeiterfassungPageClient from "./page-client"
import AppLayout from "@/components/app-layout"

export const metadata = {
  title: "Zeiterfassung | Effizienz Praxis",
  description: "Manipulationsarme Zeiterfassung mit KI-Plausibilitätsprüfung",
}

export default async function ZeiterfassungPage() {
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Laden...</div>}>
      <AppLayout>
        <ZeiterfassungPageClient 
          practiceId={practiceId}
          userId={user.id}
        />
      </AppLayout>
    </Suspense>
  )
}
