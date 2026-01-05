export const dynamic = "force-dynamic"
import PageClient from "./page-client"
import { AppLayout } from "@/components/app-layout"
import { CalendarProvider } from "@/contexts/calendar-context"

export default function CalendarPage() {
  return (
    <AppLayout>
      <CalendarProvider>
        <PageClient />
      </CalendarProvider>
    </AppLayout>
  )
}
