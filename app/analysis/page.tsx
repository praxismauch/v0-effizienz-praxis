export const dynamic = "force-dynamic"
import { AppLayout } from "@/components/app-layout"
import PageClient from "./page-client"

export default function Page() {
  return (
    <AppLayout>
      <PageClient />
    </AppLayout>
  )
}
