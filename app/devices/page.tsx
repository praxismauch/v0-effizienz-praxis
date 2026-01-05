export const dynamic = "force-dynamic"
import { AppLayout } from "@/components/app-layout"
import DevicesPageClient from "./page-client"

export default function DevicesPage() {
  return (
    <AppLayout>
      <DevicesPageClient />
    </AppLayout>
  )
}
