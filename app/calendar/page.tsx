export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentPracticeId } from "@/lib/server/get-current-user"
import { getCalendarData } from "@/lib/server/get-calendar-data"
import PageClient from "./page-client"

export default async function CalendarPage() {
  // Fetch user and practice data server-side
  const [user, practiceId] = await Promise.all([
    getCurrentUser(),
    getCurrentPracticeId(),
  ])
  
  // Redirect if not authenticated
  if (!user) {
    redirect("/auth/login")
  }
  
  // Fetch calendar events in parallel if practice exists
  const calendarData = practiceId ? await getCalendarData(practiceId) : null

  return (
    <PageClient 
      initialEvents={calendarData?.events || []}
      practiceId={practiceId}
      user={user}
    />
  )
}
