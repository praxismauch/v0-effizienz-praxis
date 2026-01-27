import type React from "react"
import { CalendarProvider } from "@/contexts/calendar-context"
import { AppLayout } from "@/components/app-layout"

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout>
      <CalendarProvider>{children}</CalendarProvider>
    </AppLayout>
  )
}
