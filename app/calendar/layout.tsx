import type React from "react"
import { CalendarProvider } from "@/contexts/calendar-context"

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CalendarProvider>{children}</CalendarProvider>
}
