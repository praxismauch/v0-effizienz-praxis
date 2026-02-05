import type { ReactNode } from "react"
import { SuperAdminLayout } from "@/components/super-admin-layout"

export default function SuperAdminRootLayout({ children }: { children: ReactNode }) {
  return <SuperAdminLayout>{children}</SuperAdminLayout>
}
