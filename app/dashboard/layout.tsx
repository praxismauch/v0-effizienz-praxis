// cache-bust v53
import type React from "react"
import AppLayout from "@/components/app-layout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
